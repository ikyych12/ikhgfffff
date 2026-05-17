import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { initDb, getDb } from "./src/server/db.js";
import { dockerService } from "./src/server/docker.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "fs-extra";

const JWT_SECRET = "pterodactyl-mirror-secret-key-change-me";

async function startServer() {
  await initDb();
  const db = getDb();

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  app.use(cors());
  app.use(express.json());

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });
    const token = authHeader.split(" ")[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const adminOnly = (req: any, res: any, next: any) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
    next();
  };

  // --- Auth Routes ---
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });

  // --- API Routes ---
  app.get("/api/servers", authenticate, async (req, res) => {
    let servers;
    if (req.user.role === "admin") {
      servers = await db.all("SELECT * FROM servers");
    } else {
      servers = await db.all("SELECT * FROM servers WHERE owner_id = ?", [req.user.id]);
    }
    res.json(servers);
  });

  app.post("/api/admin/users", authenticate, adminOnly, async (req, res) => {
    const { username, password, role } = req.body;
    const hashed = bcrypt.hashSync(password, 10);
    const apiKey = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    try {
      await db.run("INSERT INTO users (username, password, role, api_key) VALUES (?, ?, ?, ?)", [username, hashed, role || 'user', apiKey]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/admin/users", authenticate, adminOnly, async (req, res) => {
    const users = await db.all("SELECT id, username, role, api_key FROM users");
    res.json(users);
  });

  app.post("/api/admin/servers", authenticate, adminOnly, async (req, res) => {
    const { name, owner_id, image, cpu, ram, storage } = req.body;
    const id = Math.random().toString(36).substring(2, 10);
    await db.run(
      "INSERT INTO servers (id, name, owner_id, image, cpu, ram, storage) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, name, owner_id, image, cpu, ram, storage]
    );
    await dockerService.createServer(id, { image, cpu, ram, name });
    res.json({ success: true, id });
  });

  app.post("/api/servers/:id/action", authenticate, async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;
    const server = await db.get("SELECT * FROM servers WHERE id = ?", [id]);
    if (!server) return res.status(404).json({ error: "Not found" });
    if (req.user.role !== 'admin' && server.owner_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    try {
      if (action === "start") {
        await dockerService.startServer(id);
        await db.run("UPDATE servers SET status = 'running' WHERE id = ?", [id]);
      } else if (action === "stop") {
        await dockerService.stopServer(id);
        await db.run("UPDATE servers SET status = 'stopped' WHERE id = ?", [id]);
      } else if (action === "restart") {
        await dockerService.stopServer(id);
        await dockerService.startServer(id);
        await db.run("UPDATE servers SET status = 'running' WHERE id = ?", [id]);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/servers/:id/stats", authenticate, async (req, res) => {
    const stats = await dockerService.getStats(req.params.id);
    res.json(stats);
  });

  // --- Bot API ---
  app.use("/api/bot", async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "Auth required" });
    const key = auth.replace("Bearer ", "");
    const user = await db.get("SELECT * FROM users WHERE api_key = ?", [key]);
    if (!user) return res.status(401).json({ error: "Invalid key" });
    (req as any).bot_user = user;
    next();
  });

  app.get("/api/bot/servers", async (req, res) => {
    const user = (req as any).bot_user;
    const servers = await db.all("SELECT * FROM servers WHERE owner_id = ?", [user.id]);
    res.json(servers);
  });

  // --- File Management ---
  app.get("/api/servers/:id/files", authenticate, async (req, res) => {
    const { id } = req.params;
    const { path: filePath = "" } = req.query;
    const fullPath = path.join(process.cwd(), "volumes", id, filePath as string);
    
    try {
      await fs.ensureDir(path.join(process.cwd(), "volumes", id));
      if (!fs.existsSync(fullPath)) return res.json([]);
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      const result = files.map(f => {
        const stats = fs.statSync(path.join(fullPath, f.name));
        return {
          name: f.name,
          isDir: f.isDirectory(),
          size: stats.size,
          modified: stats.mtime
        };
      });
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: "File access error" });
    }
  });

  app.delete("/api/servers/:id/files", authenticate, async (req, res) => {
    const { id } = req.params;
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ error: "Filename required" });
    
    try {
      const filePath = path.join(process.cwd(), "volumes", id, filename as string);
      await fs.remove(filePath);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  const upload = multer({ dest: 'uploads/' });
  app.post("/api/servers/:id/upload", authenticate, upload.single('file'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const destPath = path.join(process.cwd(), "volumes", id, req.file.originalname);
      await fs.move(req.file.path, destPath, { overwrite: true });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // --- External API Bot Endpoint ---
  app.get("/api/bot/status/:serverId", async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const { serverId } = req.params;

    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

    const user = users.find(u => u.api_key === apiKey);
    if (!user) return res.status(403).json({ error: "Invalid API Key" });

    const server = servers.find(s => s.id === serverId && (s.owner_id === user.id || user.role === 'admin'));
    if (!server) return res.status(404).json({ error: "Node not found or access denied" });

    try {
      const stats = await DockerService.getStats(serverId);
      res.json({
        id: server.id,
        name: server.name,
        status: server.status,
        resources: {
          cpu: stats.cpu,
          ram: stats.ram,
          limit_cpu: server.cpu,
          limit_ram: server.ram
        }
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch node status" });
    }
  });

  // --- Vite / Static Assets ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  // --- WebSocket Logic ---
  io.on("connection", (socket) => {
    socket.on("join-server", async (serverId) => {
      socket.join(serverId);
      const logs = await dockerService.getLogs(serverId);
      socket.emit("logs", logs);
    });

    socket.on("command", async ({ serverId, command }) => {
      // Real command exec would go here
      // For now, mirror it to logs
      io.to(serverId).emit("logs", `\nuser@server:~$ ${command}\nExecuted command: ${command}`);
    });
  });

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Pterodactyl Mirror running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

import Docker from 'dockerode';
import fs from 'fs-extra';
import path from 'path';

export class DockerService {
  private docker: Docker | null = null;
  private isMock: boolean = false;
  private mockServers: Map<string, any> = new Map();

  constructor() {
    try {
      // Check if docker socket exists
      if (fs.existsSync('/var/run/docker.sock')) {
        this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
        console.log('Docker connected via socket.');
      } else {
        console.warn('Docker socket not found. Switching to MOCK MODE.');
        this.isMock = true;
      }
    } catch (err) {
      console.error('Failed to connect to Docker:', err);
      this.isMock = true;
    }
  }

  async createServer(id: string, options: { image: string, cpu: number, ram: number, name: string }) {
    if (this.isMock) {
      this.mockServers.set(id, { 
        id, 
        status: 'stopped', 
        options,
        logs: [`[SYSTEM] Server ${options.name} created (MOCK MODE)`]
      });
      // Create mock volume folder and a dummy file for the UI
      const volumePath = path.join(process.cwd(), 'volumes', id);
      await fs.ensureDir(volumePath);
      await fs.writeFile(path.join(volumePath, 'server.properties'), '# Pterodactyl-Mirror Mock Configuration\nmax-players=20\nserver-port=25565');
      await fs.writeFile(path.join(volumePath, 'eula.txt'), 'eula=true');
      return { id };
    }

    const container = await this.docker!.createContainer({
      Image: options.image || 'ubuntu:22.04',
      name: `pterodactyl-${id}`,
      HostConfig: {
        Memory: options.ram * 1024 * 1024,
        NanoCpus: options.cpu * 1e9,
        Binds: [`${path.join(process.cwd(), 'volumes', id)}:/home/container`],
      },
      Labels: { 'pterodactyl-mirror': 'true', 'server-id': id }
    });
    
    // Create volume dir
    await fs.ensureDir(path.join(process.cwd(), 'volumes', id));
    
    return container;
  }

  async startServer(id: string) {
    if (this.isMock) {
      const s = this.mockServers.get(id);
      if (s) {
        s.status = 'running';
        s.logs.push(`[SYSTEM] Starting server...`);
        s.logs.push(`[SYSTEM] Container started.`);
      }
      return;
    }
    const container = this.docker!.getContainer(`pterodactyl-${id}`);
    await container.start();
  }

  async stopServer(id: string) {
    if (this.isMock) {
      const s = this.mockServers.get(id);
      if (s) {
        s.status = 'stopped';
        s.logs.push(`[SYSTEM] Server stopped.`);
      }
      return;
    }
    const container = this.docker!.getContainer(`pterodactyl-${id}`);
    await container.stop();
  }

  async getStats(id: string) {
    if (this.isMock) {
      const s = this.mockServers.get(id);
      if (!s || s.status !== 'running') return { cpu: 0, ram: 0 };
      return { 
        cpu: Math.random() * 5, 
        ram: (s.options.ram * 0.1) + (Math.random() * 50) 
      };
    }
    const container = this.docker!.getContainer(`pterodactyl-${id}`);
    const stats = await container.stats({ stream: false });
    // Simplify stats for the example
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
    const ramUsage = stats.memory_stats.usage / (1024 * 1024);
    return { cpu: cpuPercent || 0, ram: ramUsage || 0 };
  }

  async getLogs(id: string) {
    if (this.isMock) {
      return (this.mockServers.get(id)?.logs || []).join('\n');
    }
    const container = this.docker!.getContainer(`pterodactyl-${id}`);
    const logs = await container.logs({ stdout: true, stderr: true, tail: 100 });
    return logs.toString();
  }

  async deleteServer(id: string) {
    if (this.isMock) {
      this.mockServers.delete(id);
      return;
    }
    const container = this.docker!.getContainer(`pterodactyl-${id}`);
    try {
      await container.stop();
    } catch(e) {}
    await container.remove({ force: true });
    await fs.remove(path.join(process.cwd(), 'volumes', id));
  }
}

export const dockerService = new DockerService();

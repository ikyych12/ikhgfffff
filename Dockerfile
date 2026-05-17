# Dockerfile untuk Deployment Real ke VPS
FROM node:20-slim

WORKDIR /app

# Install dependencies untuk Dockerode
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Build frontend
RUN npm run build

EXPOSE 3000

# Jalankan server
# Note: Saat menjalankan container ini, pastikan mount docker.sock
# docker run -v /var/run/docker.sock:/var/run/docker.sock -p 3000:3000
CMD ["npm", "start"]

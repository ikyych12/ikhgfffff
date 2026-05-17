# Pterodactyl Mirror Panel

A full-stack server management panel with real Docker integration.

## Features
- **Real Docker Integration**: Uses `dockerode` to manage containers.
- **Resource Limits**: Enforces CPU and RAM limits via Docker.
- **Live Console**: Real-time log streaming and command execution via WebSockets.
- **File Management**: Volume-based file persistence.
- **Full API**: Bot-ready API with API Key authentication.

## Preview Environment Note
This application is running in a restricted environment (Cloud Run) where nested Docker access is not available. 
**The backend has automatically switched to MOCK MODE.** 
In this mode, interactions are simulated to demonstrate the UI and logic flow.

## Running Locally (Real Mode)
To use the real Docker functionality:
1. Ensure Docker is installed on your host.
2. Clone this repository.
3. Run `npm install`.
4. Run `npm run dev`.
5. Ensure the user running the app has access to `/var/run/docker.sock`.

## Login Credentials
- **Username**: `admin`
- **Password**: `admin123`

## Admin Panel
Access the Admin panel to create users and assign server nodes.
- **API Key**: Automatically generated for each user.
- **Resource Allocation**: CPU (vCores) and RAM (MB).

# Microservices and Microfrontends Example

This project demonstrates a practical implementation of microservices and microfrontends architecture. The application consists of a main shell service that acts as a container, displaying different microfrontends in tabbed interfaces. Each tab loads a microfrontend from one of four specialized microservices.

## Architecture Overview

- **Shell**: Main container application that hosts the microfrontends
- **TW-auth**: Authentication microservice
- **TW-chat**: Chat functionality microservice  
- **TW-task**: Task management microservice
- **TW-docs**: Document handling microservice

## Prerequisites

- Docker installed on your system
- Kubernetes (kubectl) configured and running
- Access to a Kubernetes cluster

## Quick Deployment

### 1. Build Docker Images

Run the following commands to build Docker images for all services:

```bash
# Build all microservices images
cd shell && docker build -t tw-shell:latest . && cd ..
cd TW-auth && docker build -t tw-auth:latest . && cd ..
cd TW-chat && docker build -t tw-chat:latest . && cd ..
cd TW-docs && docker build -t tw-docs:latest . && cd ..
cd TW-tasks && docker build -t tw-tasks:latest . && cd ..
```

### 2. Deploy to Kubernetes
Apply all Kubernetes configuration files:

```bash
kubectl apply -f k8s/shell.yaml
kubectl apply -f k8s/tw-auth.yaml
kubectl apply -f k8s/tw-chat.yaml
kubectl apply -f k8s/tw-docs.yaml
kubectl apply -f k8s/tw-tasks.yaml
kubectl apply -f k8s/ingress.yaml
```
### 3. Expose Services
Port-forward services to access them locally:

```bash
# Shell service - Main application
kubectl port-forward service/tw-shell-service 8080:80

# Individual microservices (run in separate terminals if needed)
kubectl port-forward service/tw-auth-service 8081:80
kubectl port-forward service/tw-chat-service 8082:80
kubectl port-forward service/tw-docs-service 8083:80
kubectl port-forward service/tw-tasks-service 8084:80
```

### Access the Application
After deploying and port-forwarding, access the application through:

- **Main Shell**: http://localhost:8080
- **Auth Service**: http://localhost:8081
- **Chat Service**: http://localhost:8082
- **Docs Service**: http://localhost:8083
- **Tasks Service**: http://localhost:8084

### Project Structure
```bash
project/
├── shell/                 # Main shell application
├── TW-auth/              # Authentication microservice
├── TW-chat/              # Chat microservice
├── TW-docs/              # Documents microservice
├── TW-tasks/             # Tasks microservice
└── k8s/                  # Kubernetes configuration files
    ├── shell.yaml
    ├── tw-auth.yaml
    ├── tw-chat.yaml
    ├── tw-docs.yaml
    ├── tw-tasks.yaml
    └── ingress.yaml
``` 
### Notes
- The shell service acts as the main entry point and container for all microfrontends
- Each microservice is independently deployable and scalable
- The ingress configuration provides routing between services
- Make sure all services are running before accessing the main shell application

For development or troubleshooting, you can access individual microservices directly through their respective ports.
#!/bin/bash

echo "🔨 Construyendo TW-shell..."
cd shell
docker build --no-cache -t tw-shell:latest .
cd ..

echo "🔨 Construyendo TW-auth..."
cd TW-auth
docker build --no-cache -t tw-auth:latest .
cd ..

echo "🚀 Aplicando despliegues..."
kubectl apply -f k8s/shell.yaml
kubectl apply -f k8s/TW-auth.yaml

echo "🔗 Activando ingress..."
kubectl apply -f k8s/ingress.yaml

echo "✔ Todo listo!"

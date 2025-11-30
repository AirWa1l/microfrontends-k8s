# Manualmente construimos las imagenes de los servicios/microfrontends
# Modifiquen este también para hacer mucho más corto al momento de ejecutarlo todo
cd shell
docker build -t tw-shell:latest .
cd ..

cd TW-auth
docker build -t tw-auth:latest .
cd ..

cd TW-chat
docker build -t tw-chat:latest .
cd ..

cd TW-docs
docker build -t tw-docs:latest .
cd ..

cd TW-tasks
docker build -t tw-tasks:latest .

cd ..
kubectl apply -f k8s/shell.yaml
kubectl apply -f k8s/tw-auth.yaml
kubectl apply -f k8s/tw-chat.yaml
kubectl apply -f k8s/tw-docs.yaml
kubectl apply -f k8s/tw-tasks.yaml
# ingress siempre debemos ejecutarlo, pues este es el puente entre los servicios internos del Cluster en Kubernetes
kubectl apply -f k8s/ingress.yaml

# Exponer servicios
kubectl port-forward service/tw-shell-service 8080:80 
kubectl port-forward service/tw-auth-service 8081:80 
kubectl port-forward service/tw-chat-service 8082:80 
kubectl port-forward service/tw-docs-service 8083:80 
kubectl port-forward service/tw-tasks-service 8084:80

# En caso de:
# kubectl delete pod -l app=tw-...
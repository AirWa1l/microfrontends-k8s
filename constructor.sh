# Manualmente construimos las imagenes de los servicios/microfrontends
# Modifiquen este también para hacer mucho más corto al momento de ejecutarlo todo
cd shell
docker build -t tw-shell:latest .
cd ..

cd TW-auth
docker build -t tw-auth:latest .

cd ..
kubectl apply -f k8s/shell.yaml
kubectl apply -f k8s/tw-auth.yaml
# ingress siempre debemos ejecutarlo, pues este es el puente entre los servicios internos del Cluster en Kubernetes
kubectl apply -f k8s/ingress.yaml

# Exponer servicios
kubectl port-forward service/tw-shell-service 8080:80
kubectl port-forward service/tw-auth-service 8081:80
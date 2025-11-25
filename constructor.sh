# Manualmente construimos las imagenes de los servicios/microfrontends
# Modifiquen este también para hacer mucho más corto al momento de ejecutarlo todo
cd shell
docker build -t tw-shell:latest .

cd ..
kubectl apply -f k8s/shell.yaml
# ingress siempre debemos ejecutarlo, pues este es el puente entre los servicios internos del Cluster en Kubernetes
kubectl apply -f k8s/ingress.yaml
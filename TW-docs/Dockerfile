FROM python:3.9-slim

WORKDIR /app

# Instalar dependencias
RUN pip install --no-cache-dir flask

# Copiar código fuente
COPY app/ .

# Exponer puertos (5000 para app, 83 para health check)
EXPOSE 5000 83

CMD ["python", "server.py"]
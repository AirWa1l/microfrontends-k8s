FROM python:3.11-slim

WORKDIR /app

# Dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar aplicación
COPY app/ /app/

# Usuario no-root
RUN useradd -m -u 1001 chatuser && chown -R chatuser:chatuser /app
USER chatuser

EXPOSE 8082

# Ejecutar con gunicorn usando eventlet para websockets
CMD ["python", "app.py"]


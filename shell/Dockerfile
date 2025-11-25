FROM python:3.11-slim

WORKDIR /app

# Copiar requirements y instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar toda la aplicación
COPY app/ /app/

# Crear usuario no-root para seguridad
RUN useradd -m -u 1000 shelluser && chown -R shelluser:shelluser /app
USER shelluser

EXPOSE 8080

# Usar gunicorn para producción
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "60", "app:app"]
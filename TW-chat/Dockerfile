FROM node:20-alpine

WORKDIR /app

# Copiar manifiestos de dependencias primero para aprovechar la cache de capas
COPY app/package*.json ./
RUN npm install --production

# Copiar el resto de la aplicación
COPY app/ ./

# Crear usuario no-root
RUN adduser -D -u 1001 chatuser && chown -R chatuser:chatuser /app
USER chatuser

ENV PORT=8082
EXPOSE 8082

# Ejecutar servidor Node (Socket.IO)
CMD ["node", "server.js"]


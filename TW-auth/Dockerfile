FROM node:18-alpine

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY app/package.json .
RUN npm install --production

# Copiar toda la aplicación
COPY app/ .

# Crear usuario no-root para seguridad
# RUN addgroup -g 1000 authuser && \
#    adduser -D -u 1000 -G authuser authuser && \
#    chown -R authuser:authuser /app

# USER authuser

EXPOSE 5000 81

CMD ["node", "server.js"]


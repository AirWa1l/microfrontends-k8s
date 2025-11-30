FROM node:18-alpine

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY app/package.json .
RUN npm install --production

# Copiar toda la aplicación
COPY app/ .

EXPOSE 5000 81

CMD ["node", "server.js"]

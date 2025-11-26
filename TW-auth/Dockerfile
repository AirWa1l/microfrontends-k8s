# Imagen base de Node
FROM node:18

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos el backend y el frontend
COPY backend ./backend
COPY frontend ./frontend

# Instalamos dependencias solo del backend
RUN npm install --prefix backend

# Puerto expuesto dentro del contenedor (coincide con tu server.js)
EXPOSE 80

# Comando para ejecutar tu servicio
CMD ["node", "backend/server.js"]

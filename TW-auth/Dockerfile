FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

# Templates → raíz del servidor
COPY app/templates/index.html /usr/share/nginx/html/index.html

# Resto de archivos estáticos
COPY app/style /usr/share/nginx/html/style/
COPY app/app.js /usr/share/nginx/html/app.js

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


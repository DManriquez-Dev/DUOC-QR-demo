FROM node:20-alpine AS frontend-build
WORKDIR /app
ARG VITE_API_QR_URL
ARG VITE_API_UBICACION_URL
ENV VITE_API_QR_URL=${VITE_API_QR_URL}
ENV VITE_API_UBICACION_URL=${VITE_API_UBICACION_URL}
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache openssl
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /etc/nginx/certs \
  && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/certs/cake-web.cl.key \
  -out /etc/nginx/certs/cake-web.cl.crt \
  -subj "/CN=cake-web.cl/O=cake-web.cl"
CMD ["nginx", "-g", "daemon off;"]

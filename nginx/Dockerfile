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
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

CMD ["nginx", "-g", "daemon off;"]
# Stage 1: Build static files
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_BASE=/
ARG VITE_BASENAME=/
ENV VITE_BASE=${VITE_BASE}
ENV VITE_BASENAME=${VITE_BASENAME}

COPY package*.json ./
COPY vite.config.ts ./
COPY . .
RUN npm ci
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8081
CMD ["nginx", "-g", "daemon off;"] 
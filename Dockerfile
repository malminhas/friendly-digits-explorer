# Stage 1: Build static files
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY bun.lockb ./
COPY vite.config.ts ./
COPY . .
RUN npm ci
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html/friendly-digits-explorer
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8081
CMD ["nginx", "-g", "daemon off;"] 
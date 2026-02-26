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
ARG VITE_BASE=/
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public/data /usr/share/nginx/html/data
COPY nginx.conf /etc/nginx/nginx-default.conf
COPY terraform/nginx-subdir.conf.template /etc/nginx/
# When VITE_BASE is a subdir (e.g. /friendly-digits-explorer/), generate config with alias to serve assets from root
RUN BASE_PATH=$(echo "$VITE_BASE" | sed 's:^/::;s:/$::') && \
    if [ -n "$BASE_PATH" ]; then \
        sed "s|__BASE_PATH__|$BASE_PATH|g" /etc/nginx/nginx-subdir.conf.template > /etc/nginx/nginx.conf; \
    else \
        cp /etc/nginx/nginx-default.conf /etc/nginx/nginx.conf; \
    fi
EXPOSE 8081
CMD ["nginx", "-g", "daemon off;"] 
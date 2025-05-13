
# Stage 1: Build static files
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_BASE=/
ARG VITE_BASENAME=/
ENV VITE_BASE=${VITE_BASE}
ENV VITE_BASENAME=${VITE_BASENAME}

# Copy package files first (for better caching)
COPY package*.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci

# Copy all source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
# Copy the built application
COPY --from=builder /app/dist /usr/share/nginx/html
# Explicitly copy the data directory to ensure MNIST files are included
COPY --from=builder /app/public/data /usr/share/nginx/html/data
# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8081
CMD ["nginx", "-g", "daemon off;"]

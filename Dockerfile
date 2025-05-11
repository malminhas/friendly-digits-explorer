# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy only package files first to leverage cache
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only the necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/bun.lockb ./

# Install production dependencies including Vite
RUN npm ci --production && \
    npm install vite

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Expose the application port
EXPOSE 8081

# Debug: List contents of dist directory
RUN ls -la dist

# Start the application using Vite preview directly
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "8081"] 
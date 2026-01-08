# Backend Dockerfile - NestJS API
FROM node:20-alpine AS base

# Install dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# Build stage
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy node_modules from base
COPY --from=base /app/node_modules ./node_modules

# Copy package.json
COPY package*.json ./

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy migrations source files (required for TypeORM CLI)
COPY --from=builder /app/src/migrations ./src/migrations
COPY --from=builder /app/src/config ./src/config
COPY --from=builder /app/src/entities ./src/entities

EXPOSE 3001

# Run migrations and start server (usando archivos compilados .js)
CMD ["sh", "-c", "npm run migration:run:prod && node dist/main"]

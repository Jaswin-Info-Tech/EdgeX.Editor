# Multi-stage build for EdgeX Editor (Vite + React)
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source and build static assets
COPY . .

# Build-time API URL for Vite
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Runtime image: NGINX serving static dist
FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html

# Replace default nginx site config with SPA-friendly config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder stage
COPY --from=builder /app/dist ./

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

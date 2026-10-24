# Multi-stage Docker build for VPS Control Panel
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root config
COPY package.json ./

# Copy packages
COPY apps/client/package*.json ./apps/client/
COPY apps/server/package*.json ./apps/server/
COPY apps/agent/package*.json ./apps/agent/

# Install dependencies
RUN cd apps/server && npm install
RUN cd ../client && npm install
RUN cd ../agent && npm install

# Copy source files
COPY apps/client ./apps/client
COPY apps/server ./apps/server
COPY apps/agent ./apps/agent

# Build frontend and compile server
RUN cd apps/client && npm run build
RUN cd ../server && npm run build
RUN cd ../agent && npm run build

# Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/apps/client/dist ./apps/client/dist
COPY --from=builder /app/apps/agent ./apps/agent

# Ensure data directory exists
RUN mkdir -p /app/apps/server/data

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/api/health || exit 1

CMD ["node", "apps/server/dist/index.js"]

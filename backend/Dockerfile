# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production Stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node migrations/ ./migrations/
USER node
EXPOSE 5000
CMD ["node", "dist/server.js"]

FROM node:20-alpine AS frontend-builder
WORKDIR /app

RUN apk upgrade --no-cache

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm ci
COPY client/ ./client/

RUN npm run build -w client

FROM node:20-alpine AS backend-builder
WORKDIR /app

RUN apk upgrade --no-cache

COPY package*.json ./
COPY server/package*.json ./server/

RUN npm ci --omit=dev
COPY server/ ./server/

FROM node:20-alpine
WORKDIR /app

RUN apk upgrade --no-cache

COPY --from=frontend-builder /app/client/dist ./dist

COPY --from=backend-builder /app/server ./server
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package*.json ./

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "index.js"]


FROM node:18-slim AS builder
WORKDIR /app
COPY package.json  ./
RUN npm install --no-audit --progress=false
COPY . .
RUN npm run build

FROM node:18-slim AS api_deps
WORKDIR /app/api
COPY api/package.json  ./
RUN npm install --omit=dev --no-audit --progress=false

FROM node:18-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=api_deps /app/api/node_modules ./api/node_modules
COPY api ./api
COPY --from=builder /app/dist ./dist
EXPOSE 8080 9229
CMD ["node", "api/server.js"]

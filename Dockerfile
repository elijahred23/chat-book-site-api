FROM node:18-slim AS builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend --no-audit --progress=false
COPY frontend ./frontend
COPY shared ./shared
RUN npm --prefix frontend run build

FROM node:18-slim AS api_deps
WORKDIR /app/api
COPY api/package*.json  ./
RUN npm ci --omit=dev --no-audit --progress=false

FROM node:18-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*
ENV PIP_BREAK_SYSTEM_PACKAGES=1
COPY package.json ./
COPY --from=api_deps /app/api/node_modules ./api/node_modules
COPY api ./api
COPY shared ./shared
COPY --from=builder /app/frontend/dist ./frontend/dist
RUN pip3 install --no-cache-dir -r api/requirements.txt
EXPOSE 8080 9229
CMD ["node", "api/server.js"]

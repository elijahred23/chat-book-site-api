FROM node:18-slim AS builder
WORKDIR /app

# Install frontend dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy entire frontend source and build
COPY . .
RUN npm run build  


FROM node:18-slim
WORKDIR /app

# Install Puppeteer + Chrome deps
RUN apt-get update && apt-get install -y --no-install-recommends \
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
  libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
  libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
  libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 \
  libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation \
  libappindicator1 libnss3 lsb-release xdg-utils wget gnupg \
  && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
  && apt-get update && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/*


# Copy backend code
COPY api ./api

# Install backend dependencies
WORKDIR /app/api
COPY api/package.json api/package-lock.json ./
RUN npm install --production

# Move back to root
WORKDIR /app

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Expose API port
EXPOSE 8080

# Start unified Express server (serves frontend + backend)
CMD ["node", "api/server.js"]

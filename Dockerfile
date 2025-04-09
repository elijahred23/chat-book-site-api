# Use a specific slim Node version
FROM node:18-slim

# Set the working directory
WORKDIR /app

# Set the npm registry once to speed up npm installs
RUN npm config set registry https://registry.npmjs.org/

# Copy and install root dependencies
COPY package.json .
RUN npm install

# Copy only the start-services script for now
COPY start-services.sh .

# Copy the application code, except for the api folder which will be handled separately
COPY . .

# Copy and install dependencies for the api folder
WORKDIR /app/api
COPY api/package.json .
RUN npm install

# Return to the main app directory
WORKDIR /app

# Make start-services.sh executable
RUN chmod +x /app/start-services.sh

# Install dependencies for Puppeteer and Chrome in a single layer
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

# Expose necessary ports
EXPOSE 3005 
EXPOSE 8080 

# Set the default command to run the application
CMD ["/app/start-services.sh"]

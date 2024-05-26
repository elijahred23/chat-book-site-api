FROM node

# Set the working directory
WORKDIR /app

# Copy package.json and start-services.sh
COPY package.json .
COPY start-services.sh . 

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Add these lines to copy the api folder to the container
COPY api /app/api

# Add these lines to install the api packages
WORKDIR /app/api
COPY /api/package.json .
RUN npm install

# Make start-services.sh executable
RUN chmod +x /app/start-services.sh

# Install necessary dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
  gconf-service \
  libasound2 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgcc1 \
  libgconf-2-4 \
  libgdk-pixbuf2.0-0 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  ca-certificates \
  fonts-liberation \
  libappindicator1 \
  libnss3 \
  lsb-release \
  xdg-utils \
  wget

# Install Google Chrome
RUN apt-get update && apt-get install -y wget gnupg \
  && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

# Return to the original working directory
WORKDIR /app

# Expose ports
EXPOSE 3005 
EXPOSE 3006 

# Set the default command to run the application
CMD ["/app/start-services.sh"]

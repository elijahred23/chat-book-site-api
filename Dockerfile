FROM node

WORKDIR /app

COPY package.json .
COPY start-services.sh . 
RUN npm i

COPY . .

# Add these lines to copy the api folder to the container
COPY api /app/api

# Add these lines to install the api packages
WORKDIR /app/api
COPY /api/package.json .
RUN npm i
RUN chmod +x /app/start-services.sh

WORKDIR /app

EXPOSE 3005 
EXPOSE 3006 

CMD ["/app/start-services.sh"]
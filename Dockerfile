FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package manifests and install dependencies (none required for static site)
COPY package*.json ./
RUN npm install --production --no-audit --no-fund || true

# Bundle app source
COPY . .

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server.js"]

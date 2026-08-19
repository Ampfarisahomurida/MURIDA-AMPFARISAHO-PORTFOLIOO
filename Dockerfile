FROM node:18-slim

# Install build tools required for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential python3 make g++ libsqlite3-dev ca-certificates wget && \
	rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm install --production --no-audit --no-fund

# Bundle app source
COPY . .

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server.js"]

# Use official Node image
FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# CLEAN install inside Linux container (no Windows binaries)
RUN npm ci --only=production && npm cache clean --force

# Install DEV dependencies too (for tsx, esbuild, etc.)
RUN npm ci

# Copy all source code
COPY . .

RUN npm install


# Expose API port
EXPOSE 4000

# Default command (can be overridden by docker-compose)
CMD ["npm", "run", "start:api"]

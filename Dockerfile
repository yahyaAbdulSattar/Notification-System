# Use official Node image
FROM node:20-slim

# Install system dependencies (for Prisma)
RUN apt-get update -y && apt-get install -y openssl

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 4000
CMD ["npm", "run", "start:api"]

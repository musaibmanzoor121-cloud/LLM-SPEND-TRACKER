# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json* ./
# We use npm install since bun is not guaranteed in standard node image (though bun.lock exists)
RUN npm install

# Copy the rest of the application
COPY . .

# Build both frontend and backend
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

# Copy package config
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the compiled output from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 3000

# Start the Node.js server
CMD ["npm", "run", "start"]

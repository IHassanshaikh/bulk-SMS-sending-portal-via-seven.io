FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 3002

# Set default environment variables
ENV PORT=3002
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]

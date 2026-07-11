FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy backend source code
COPY . .

# Ensure database.json template exists if not present
RUN echo '{"cache": [], "history": []}' > database.template.json

# Expose backend port
EXPOSE 5000

# Start backend server
CMD ["node", "src/server.js"]

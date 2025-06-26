# Use official Node.js 20 image
FROM node:20-alpine

# Install Python 3 and make
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the app
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port 8080 (Cloud Run expects this)
EXPOSE 8080

# Start the Next.js server on port 8080
ENV PORT 8080
ENV NODE_ENV production

CMD ["npm", "start"] 
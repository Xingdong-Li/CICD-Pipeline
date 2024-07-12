# Use the official Node.js image.
FROM node:18

# Create and change to the app directory.
WORKDIR /app

# Install app dependencies.
COPY package*.json ./
RUN npm install

# Copy app source code.
COPY . .

ENV PORT=8080

# Expose the port the app runs on.
EXPOSE 8080

# Start the app.
CMD ["node", "src/app.js"]

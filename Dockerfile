# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Give execute permission to the wait-for-localstack.sh script
RUN chmod +x ./wait-for-localstack.sh

# Expose the application port
EXPOSE 3000

# Define the command to run the application
CMD ["node", "src/app.js"]

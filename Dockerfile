# Use an official Node.js image as the base image
FROM node:18.17.1

# # Declaring env
# ENV NODE_ENV development

# Set the working directory in the container to /app
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the application dependencies and set the environment variables id
# RUN npm install
RUN npm install

# Copy the rest of the application files to the container
COPY . .

# Expose port to the host
EXPOSE 8081

# Specify the command to run when the container starts
CMD ["node", "index.js"]

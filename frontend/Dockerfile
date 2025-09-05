# ========================================================================
# FRONTEND DOCKERFILE
# Purpose: Build and serve the React application using Nginx
# Multi-stage build:
#   1. Build React app with Node.js
#   2. Serve static files with Nginx
# ========================================================================



# ------------------------------------------------------------------------
# STAGE 1: BUILD THE REACT APPLICATION
# ------------------------------------------------------------------------
FROM node:18 as build

# Set working directory inside the container
WORKDIR /app

# Copy dependency files first (leveraging Docker cache)
COPY package.json ./
COPY package-lock.json ./

# Pass build-time API URL variable into React app
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the React production-ready static files
RUN npm run build

# ------------------------------------------------------------------------
# STAGE 2: SERVE THE BUILT APPLICATION WITH NGINX
# ------------------------------------------------------------------------
FROM nginx:stable-alpine

# Copy build output from previous stage into Nginx's default public folder
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 (default HTTP port for Nginx)
EXPOSE 80

# Start Nginx in foreground mode (required for Docker)
CMD ["nginx", "-g", "daemon off;"]

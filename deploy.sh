#!/bin/bash

echo "Starting deployment..."

# Navigate to project directory
cd /var/www/brewmecoffee

# Pull latest changes
echo "Pulling latest changes..."
git pull

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Restart the application with PM2
echo "Restarting application..."
pm2 restart brewmecoffee || pm2 start npm --name "brewmecoffee" -- start

# Reload Nginx
echo "Reloading Nginx..."
systemctl reload nginx

echo "Deployment completed!"

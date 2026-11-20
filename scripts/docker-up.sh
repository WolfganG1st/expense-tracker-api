#!/bin/bash
# Start the application in development mode using Docker

cd "$(dirname "$0")/.." || exit 1

echo "Starting expense-tracker-api application in development mode..."

# Check if the Node image is already pulled
if ! docker image inspect node:22.12.0-alpine3.19 &>/dev/null; then
  echo "Pulling Node.js image. This may take a moment..."
  # Try to pull with a timeout
  timeout 30s docker pull node:22.12.0-alpine3.19

  # Check if the pull was successful
  if [ $? -ne 0 ]; then
    echo "Network timeout when pulling the Node.js image."
    echo "You have two options:"
    echo "1. Check your internet connection and try again"
    echo "2. Start the application without Docker using: pnpm dev"
    exit 1
  fi
fi

# Start the container
docker-compose up --build dev db

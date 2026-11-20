#!/bin/bash
# Stop the Docker containers for the expense-tracker-api application

cd "$(dirname "$0")/.." || exit 1

echo "Stopping expense-tracker-api Docker containers..."
docker-compose down

echo "All containers have been stopped."

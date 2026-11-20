#!/bin/bash
# Access a bash shell in the running Docker container

cd "$(dirname "$0")/.." || exit 1

# Default to the dev service
SERVICE=${1:-dev}

echo "Opening bash shell in the $SERVICE container..."
docker-compose exec $SERVICE sh

# If the container isn't running, inform the user
if [ $? -ne 0 ]; then
  echo "Error: Container is not running. Start it with './scripts/docker-up.sh' first."
  exit 1
fi

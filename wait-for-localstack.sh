#!/bin/sh

set -e

# Function to check if Localstack services are up
check_localstack() {
  echo "Checking Localstack health status..."
  local response=$(curl -s http://localstack:4566/_localstack/health)
  echo $response
  echo $response | grep "\"s3\": \"available\"" > /dev/null && echo $response | grep "\"dynamodb\": \"available\"" > /dev/null
}

# Wait until Localstack is responding
until check_localstack; do
  echo "Waiting for Localstack to be ready..."
  sleep 5
done

echo "Localstack is ready."

# Execute the provided command
exec "$@"

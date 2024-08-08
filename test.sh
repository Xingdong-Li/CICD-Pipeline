#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Build and run the test containers
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Retrieve the dynamically allocated port for Localstack
LOCALSTACK_PORT=$(docker-compose -f docker-compose.test.yml port localstack 4566 | cut -d: -f2)

# Set environment variables for the tests
export DYNAMODB_ENDPOINT=http://localhost:$LOCALSTACK_PORT
export S3_ENDPOINT=http://localhost:$LOCALSTACK_PORT

# Capture the exit status of the tests
EXIT_CODE=$(docker-compose -f docker-compose.test.yml ps -q api-test | xargs docker inspect -f '{{ .State.ExitCode }}')

# Clean up the test containers
docker-compose -f docker-compose.test.yml down

# Exit with the captured exit status
exit $EXIT_CODE

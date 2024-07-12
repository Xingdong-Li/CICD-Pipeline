#!/bin/sh

# Build the Docker image for testing.
docker build -f Dockerfile.test -t xingdong/restapi-test .

# Run the tests in the Docker container.
docker run --rm xingdong/restapi-test

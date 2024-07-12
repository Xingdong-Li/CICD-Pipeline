#!/bin/sh

# Build the Docker image.
docker build -t xingdong/restapi .

# Run the Docker container.
docker run -d -p 3000:8080 xingdong/restapi

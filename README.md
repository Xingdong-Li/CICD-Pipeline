# HW3 REST API

## Overview

A brief description of the project and its purpose. This application is a REST API that provides CRUD operations for managing items, integrated with AWS services such as DynamoDB and S3 using Localstack for local testing.

## Features

- **Create, Read, Update, Delete (CRUD)** operations on items.
- Stores item data in DynamoDB and S3.
- Automated testing with Jest and Supertest.
- Dockerized application and tests using Docker and Docker Compose.
- Localstack integration for mocking AWS services.

## Prerequisites

- Docker
- Docker Compose
- Node.js (version 18 or later)
- npm (version 7 or later)


## Running the API
To build and run the API, use the `run.sh` script:

```sh
./run.sh
```

## Test the API
To test the API, use the `test.sh` script:

```sh
./test.sh
```
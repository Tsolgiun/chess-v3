# Chess Application API Documentation

This directory contains the OpenAPI specification for the Chess Application API. The API documentation is served using Swagger UI and is accessible when the server is running.

## Accessing the API Documentation

When the server is running, you can access the API documentation at:

```
http://localhost:3001/api-docs
```

This will display the Swagger UI interface, which provides an interactive way to explore and test the API endpoints.

## API Structure

The API is organized into the following sections:

1. **Authentication API** - Endpoints for user registration, login, and profile management
2. **Blog API** - Endpoints for blog post creation, retrieval, updating, and deletion
3. **Game API** - Endpoints for game creation, retrieval, and management

## Socket.IO Events

In addition to the REST API endpoints, the application also uses Socket.IO for real-time communication. While these events are not directly testable through Swagger UI, they are documented in the OpenAPI specification under the `x-socket-io-events` extension.

The main Socket.IO events include:

- Game events (create, join, move, etc.)
- Chat events (send/receive messages)

## Raw OpenAPI Specification

You can access the raw OpenAPI specification YAML file at:

```
http://localhost:3001/api-docs.yaml
```

This can be useful if you want to import the specification into other tools or generate client libraries.

## Generating Client Libraries

The OpenAPI specification can be used to generate client libraries for various programming languages. You can use tools like [OpenAPI Generator](https://openapi-generator.tech/) to generate client code for your preferred language.

## Authentication

Most API endpoints require authentication using a JWT token. To authenticate:

1. Register a new user or login with an existing user
2. Use the returned JWT token in the Authorization header with the format: `Bearer <token>`

## Development

If you need to update the API documentation:

1. Modify the `openapi.yaml` file in this directory
2. Restart the server to see the changes in Swagger UI

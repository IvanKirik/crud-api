# User Management Server

This project is a simple User Management Server built with Node.js, TypeScript. It provides RESTful API endpoints for managing users, including creating, retrieving, updating, and deleting user information. The server can be run in both single and clustered modes for improved performance.

## Features

- RESTful API for user management
- Supports CRUD operations
- Runs in single or clustered mode for load balancing
- Simple and clear code structure

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (Node package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/IvanKirik/crud-api.git
   cd crud-api
2. Install the dependencies:
   ```bash
   npm install
3. Set up environment variables (optional): You can create a `.env` file in the root directory to configure environment variables, such as `PORT`.

## Available Scripts

### In the project directory, you can run:

- `Development Mode`: Runs the server in development mode with hot reloading.
  ```bash
  npm run start:dev

- `Production Mode`: Compiles TypeScript files and runs the server in production mode.
   ```bash
  npm run start:prod

- `Clustered Mode`:  Compiles TypeScript files and runs the server in clustered mode for better performance.
   ```bash
  npm run start:multi

- `Testing`:   Runs the test suite using Jest.
   ```bash
  npm test

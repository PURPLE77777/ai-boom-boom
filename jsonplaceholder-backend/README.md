# AI Backend

A NestJS-based RESTful API that emulates JSONPlaceholder functionality with JWT authentication.

## Features

- Complete CRUD operations for users, posts, comments, etc.
- JWT-based authentication
- Role-based authorization
- Prisma ORM with PostgreSQL
- Docker containerization

## Technologies

- Node.js
- NestJS
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Docker

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`
4. Start the database:

```bash
npm run docker:up
```

5. Run migrations:

```bash
npm run prisma:migrate:deploy
```

6. Seed the database:

```bash
npm run db:seed
```

7. Start the application:

```bash
npm run start:dev
```

### Running in Docker

To run the entire application in Docker:

```bash
npm run docker:up
```

This will start both the PostgreSQL database and the NestJS application.

## Testing

The application includes comprehensive unit and integration tests with over 80 test cases ensuring proper functionality.

### Running Tests

#### Unit Tests

Run all unit tests (parallel execution):

```bash
npm run test
```

Run unit tests in sequential mode to see all test execution details:

```bash
npm run test:seq
```

Run unit tests with verbose output:

```bash
npm run test:verbose
```

Run tests in watch mode (for development):

```bash
npm run test:watch
```

Generate test coverage report:

```bash
npm run test:cov
```

#### End-to-End Tests

Run all E2E tests (parallel execution):

```bash
npm run test:e2e
```

Run E2E tests sequentially (better for debugging):

```bash
npm run test:e2e:seq
```

Run E2E tests with verbose output:

```bash
npm run test:e2e:verbose
```

Debug tests with Node.js inspector:

```bash
npm run test:debug
```

### Test Structure

#### Unit Tests (50 test cases)

Unit tests are organized by component and focus on testing individual units in isolation:

**Service Tests:**

- `src/auth/auth.service.spec.ts` - Tests JWT generation, password hashing, and authentication logic
- `src/users/users.service.spec.ts` - Tests user CRUD operations and validations
- `src/posts/posts.service.spec.ts` - Tests post creation, retrieval, and management

**Controller Tests:**

- `src/auth/auth.controller.spec.ts` - Tests login endpoints, validation, and error handling
- `src/users/users.controller.spec.ts` - Tests user API endpoints with request/response validation
- `src/posts/posts.controller.spec.ts` - Tests post API endpoints with proper authorization checks
- `src/app.controller.spec.ts` - Tests the base application endpoints

#### Integration (E2E) Tests (30 test cases)

End-to-end tests verify the entire request-response cycle, testing how components interact through the API:

- `test/app.e2e-spec.ts` - Tests the base application endpoint
- `test/auth.e2e-spec.ts` - Tests login, JWT token generation, and authentication error handling
- `test/users.e2e-spec.ts` - Tests user CRUD operations through the API with authentication
- `test/posts.e2e-spec.ts` - Tests post management endpoints with proper auth checks

### Test Architecture

The tests utilize several key approaches for effective testing:

1. **MockPrismaService**: A custom mock implementation that mimics the database interactions without requiring an actual database connection.

2. **JWT Mocking**: Authentication tokens are generated with the same approach as production but using test-specific secrets.

3. **Request Testing**: Tests use Supertest to simulate HTTP requests and verify proper responses.

4. **Dependency Isolation**: All external dependencies are properly mocked to ensure tests run in isolation.

5. **Type-Safe Mocking**: TypeScript types are used throughout the tests to ensure type safety.

### Common Testing Patterns

- **Authentication Testing**: Verifying JWT token generation, validation, and proper error handling for unauthorized access
- **Database Interaction Testing**: Mocking database operations to verify proper data handling
- **Input Validation Testing**: Ensuring API endpoints properly validate incoming data
- **Error Handling Testing**: Verifying proper error responses for invalid operations

## API Documentation

When running the application, Swagger documentation is available at:

```
http://localhost:3000/api
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

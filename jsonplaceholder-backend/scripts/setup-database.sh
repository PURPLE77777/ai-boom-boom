#!/bin/bash

# Start PostgreSQL database
echo "Starting PostgreSQL database..."
npm run docker:up

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Run migrations
echo "Running migrations..."
npx prisma migrate dev --name init

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Seed the database
echo "Seeding the database..."
npm run db:seed

echo "Database setup complete!" 
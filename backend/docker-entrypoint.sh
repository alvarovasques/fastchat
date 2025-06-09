#!/bin/sh

echo "Waiting for postgres..."
while ! nc -z postgres 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

echo "Running migrations..."
npx sequelize db:migrate

echo "Running seeds..."
npx sequelize db:seed:all

echo "Starting application..."
yarn start 
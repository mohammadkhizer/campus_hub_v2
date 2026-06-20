#!/bin/bash
echo "Setting up Campus Hub v2 environment..."

echo "1. Installing dependencies..."
npm install

if [ ! -f .env ]; then
  echo "2. Copying .env.example to .env..."
  cp .env.example .env
  echo "⚠️ Please update .env with your actual secrets before running the application."
else
  echo "2. .env file already exists. Skipping."
fi

echo "3. Would you like to seed the local database? (y/N)"
read seed_db
if [ "$seed_db" == "y" ]; then
  npm run seed
fi

echo "✅ Setup complete. Run 'npm run dev' to start the application."

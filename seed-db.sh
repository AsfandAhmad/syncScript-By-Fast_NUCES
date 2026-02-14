#!/bin/bash

# Seed Database Script
# This script seeds the database with dummy data using the Supabase client

echo "🌱 Seeding database with dummy data..."

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | xargs)
else
  echo "❌ Error: .env.local file not found"
  exit 1
fi

# Run the seed function via Node
node -r ts-node/register -e "
const seedDatabase = require('./frontend/lib/seed-data.ts').default;
seedDatabase().then(() => {
  console.log('✨ Seeding completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
"

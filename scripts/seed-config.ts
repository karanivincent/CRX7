#!/usr/bin/env node
import { seedConfiguration } from '../src/lib/db/seed-configuration';

async function main() {
  console.log('Starting configuration seeding...');
  const success = await seedConfiguration();
  
  if (success) {
    console.log('Configuration seeding completed successfully!');
  } else {
    console.error('Configuration seeding failed!');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
import seedDatabase from '../lib/seed-data';

// Run seeding
seedDatabase()
  .then(() => {
    console.log('\n✨ Database seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database seeding failed:', error);
    process.exit(1);
  });

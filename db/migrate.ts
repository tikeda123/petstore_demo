import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

// Create a drizzle database instance
const db = drizzle(pool);

// Main migration function
async function main() {
  console.log("Starting database migration...");
  
  try {
    // This will automatically run needed migrations on the database
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

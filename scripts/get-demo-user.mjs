import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);

async function getDemoUser() {
  try {
    const users = await sql`SELECT id, email FROM users WHERE email = 'demo@example.com'`;
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getDemoUser();

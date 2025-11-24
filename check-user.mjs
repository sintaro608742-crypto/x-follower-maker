import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

const users = await sql`SELECT id, email, keywords FROM users WHERE email = 'demo@example.com'`;
console.log('Demo user data:', JSON.stringify(users, null, 2));

import { db } from '../src/db/client';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function updateDemoUser() {
  try {
    // Update demo user's keywords to "ビジネス・起業" so the test can select "プログラミング・技術"
    const result = await db
      .update(users)
      .set({
        keywords: ['ビジネス・起業'],
        updated_at: new Date(),
      })
      .where(eq(users.email, 'demo@example.com'))
      .returning({ id: users.id, keywords: users.keywords });

    console.log('Updated demo user:', JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateDemoUser();

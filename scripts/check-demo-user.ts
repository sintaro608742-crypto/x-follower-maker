import { db } from '../src/db/client';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function checkDemoUser() {
  try {
    const demoUser = await db
      .select({
        id: users.id,
        email: users.email,
        keywords: users.keywords,
      })
      .from(users)
      .where(eq(users.email, 'demo@example.com'))
      .limit(1);

    console.log('Demo user data:', JSON.stringify(demoUser, null, 2));

    if (demoUser.length === 0) {
      console.log('Demo user not found!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDemoUser();

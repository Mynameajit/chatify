import 'dotenv/config';
import prisma from './src/server/db';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  });
  console.log('--- USERS ---');
  console.log(JSON.stringify(users, null, 2));

  const requests = await prisma.friendRequest.findMany();
  console.log('--- FRIEND REQUESTS ---');
  console.log(JSON.stringify(requests, null, 2));

  const notifications = await prisma.notification.findMany();
  console.log('--- NOTIFICATIONS ---');
  console.log(JSON.stringify(notifications, null, 2));
  
  const friendships = await prisma.friendship.findMany();
  console.log('--- FRIENDSHIPS ---');
  console.log(JSON.stringify(friendships, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

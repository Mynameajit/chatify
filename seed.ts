import prisma from './src/server/db/index.js';
import bcrypt from 'bcryptjs';

const names = [
  'Ajit', 'Amit', 'Abhishek', 'Sagar', 'Vikram', 'Ramesh', 'Shivji', 'Lalan', 
  'Karan', 'Rajiv', 'Rohan', 'Rahul', 'Sunil', 'Pankaj', 'Suresh', 'Manish', 
  'Deepak', 'Gaurav', 'Nitin', 'Vikas', 'Ankit', 'Sonu', 'Monu', 'Aman', 
  'Arjun', 'Suraj', 'Prince', 'Ritik', 'Aditya', 'Mohit'
];

async function main() {
  console.log('Generating 30 users directly into database...');
  const hashedPassword = await bcrypt.hash('123456', 10);

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const email = `${name.toLowerCase()}@gmail.com`;

    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          name,
          email,
          password: hashedPassword,
        },
      });
      console.log(`Created/Verified: ${name} (${email})`);
    } catch (error) {
      console.error(`Error creating ${email}`, error);
    }
  }

  console.log('Finished creating 30 users.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

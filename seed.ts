const firstNames = ['Ajit', 'Amit', 'Abhishek', 'Sagar', 'Vikram', 'Ramesh', 'Shivji', 'Lalan', 'Karan', 'Rajiv', 'Rohan', 'Rahul', 'Sunil', 'Pankaj', 'Suresh', 'Manish', 'Deepak', 'Gaurav', 'Nitin', 'Vikas'];
const lastNames = ['Kumar', 'Singh', 'Sharma', 'Verma', 'Gupta', 'Mishra', 'Yadav', 'Patel', 'Pandey', 'Tiwari'];

async function main() {
  console.log('Generating 50 users via API...');

  for (let i = 1; i <= 50; i++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${fName} ${lName}`;
    const email = `${fName.toLowerCase()}${i}@gmail.com`;

    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password: '123456' })
      });
      
      const data = await res.json();
      if (res.ok) {
        console.log(`Created user ${i}/50: ${name} (${email})`);
      } else {
        console.error(`Failed to create ${email}`, data);
      }
    } catch (e) {
      console.error(`Failed to create ${email}`, e);
    }
  }

  console.log('Finished creating 50 users.');
}

main().catch(console.error);

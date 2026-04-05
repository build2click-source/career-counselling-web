const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = "clukq8k0b0000r94000000000"; // I need to find the user's actual ID. I'll just find the first user in the DB.
  const user = await prisma.user.findFirst();
  if (!user) { console.log('no user'); return; }
  
  console.log('User:', user.email, user.id);
  
  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id },
    include: { _count: { select: { responses: true } } }
  });
  
  console.log('Attempts:', JSON.stringify(attempts, null, 2));

  const responses = await prisma.response.findMany({
    take: 5,
    include: { question: { select: { text: true, moduleId: true } } }
  });
  console.log('Recent Responses:', JSON.stringify(responses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

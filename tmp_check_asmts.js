const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fs = require('fs');
async function main() {
  const asmts = await prisma.assessment.findMany({ select: { id: true, title: true } });
  fs.writeFileSync('asmts.json', JSON.stringify(asmts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

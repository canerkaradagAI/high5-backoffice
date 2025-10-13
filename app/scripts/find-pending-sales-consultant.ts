import { prisma } from '@/lib/db';

async function main() {
  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ status: 'Bekliyor' }, { status: 'PENDING' }],
      AND: [
        {
          OR: [
            { assignedTo: { userRoles: { some: { role: { name: 'Satış Danışmanı' } } } } },
            { assignedToId: null, OR: [{ targetRole: null }, { targetRole: 'Satış Danışmanı' }] }
          ]
        }
      ]
    },
    select: { id: true, title: true, status: true, assignedToId: true, targetRole: true, createdAt: true }
  });

  console.log(JSON.stringify(tasks, null, 2));
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });



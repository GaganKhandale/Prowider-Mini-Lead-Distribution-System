import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Delete in correct order (children before parents)
    await prisma.leadAssignment.deleteMany()
    await prisma.lead.deleteMany()
    await prisma.allocationState.deleteMany()
    await prisma.provider.deleteMany()
    await prisma.service.deleteMany()

    // Reset auto-increment sequences so IDs start from 1
    await prisma.$executeRaw`ALTER SEQUENCE "Service_id_seq" RESTART WITH 1`
    await prisma.$executeRaw`ALTER SEQUENCE "Provider_id_seq" RESTART WITH 1`
    await prisma.$executeRaw`ALTER SEQUENCE "AllocationState_id_seq" RESTART WITH 1`

    // Insert services — IDs will be 1, 2, 3
    const s1 = await prisma.service.create({ data: { name: 'Service 1' } })
    const s2 = await prisma.service.create({ data: { name: 'Service 2' } })
    const s3 = await prisma.service.create({ data: { name: 'Service 3' } })

    console.log(`Services created: ${s1.id}, ${s2.id}, ${s3.id}`)

    // Insert 8 providers — IDs will be 1-8
    for (let i = 1; i <= 8; i++) {
        await prisma.provider.create({
            data: { name: `Provider ${i}`, monthlyCount: 0, quota: 10 },
        })
    }

    console.log('Providers created: 1-8')

    // Insert allocation state rows using actual service IDs
    await prisma.allocationState.createMany({
        data: [
            { serviceId: s1.id, cursorIndex: 0 },
            { serviceId: s2.id, cursorIndex: 0 },
            { serviceId: s3.id, cursorIndex: 0 },
        ],
    })

    console.log('AllocationState created for services:', s1.id, s2.id, s3.id)
    console.log('Seed completed successfully!')
}

main()
    .catch((e) => {
        console.error('Seed failed:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MANDATORY: Record<number, number[]> = {
    1: [1],
    2: [5],
    3: [1, 4],
}

const OPTIONAL_POOL: Record<number, number[]> = {
    1: [2, 3, 4],
    2: [6, 7, 8],
    3: [2, 3, 5, 6, 7, 8],
}

export async function allocateProviders(leadId: number, serviceId: number) {
    // Step 1 — fetch everything OUTSIDE transaction (fast reads)
    const allProviders = await prisma.provider.findMany({ orderBy: { id: 'asc' } })
    const state = await prisma.allocationState.findUnique({ where: { serviceId } })

    if (!state) throw new Error(`AllocationState missing for serviceId ${serviceId}. Run: npx prisma db seed`)
    if (allProviders.length < 8) throw new Error(`Only ${allProviders.length} providers found. Run: npx prisma db seed`)

    // Map position (1-8) → actual DB id
    const posToId = (pos: number) => allProviders[pos - 1].id

    const mandatoryIds = (MANDATORY[serviceId] || []).map(posToId)
    const optionalIds = (OPTIONAL_POOL[serviceId] || []).map(posToId)

    const quotaOk = (id: number) => {
        const p = allProviders.find((p) => p.id === id)
        return p ? p.monthlyCount < p.quota : false
    }

    // Step 2 — pick mandatory providers
    const chosen: number[] = []
    for (const id of mandatoryIds) {
        if (quotaOk(id) && !chosen.includes(id)) chosen.push(id)
    }

    // Step 3 — fill remaining slots via round-robin
    let cursor = state.cursorIndex
    let steps = 0
    while (chosen.length < 3 && steps < optionalIds.length * 2) {
        const id = optionalIds[cursor % optionalIds.length]
        cursor++
        steps++
        if (!chosen.includes(id) && quotaOk(id)) chosen.push(id)
    }

    if (chosen.length === 0) throw new Error('No providers available — all at quota')

    const newCursor = cursor % optionalIds.length

    // Step 4 — write everything in ONE short transaction (no reads inside)
    await prisma.$transaction([
        // Update allocation cursor
        prisma.allocationState.update({
            where: { serviceId },
            data: { cursorIndex: newCursor },
        }),
        // Create all assignments at once
        ...chosen.map((pid) =>
            prisma.leadAssignment.upsert({
                where: { leadId_providerId: { leadId, providerId: pid } },
                create: { leadId, providerId: pid },
                update: {},
            })
        ),
        // Increment monthly count for each chosen provider
        ...chosen.map((pid) =>
            prisma.provider.update({
                where: { id: pid },
                data: { monthlyCount: { increment: 1 } },
            })
        ),
    ])
}
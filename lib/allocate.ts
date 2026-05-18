import { prisma } from './prisma'

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
    const allProviders = await prisma.provider.findMany({ orderBy: { id: 'asc' } })
    const state = await prisma.allocationState.findUnique({ where: { serviceId } })

    if (!state) throw new Error(`AllocationState missing for serviceId ${serviceId}`)
    if (allProviders.length < 8) throw new Error(`Only ${allProviders.length} providers found`)

    const posToId = (pos: number) => allProviders[pos - 1].id
    const mandatoryIds = (MANDATORY[serviceId] || []).map(posToId)
    const optionalIds = (OPTIONAL_POOL[serviceId] || []).map(posToId)

    const quotaOk = (id: number) => {
        const p = allProviders.find((p) => p.id === id)
        return p ? p.monthlyCount < p.quota : false
    }

    const chosen: number[] = []
    for (const id of mandatoryIds) {
        if (quotaOk(id) && !chosen.includes(id)) chosen.push(id)
    }

    let cursor = state.cursorIndex
    let steps = 0
    while (chosen.length < 3 && steps < optionalIds.length * 2) {
        const id = optionalIds[cursor % optionalIds.length]
        cursor++
        steps++
        if (!chosen.includes(id) && quotaOk(id)) chosen.push(id)
    }

    if (chosen.length === 0) throw new Error('No providers available')

    const newCursor = cursor % optionalIds.length

    await prisma.$transaction([
        prisma.allocationState.update({
            where: { serviceId },
            data: { cursorIndex: newCursor },
        }),
        ...chosen.map((pid) =>
            prisma.leadAssignment.upsert({
                where: { leadId_providerId: { leadId, providerId: pid } },
                create: { leadId, providerId: pid },
                update: {},
            })
        ),
        ...chosen.map((pid) =>
            prisma.provider.update({
                where: { id: pid },
                data: { monthlyCount: { increment: 1 } },
            })
        ),
    ])
}
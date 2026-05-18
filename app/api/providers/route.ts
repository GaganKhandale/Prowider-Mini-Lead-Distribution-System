export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const providers = await prisma.provider.findMany({
            include: {
                assignments: {
                    include: {
                        lead: { include: { service: true } },
                    },
                },
            },
            orderBy: { id: 'asc' },
        })

        const result = providers.map((p) => ({
            id: p.id,
            name: p.name,
            monthlyCount: p.monthlyCount,
            quota: p.quota,
            remaining: p.quota - p.monthlyCount,
            leads: p.assignments.map((a) => ({
                id: a.lead.id,
                name: a.lead.name,
                phone: a.lead.phone,
                city: a.lead.city,
                service: a.lead.service.name,
                createdAt: a.lead.createdAt,
            })),
        }))

        return NextResponse.json(result)
    } catch (err: any) {
        console.error('Providers fetch error:', err?.message || err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
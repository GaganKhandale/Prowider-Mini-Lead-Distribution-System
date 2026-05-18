export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { allocateProviders } from '@/lib/allocate'
import { broadcastEvent } from '@/lib/sse'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, phone, city, serviceId, description } = body

        if (!name || !phone || !city || !serviceId || !description) {
            return NextResponse.json({ error: 'All fields required' }, { status: 400 })
        }

        const lead = await prisma.lead.create({
            data: {
                name,
                phone,
                city,
                description,
                serviceId: Number(serviceId),
            },
        })

        await allocateProviders(lead.id, lead.serviceId)
        broadcastEvent({ type: 'lead_assigned', leadId: lead.id })

        return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 })

    } catch (err: any) {
        if (err?.code === 'P2002') {
            return NextResponse.json(
                { error: 'You have already submitted a lead for this service.' },
                { status: 409 }
            )
        }
        console.error('Lead creation error:', err?.message || err)
        return NextResponse.json(
            { error: err?.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
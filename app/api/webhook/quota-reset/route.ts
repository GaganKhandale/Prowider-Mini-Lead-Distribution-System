export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { eventId, providerId } = body

    if (!eventId || !providerId) {
        return NextResponse.json({ error: 'eventId and providerId required' }, { status: 400 })
    }

    const existing = await prisma.webhookEvent.findUnique({ where: { eventId } })
    if (existing) {
        return NextResponse.json({ status: 'duplicate', message: 'Already processed' })
    }

    await prisma.$transaction([
        prisma.provider.update({
            where: { id: Number(providerId) },
            data: { monthlyCount: 0 },
        }),
        prisma.webhookEvent.create({ data: { eventId } }),
    ])

    return NextResponse.json({ status: 'processed' })
}
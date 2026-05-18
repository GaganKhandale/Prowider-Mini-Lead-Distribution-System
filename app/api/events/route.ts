export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { addClient, removeClient } from '@/lib/sse'



export async function GET(_req: NextRequest) {
    let send: (data: string) => void

    const stream = new ReadableStream({
        start(controller) {
            send = (data: string) => controller.enqueue(new TextEncoder().encode(data))
            addClient(send)
            controller.enqueue(new TextEncoder().encode(': connected\n\n'))
        },
        cancel() {
            removeClient(send)
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    })
}
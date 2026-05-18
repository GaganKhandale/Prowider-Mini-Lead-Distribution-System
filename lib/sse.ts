type Sender = (data: string) => void

const clients = new Set<Sender>()

export function addClient(fn: Sender) {
    clients.add(fn)
}

export function removeClient(fn: Sender) {
    clients.delete(fn)
}

export function broadcastEvent(payload: object) {
    const data = `data: ${JSON.stringify(payload)}\n\n`
    clients.forEach((fn) => fn(data))
}
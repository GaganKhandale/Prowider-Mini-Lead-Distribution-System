'use client'
import { useState } from 'react'

export default function TestTools() {
    const [log, setLog] = useState<string[]>([])

    const addLog = (msg: string) => setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev])

    const resetQuota = async () => {
        for (let i = 1; i <= 8; i++) {
            const eventId = `quota-reset-provider-${i}-${new Date().getMonth()}`
            const res = await fetch('/api/webhook/quota-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, providerId: i }),
            })
            const data = await res.json()
            addLog(`Provider ${i} reset → ${data.status}`)
        }
    }

    const testIdempotency = async () => {
        const eventId = `idempotency-test-${Date.now()}`
        for (let i = 0; i < 5; i++) {
            const res = await fetch('/api/webhook/quota-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, providerId: 1 }),
            })
            const data = await res.json()
            addLog(`Call ${i + 1} with same eventId → ${data.status}`)
        }
    }

    const generate10Leads = async () => {
        const services = [1, 2, 3]
        const promises = Array.from({ length: 10 }, (_, i) => {
            const phone = `99000${String(i).padStart(5, '0')}`
            const serviceId = services[i % 3]
            return fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `Test User ${i + 1}`,
                    phone,
                    city: 'Mumbai',
                    serviceId,
                    description: `Auto-generated lead ${i + 1}`,
                }),
            }).then((r) => r.json().then((d) => ({ status: r.status, ...d })))
        })

        const results = await Promise.all(promises)
        results.forEach((r, i) => addLog(`Lead ${i + 1} → ${r.success ? 'created' : r.error}`))
    }

    const btnStyle: React.CSSProperties = {
        padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
        fontSize: 14, fontWeight: 600, color: '#fff',
    }

    return (
        <main style={{ maxWidth: 700, margin: '60px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Test Tools</h1>
            <p style={{ color: '#6b7280', marginBottom: 28 }}>Webhook simulation & concurrency testing panel</p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
                <button style={{ ...btnStyle, background: '#059669' }} onClick={resetQuota}>
                    Reset All Quotas
                </button>
                <button style={{ ...btnStyle, background: '#7c3aed' }} onClick={testIdempotency}>
                    Call Webhook 5× (same eventId)
                </button>
                <button style={{ ...btnStyle, background: '#dc2626' }} onClick={generate10Leads}>
                    Generate 10 Leads (concurrent)
                </button>
            </div>

            <div style={{ background: '#0f172a', borderRadius: 10, padding: 16, minHeight: 200, maxHeight: 400, overflowY: 'auto' }}>
                {log.length === 0 ? (
                    <p style={{ color: '#475569', fontSize: 13 }}>Logs will appear here...</p>
                ) : (
                    log.map((l, i) => (
                        <p key={i} style={{ margin: '2px 0', fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>{l}</p>
                    ))
                )}
            </div>
        </main>
    )
}
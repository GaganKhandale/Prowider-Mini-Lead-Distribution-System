'use client'
import { useEffect, useState } from 'react'

type Lead = { id: number; name: string; phone: string; city: string; service: string; createdAt: string }
type Provider = { id: number; name: string; monthlyCount: number; quota: number; remaining: number; leads: Lead[] }

export default function Dashboard() {
    const [providers, setProviders] = useState<Provider[]>([])

    const fetchProviders = async () => {
        const res = await fetch('/api/providers')
        const data = await res.json()
        setProviders(data)
    }

    useEffect(() => {
        fetchProviders()

        const es = new EventSource('/api/events')
        es.onmessage = () => fetchProviders()
        return () => es.close()
    }, [])

    return (
        <main style={{ maxWidth: 1100, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
            <h1 style={{ fontSize: 24, marginBottom: 24 }}>Provider Dashboard</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {providers.map((p) => (
                    <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{p.name}</h2>
                            <span style={{
                                background: p.remaining > 0 ? '#d1fae5' : '#fee2e2',
                                color: p.remaining > 0 ? '#065f46' : '#991b1b',
                                padding: '2px 10px', borderRadius: 20, fontSize: 13
                            }}>
                                {p.remaining} / {p.quota} left
                            </span>
                        </div>
                        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>
                            Leads received: <strong>{p.monthlyCount}</strong>
                        </p>
                        {p.leads.length === 0 ? (
                            <p style={{ fontSize: 13, color: '#9ca3af' }}>No leads yet</p>
                        ) : (
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {p.leads.map((l) => (
                                    <li key={l.id} style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                                        <strong>{l.name}</strong> — {l.service}<br />
                                        <span style={{ color: '#6b7280' }}>{l.city} · {l.phone}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
        </main>
    )
}
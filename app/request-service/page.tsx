'use client'
import { useState } from 'react'

export default function RequestService() {
    const [form, setForm] = useState({
        name: '', phone: '', city: '', serviceId: '1', description: '',
    })
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        const res = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, serviceId: Number(form.serviceId) }),
        })

        const data = await res.json()
        setLoading(false)

        if (res.ok) {
            setMessage('Lead submitted successfully!')
            setForm({ name: '', phone: '', city: '', serviceId: '1', description: '' })
        } else {
            setMessage(data.error || 'Something went wrong')
        }
    }

    return (
        <main style={{ maxWidth: 480, margin: '60px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
            <h1 style={{ fontSize: 24, marginBottom: 24 }}>Request a Service</h1>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input
                    placeholder="Full Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={inputStyle}
                    required
                />
                <input
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={inputStyle}
                    required
                />
                <input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    style={inputStyle}
                    required
                />
                <select
                    value={form.serviceId}
                    onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                    style={inputStyle}
                >
                    <option value="1">Service 1</option>
                    <option value="2">Service 2</option>
                    <option value="3">Service 3</option>
                </select>
                <textarea
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ ...inputStyle, height: 100, resize: 'vertical' }}
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}
                >
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
            </form>
            {message && (
                <p style={{ marginTop: 16, padding: 12, borderRadius: 8, background: message.includes('success') ? '#d1fae5' : '#fee2e2', color: message.includes('success') ? '#065f46' : '#991b1b' }}>
                    {message}
                </p>
            )}
        </main>
    )
}

const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 15,
    width: '100%',
    boxSizing: 'border-box',
}
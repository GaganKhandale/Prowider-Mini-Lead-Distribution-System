import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ maxWidth: 400, margin: '100px auto', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Prowider</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Lead Distribution System</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Link href="/request-service" style={linkStyle}>Submit a Lead</Link>
        <Link href="/dashboard" style={linkStyle}>Provider Dashboard</Link>
        <Link href="/test-tools" style={{ ...linkStyle, background: '#1e293b' }}>Test Tools</Link>
      </div>
    </main>
  )
}

const linkStyle: React.CSSProperties = {
  display: 'block', padding: '14px 24px', background: '#4f46e5',
  color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 16, fontWeight: 500,
}
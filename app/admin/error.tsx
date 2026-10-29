'use client' // Error boundaries must be Client Components
import { useEffect } from 'react'
import Link from 'next/link'

// Shown instead of a blank "page couldn't load" when an admin page fails.
// The reference matches the entry in the Vercel runtime logs.
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  const digest = typeof error === 'object' && error && 'digest' in error ? String((error as { digest?: unknown }).digest) : ''
  return <div className="md-ui" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
    <div className="md-card md-pad md-stack" style={{ width: 'min(480px, 100%)', textAlign: 'center', alignItems: 'center' }}>
      <span className="md-avatar" aria-hidden="true">M</span>
      <h1 className="md-h2">This page hit a problem</h1>
      <p className="md-sub">Nothing was changed or saved. Try again, or go back to your tests.</p>
      {digest && <p className="md-tiny">Reference for the logs: {digest}</p>}
      <div className="md-row" style={{ justifyContent: 'center' }}>
        <button type="button" className="md-btn md-btn-primary" onClick={() => retry()}>Try again</button>
        <Link className="md-btn md-btn-secondary" href="/admin">Back to sign-in</Link>
      </div>
    </div>
  </div>
}

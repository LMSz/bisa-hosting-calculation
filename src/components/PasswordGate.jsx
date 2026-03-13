import React, { useState, useEffect } from 'react'

const PASSWORD_HASH = '25f055bf47d23d130b431368ad2cb79bc02a04c2b647fcba03425f8d9604e375'

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput]       = useState('')
  const [error, setError]       = useState(false)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('hc_auth') === PASSWORD_HASH) setUnlocked(true)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const hash = await sha256(input)
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem('hc_auth', PASSWORD_HASH)
      setUnlocked(true)
    } else {
      setError(true)
      setInput('')
    }
    setLoading(false)
  }

  if (unlocked) return children

  return (
    <div className="pg-overlay">
      <div className="pg-card">
        <div className="pg-logo">G</div>
        <h1 className="pg-title">Hosting Cost Calculator</h1>
        <p className="pg-sub">goganiko.hu — enter password to continue</p>
        <form className="pg-form" onSubmit={handleSubmit}>
          <input
            className={`pg-input ${error ? 'pg-input--error' : ''}`}
            type="password"
            placeholder="Password"
            value={input}
            autoFocus
            onChange={e => { setInput(e.target.value); setError(false) }}
          />
          {error && <p className="pg-error">Incorrect password</p>}
          <button className="pg-btn" type="submit" disabled={!input || loading}>
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}

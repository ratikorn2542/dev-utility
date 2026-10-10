'use client'

import { useState } from 'react'

export function JwtDecoderTool() {
  const [token, setToken] = useState('')
  const [header, setHeader] = useState('')
  const [payload, setPayload] = useState('')
  const [signature, setSignature] = useState('')
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  const decode = () => {
    setError('')
    setExpiresAt(null)
    setIsExpired(false)
    try {
      const parts = token.trim().split('.')
      if (parts.length !== 3) {
        setError('Invalid JWT token. Must have 3 parts separated by dots.')
        return
      }
      const decodedHeader = JSON.parse(atob(parts[0]))
      const decodedPayload = JSON.parse(atob(parts[1]))
      setHeader(JSON.stringify(decodedHeader, null, 2))
      setPayload(JSON.stringify(decodedPayload, null, 2))
      setSignature(parts[2])

      if (decodedPayload.exp) {
        const expDate = new Date(decodedPayload.exp * 1000)
        setExpiresAt(expDate.toLocaleString())
        setIsExpired(expDate.getTime() < Date.now())
      }
    } catch {
      setError('Failed to decode JWT token. Check the format.')
    }
  }

  const copyToClipboard = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const clear = () => {
    setToken('')
    setHeader('')
    setPayload('')
    setSignature('')
    setError('')
    setExpiresAt(null)
    setIsExpired(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-[#9ca3af] mb-2">JWT Token</label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
          className="w-full h-32 p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-[#e94560] placeholder:text-[#4a4a5a]"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={decode}
          disabled={!token}
          className="flex-1 py-2 px-4 bg-[#e94560] text-white rounded-lg font-medium border-2 border-[#f39c12] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          → Decode JWT
        </button>
        <button
          onClick={clear}
          className="px-4 py-2 bg-transparent text-[#9ca3af] rounded-lg font-medium border-2 border-[#2d2d44] hover:text-white hover:border-[#e94560] transition-all"
        >
          Clear
        </button>
      </div>

      {error && <p className="text-[#e94560] text-sm">{error}</p>}

      {expiresAt && (
        <div className={`p-3 rounded-lg border-2 ${isExpired ? 'bg-red-900/20 border-red-500' : 'bg-green-900/20 border-green-500'}`}>
          <span className={`text-sm font-medium ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
            {isExpired ? '⚠️ Expired' : '✓ Valid'}
          </span>
          <span className="text-sm text-[#9ca3af] ml-2">Expires: {expiresAt}</span>
        </div>
      )}

      {(header || payload) && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[#9ca3af]">Header</label>
              <button
                onClick={() => copyToClipboard(header, 'header')}
                className="text-xs text-[#9ca3af] hover:text-[#e94560] transition-colors"
              >
                {copiedField === 'header' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm overflow-x-auto whitespace-pre-wrap">
              {header}
            </pre>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[#9ca3af]">Payload</label>
              <button
                onClick={() => copyToClipboard(payload, 'payload')}
                className="text-xs text-[#9ca3af] hover:text-[#e94560] transition-colors"
              >
                {copiedField === 'payload' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm overflow-x-auto whitespace-pre-wrap">
              {payload}
            </pre>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[#9ca3af]">Signature</label>
              <button
                onClick={() => copyToClipboard(signature, 'signature')}
                className="text-xs text-[#9ca3af] hover:text-[#e94560] transition-colors"
              >
                {copiedField === 'signature' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <code className="block p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-[#e94560] font-mono text-sm break-all">
              {signature}
            </code>
          </div>
        </div>
      )}
    </div>
  )
}

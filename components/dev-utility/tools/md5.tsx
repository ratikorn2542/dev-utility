'use client'

import { useState } from 'react'

type Algorithm = 'SHA-256' | 'SHA-1' | 'SHA-384' | 'SHA-512'

const ALGORITHMS: Algorithm[] = ['SHA-256', 'SHA-1', 'SHA-384', 'SHA-512']

async function hashText(text: string, algorithm: Algorithm): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest(algorithm, msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function HashTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const hash = async () => {
    if (!input) return
    setLoading(true)
    setError('')
    try {
      const result = await hashText(input, algorithm)
      setOutput(result)
    } catch {
      setError('Hashing failed. Make sure you are using a secure context (HTTPS).')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const clear = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-[#9ca3af] mb-2">Input</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to hash..."
          className="w-full h-32 p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-[#e94560] placeholder:text-[#4a4a5a]"
        />
      </div>

      <div>
        <label className="block text-sm text-[#9ca3af] mb-2">Algorithm</label>
        <div className="flex flex-wrap gap-2">
          {ALGORITHMS.map((algo) => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo)}
              className={`px-3 py-1.5 rounded text-xs font-mono border-2 transition-all ${
                algorithm === algo
                  ? 'bg-[#e94560] text-white border-[#f39c12]'
                  : 'bg-[#16213e] text-[#9ca3af] border-[#2d2d44] hover:text-white hover:border-[#e94560]'
              }`}
            >
              {algo}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={hash}
          disabled={!input || loading}
          className="flex-1 py-2 px-4 bg-[#e94560] text-white rounded-lg font-medium border-2 border-[#f39c12] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? 'Hashing...' : `→ Hash (${algorithm})`}
        </button>
        <button
          onClick={clear}
          className="px-4 py-2 bg-transparent text-[#9ca3af] rounded-lg font-medium border-2 border-[#2d2d44] hover:text-white hover:border-[#e94560] transition-all"
        >
          Clear
        </button>
      </div>

      {error && <p className="text-[#e94560] text-sm">{error}</p>}

      {output && (
        <div>
          <label className="block text-sm text-[#9ca3af] mb-2">{algorithm} Hash</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm break-all">
              {output}
            </code>
            <button
              onClick={copyToClipboard}
              className="px-3 py-2 bg-[#16213e] text-white rounded-lg border-2 border-[#2d2d44] hover:border-[#e94560] transition-all text-sm"
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-[#4a4a5a] mt-1">{output.length} characters</p>
        </div>
      )}
    </div>
  )
}

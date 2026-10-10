'use client'

import { useState } from 'react'

export function UuidTool() {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(1)
  const [uppercase, setUppercase] = useState(false)
  const [noHyphens, setNoHyphens] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const generate = () => {
    const newUuids = Array.from({ length: count }, () => {
      let uuid = crypto.randomUUID()
      if (noHyphens) uuid = uuid.replace(/-/g, '')
      if (uppercase) uuid = uuid.toUpperCase()
      return uuid
    })
    setUuids(newUuids)
  }

  const copyToClipboard = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  const copyAll = async () => {
    await navigator.clipboard.writeText(uuids.join('\n'))
    setCopiedIdx(-1)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  const clear = () => {
    setUuids([])
    setCopiedIdx(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm text-[#9ca3af]">Count:</label>
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="px-3 py-1.5 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded text-white text-sm focus:outline-none focus:border-[#e94560]"
        >
          {[1, 5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-[#9ca3af] cursor-pointer">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
            className="accent-[#e94560]"
          />
          Uppercase
        </label>
        <label className="flex items-center gap-2 text-sm text-[#9ca3af] cursor-pointer">
          <input
            type="checkbox"
            checked={noHyphens}
            onChange={(e) => setNoHyphens(e.target.checked)}
            className="accent-[#e94560]"
          />
          No hyphens
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={generate}
          className="flex-1 py-2 px-4 bg-[#e94560] text-white rounded-lg font-medium border-2 border-[#f39c12] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
        >
          Generate UUID v4
        </button>
        {uuids.length > 0 && (
          <>
            <button
              onClick={copyAll}
              className="px-4 py-2 bg-[#16213e] text-white rounded-lg font-medium border-2 border-[#2d2d44] hover:border-[#e94560] transition-all text-sm"
            >
              {copiedIdx === -1 ? '✓ Copied!' : 'Copy All'}
            </button>
            <button
              onClick={clear}
              className="px-4 py-2 bg-transparent text-[#9ca3af] rounded-lg font-medium border-2 border-[#2d2d44] hover:text-white hover:border-[#e94560] transition-all text-sm"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {uuids.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm text-[#9ca3af]">{uuids.length} UUIDs generated</span>
          {uuids.map((uuid, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg group hover:border-[#e94560] transition-colors"
            >
              <code className="text-white font-mono text-sm">{uuid}</code>
              <button
                onClick={() => copyToClipboard(uuid, i)}
                className="text-[#9ca3af] hover:text-[#e94560] transition-colors text-sm"
              >
                {copiedIdx === i ? '✓' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

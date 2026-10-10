'use client'

import { useState, useEffect } from 'react'

export function TimestampTool() {
  const [timestamp, setTimestamp] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<'toDate' | 'toTimestamp'>('toDate')
  const [now, setNow] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const updateNow = () => setNow(Math.floor(Date.now() / 1000).toString())
    updateNow()
    const interval = setInterval(updateNow, 1000)
    return () => clearInterval(interval)
  }, [])

  const convertToDate = () => {
    try {
      const ts = Number(timestamp)
      if (isNaN(ts)) { setResult('Invalid timestamp'); return }
      const date = ts > 1e11 ? new Date(ts) : new Date(ts * 1000)
      const lines = [
        `ISO 8601: ${date.toISOString()}`,
        `UTC: ${date.toUTCString()}`,
        `Local: ${date.toLocaleString()}`,
        `Unix (s): ${Math.floor(date.getTime() / 1000)}`,
        `Unix (ms): ${date.getTime()}`,
      ]
      setResult(lines.join('\n'))
    } catch {
      setResult('Invalid timestamp')
    }
  }

  const convertToTimestamp = () => {
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) { setResult('Invalid date'); return }
      const lines = [
        `Unix (s): ${Math.floor(date.getTime() / 1000)}`,
        `Unix (ms): ${date.getTime()}`,
        `ISO 8601: ${date.toISOString()}`,
        `UTC: ${date.toUTCString()}`,
      ]
      setResult(lines.join('\n'))
    } catch {
      setResult('Invalid date string')
    }
  }

  const copyToClipboard = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const copyTimestamp = async () => {
    await navigator.clipboard.writeText(now)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const clear = () => {
    setTimestamp('')
    setDateStr('')
    setResult('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-[#2b3b5c] bg-[#0d1526] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8192b5]">เวลาปัจจุบัน</p>
          <code className="mt-1 block font-mono text-base font-semibold text-[#b9c5ff]">{now || '—'}</code>
        </div>
        <button
          onClick={copyTimestamp}
          className="w-fit rounded-lg border border-[#354662] px-3 py-1.5 text-xs font-medium text-[#aab7d0] transition-colors hover:border-[#6075ab] hover:bg-[#17233a] hover:text-white"
        >
          {copied ? '✓ Copied' : 'Copy timestamp'}
        </button>
      </div>

      <div className="border-b border-[#2a3958] pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#8192b5]">เลือกการแปลง</p>
        <div className="inline-flex gap-1 rounded-lg border border-[#31425f] bg-[#0d1526] p-1">
        <button
          onClick={() => { setMode('toDate'); setResult('') }}
          className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
            mode === 'toDate'
              ? 'bg-[#7283ff] text-white shadow-sm'
              : 'text-[#91a0be] hover:text-white'
          }`}
        >
          Timestamp → Date
        </button>
        <button
          onClick={() => { setMode('toTimestamp'); setResult('') }}
          className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
            mode === 'toTimestamp'
              ? 'bg-[#7283ff] text-white shadow-sm'
              : 'text-[#91a0be] hover:text-white'
          }`}
        >
          Date → Timestamp
        </button>
        </div>
      </div>

      {mode === 'toDate' ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-[#c2cde4]">Unix Timestamp</label>
          <input
            type="text"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            placeholder="e.g. 1700000000"
            className="w-full rounded-xl border border-[#2b3b5c] bg-[#0d1526] p-3.5 font-mono text-sm text-[#edf2ff] outline-none transition-colors placeholder:text-[#596985] focus:border-[#8092ff]"
          />
        </div>
      ) : (
        <div>
          <label className="mb-2 block text-sm font-medium text-[#c2cde4]">วันที่และเวลา</label>
          <input
            type="datetime-local"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="w-full rounded-xl border border-[#2b3b5c] bg-[#0d1526] p-3.5 font-mono text-sm text-[#edf2ff] outline-none transition-colors focus:border-[#8092ff]"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={mode === 'toDate' ? convertToDate : convertToTimestamp}
          className="min-w-40 flex-1 rounded-lg bg-[#7283ff] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#263a8b]/40 transition-colors hover:bg-[#8492ff]"
        >
          Convert
        </button>
        <button
          onClick={clear}
          className="rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium text-[#91a0be] transition-colors hover:bg-[#17233a] hover:text-white"
        >
          Clear
        </button>
      </div>

      {result && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#c2cde4]">Result</label>
            <button
              onClick={copyToClipboard}
              className="text-xs font-medium text-[#9caccc] transition-colors hover:text-[#b9c5ff]"
            >
              {copied ? '✓ Copied!' : 'Copy All'}
            </button>
          </div>
          <pre className="rounded-xl border border-[#2b3b5c] bg-[#0d1526] p-3.5 font-mono text-sm leading-6 text-[#edf2ff] whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}
    </div>
  )
}

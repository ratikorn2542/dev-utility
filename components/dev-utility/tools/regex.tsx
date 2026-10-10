'use client'

import { useState, useMemo } from 'react'

export function RegexTool() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [testString, setTestString] = useState('')
  const [matches, setMatches] = useState<Array<{ match: string; index: number; length: number }>>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const test = () => {
    setError('')
    setMatches([])
    try {
      const regex = new RegExp(pattern, flags)
      const results: Array<{ match: string; index: number; length: number }> = []
      let match: RegExpExecArray | null

      if (flags.includes('g')) {
        while ((match = regex.exec(testString)) !== null) {
          results.push({ match: match[0], index: match.index, length: match[0].length })
          if (match.index === regex.lastIndex) regex.lastIndex++
        }
      } else {
        match = regex.exec(testString)
        if (match) {
          results.push({ match: match[0], index: match.index, length: match[0].length })
        }
      }
      setMatches(results)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const highlightedText = useMemo(() => {
    if (!pattern || matches.length === 0 || error) return null
    try {
      const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
      const parts: Array<{ text: string; isMatch: boolean }> = []
      let lastIndex = 0

      let match: RegExpExecArray | null
      while ((match = regex.exec(testString)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ text: testString.slice(lastIndex, match.index), isMatch: false })
        }
        parts.push({ text: match[0], isMatch: true })
        lastIndex = match.index + match[0].length
        if (match.index === regex.lastIndex) regex.lastIndex++
      }
      if (lastIndex < testString.length) {
        parts.push({ text: testString.slice(lastIndex), isMatch: false })
      }
      return parts
    } catch {
      return null
    }
  }, [pattern, flags, testString, matches, error])

  const copyMatches = async () => {
    const text = matches.map((m) => m.match).join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const clear = () => {
    setPattern('')
    setTestString('')
    setMatches([])
    setError('')
  }

  const flagOptions = [
    { flag: 'g', label: 'Global', desc: 'Find all matches' },
    { flag: 'i', label: 'Case Insensitive', desc: 'Case-insensitive matching' },
    { flag: 'm', label: 'Multiline', desc: 'Multiline mode' },
    { flag: 's', label: 'DotAll', desc: 'Dot matches newlines' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-[#9ca3af] mb-2">Regular Expression</label>
        <div className="flex items-center gap-2">
          <span className="text-[#9ca3af] font-mono">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="pattern"
            className="flex-1 p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-[#e94560] font-mono text-sm focus:outline-none focus:border-[#e94560] placeholder:text-[#4a4a5a]"
          />
          <span className="text-[#9ca3af] font-mono">/</span>
          <span className="text-[#f39c12] font-mono font-bold">{flags}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {flagOptions.map((f) => (
          <button
            key={f.flag}
            onClick={() => {
              setFlags((prev) =>
                prev.includes(f.flag) ? prev.replace(f.flag, '') : prev + f.flag
              )
            }}
            className={`px-3 py-1.5 rounded text-xs border-2 transition-all ${
              flags.includes(f.flag)
                ? 'bg-[#e94560] text-white border-[#f39c12]'
                : 'bg-[#16213e] text-[#9ca3af] border-[#2d2d44] hover:text-white hover:border-[#e94560]'
            }`}
            title={f.desc}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm text-[#9ca3af] mb-2">Test String</label>
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Enter string to test against the regex..."
          className="w-full h-32 p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-[#e94560] placeholder:text-[#4a4a5a]"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={test}
          disabled={!pattern}
          className="flex-1 py-2 px-4 bg-[#e94560] text-white rounded-lg font-medium border-2 border-[#f39c12] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          → Test Regex
        </button>
        <button
          onClick={clear}
          className="px-4 py-2 bg-transparent text-[#9ca3af] rounded-lg font-medium border-2 border-[#2d2d44] hover:text-white hover:border-[#e94560] transition-all"
        >
          Clear
        </button>
      </div>

      {error && <p className="text-[#e94560] text-sm">{error}</p>}

      {/* Highlighted text preview */}
      {highlightedText && highlightedText.length > 0 && (
        <div>
          <label className="block text-sm text-[#9ca3af] mb-2">Highlighted Matches</label>
          <div className="p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg font-mono text-sm whitespace-pre-wrap">
            {highlightedText.map((part, i) =>
              part.isMatch ? (
                <span key={i} className="bg-[#e94560] text-white px-0.5 rounded">
                  {part.text}
                </span>
              ) : (
                <span key={i} className="text-white">{part.text}</span>
              )
            )}
          </div>
        </div>
      )}

      {matches.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#9ca3af]">{matches.length} match{matches.length !== 1 ? 'es' : ''} found</span>
            <button
              onClick={copyMatches}
              className="text-xs text-[#9ca3af] hover:text-[#e94560] transition-colors"
            >
              {copied ? '✓ Copied!' : 'Copy Matches'}
            </button>
          </div>
          {matches.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg"
            >
              <span className="text-sm text-[#9ca3af]">#{i + 1}</span>
              <code className="text-[#e94560] font-mono text-sm">{m.match}</code>
              <span className="text-xs text-[#4a4a5a]">at {m.index} ({m.length} chars)</span>
            </div>
          ))}
        </div>
      )}

      {pattern && matches.length === 0 && !error && testString && (
        <p className="text-sm text-[#9ca3af]">No matches found.</p>
      )}
    </div>
  )
}

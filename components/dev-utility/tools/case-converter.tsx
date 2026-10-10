'use client'

import { useState } from 'react'

type CaseType = 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'pascal' | 'snake' | 'kebab' | 'constant' | 'dot'

const CASES: { id: CaseType; label: string }[] = [
  { id: 'upper', label: 'UPPER' },
  { id: 'lower', label: 'lower' },
  { id: 'title', label: 'Title' },
  { id: 'sentence', label: 'Sentence' },
  { id: 'camel', label: 'camelCase' },
  { id: 'pascal', label: 'PascalCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
  { id: 'constant', label: 'CONSTANT_CASE' },
  { id: 'dot', label: 'dot.case' },
]

function convertCase(type: CaseType, text: string): string {
  if (!text) return ''
  switch (type) {
    case 'upper': return text.toUpperCase()
    case 'lower': return text.toLowerCase()
    case 'title': return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    case 'sentence': return text.replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase())
    case 'camel': return text.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^(.)/, (c) => c.toLowerCase())
    case 'pascal': return text.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^(.)/, (c) => c.toUpperCase())
    case 'snake': return text.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
    case 'kebab': return text.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
    case 'constant': return text.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '')
    case 'dot': return text.replace(/([A-Z])/g, '.$1').toLowerCase().replace(/^\./, '')
  }
}

export function CaseConverterTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [caseType, setCaseType] = useState<CaseType>('upper')
  const [copied, setCopied] = useState(false)

  const handleInput = (val: string) => {
    setInput(val)
    setOutput(convertCase(caseType, val))
  }

  const handleCase = (type: CaseType) => {
    setCaseType(type)
    setOutput(convertCase(type, input))
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
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-[#9ca3af] mb-2">Input</label>
        <textarea
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Enter text to convert case..."
          className="w-full h-32 p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-[#e94560] placeholder:text-[#4a4a5a]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {CASES.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCase(c.id)}
            className={`px-3 py-1.5 rounded text-xs font-mono border-2 transition-all ${
              caseType === c.id
                ? 'bg-[#e94560] text-white border-[#f39c12]'
                : 'bg-[#16213e] text-[#9ca3af] border-[#2d2d44] hover:text-white hover:border-[#e94560]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {output && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-[#9ca3af]">Output</label>
            <button
              onClick={copyToClipboard}
              className="text-xs text-[#9ca3af] hover:text-[#e94560] transition-colors"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <code className="block p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm break-all">
            {output}
          </code>
        </div>
      )}

      <button
        onClick={clear}
        className="px-4 py-2 bg-transparent text-[#9ca3af] rounded-lg font-medium border-2 border-[#2d2d44] hover:text-white hover:border-[#e94560] transition-all text-sm"
      >
        Clear
      </button>
    </div>
  )
}

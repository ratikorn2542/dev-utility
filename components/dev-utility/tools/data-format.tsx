'use client'

import { useState } from 'react'

type Format = 'json' | 'yaml' | 'csv'

function simpleStringifyYaml(obj: unknown, indent = 0): string {
  const pad = '  '.repeat(indent)
  if (obj === null || obj === undefined) return 'null'
  if (typeof obj === 'boolean') return obj.toString()
  if (typeof obj === 'number') return obj.toString()
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#') ||
        obj.startsWith('{') || obj.startsWith('[') || obj.startsWith('"') ||
        obj.startsWith('- ') || obj.includes(',') || obj.includes('?') ||
        obj === 'true' || obj === 'false' || obj === 'null' ||
        /^\d+(\.\d+)?$/.test(obj)) {
      return `"${obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
    }
    return obj
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    const items = obj.map((item) => {
      const val = simpleStringifyYaml(item, indent + 1)
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        return `${pad}  - ${val.trimStart()}`
      }
      return `${pad}  - ${val}`
    })
    return `\n${items.join('\n')}`
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    const lines = entries.map(([key, val]) => {
      const formatted = simpleStringifyYaml(val, indent + 1)
      if (typeof val === 'object' && val !== null && !Array.isArray(val) && Object.keys(val as Record<string, unknown>).length > 0) {
        return `${pad}${key}:${formatted}`
      }
      if (Array.isArray(val) && val.length > 0) {
        return `${pad}${key}:${formatted}`
      }
      return `${pad}${key}: ${formatted}`
    })
    return `\n${lines.join('\n')}`
  }
  return String(obj)
}

function parseSimpleYaml(yaml: string): unknown {
  const lines = yaml.split('\n')
  const result: Record<string, unknown> = {}
  let currentKey = ''
  let currentArray: unknown[] = []
  let inArray = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const arrayMatch = trimmed.match(/^-\s+(.*)/)
    if (arrayMatch && inArray) {
      currentArray.push(arrayMatch[1] || '')
      continue
    }

    if (inArray) {
      result[currentKey] = currentArray
      inArray = false
      currentArray = []
    }

    const kvMatch = trimmed.match(/^(\w[\w-]*):\s*(.*)/)
    if (kvMatch) {
      const [, key, value] = kvMatch
      currentKey = key.trim()
      if (!value || value === '[]' || value === '{}') {
        result[currentKey] = value === '[]' ? [] : value === '{}' ? {} : null
        if (value === '[]') { inArray = true; currentArray = [] }
      } else if (value === 'true') {
        result[currentKey] = true
      } else if (value === 'false') {
        result[currentKey] = false
      } else if (/^-?\d+(\.\d+)?$/.test(value)) {
        result[currentKey] = Number(value)
      } else {
        result[currentKey] = value.replace(/^["']|["']$/g, '')
      }
    }
  }
  if (inArray) result[currentKey] = currentArray
  return result
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(current)
  return result
}

function parseCSV(csv: string): unknown[] {
  const trimmed = csv.trim()
  if (!trimmed) return []
  const lines = trimmed.split('\n')
  if (lines.length < 1) return []
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().replace(/^["']|["']$/g, ''))
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line).map((v) => v.trim().replace(/^["']|["']$/g, ''))
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = values[i] || '' })
    return obj
  })
}

function sanitizeCSVValue(val: string): string {
  if (/^[=+\-@\t\r]/.test(val)) {
    return `'${val}`
  }
  return val
}

function toCSV(data: unknown): string {
  const arr = Array.isArray(data) ? data : [data]
  if (arr.length === 0) return ''
  const first = arr[0]
  if (typeof first !== 'object' || first === null) {
    return arr.map((v) => sanitizeCSVValue(String(v))).join('\n')
  }
  const headers = Object.keys(first as Record<string, unknown>)
  const rows = arr.map((item) =>
    headers.map((h) => {
      const val = (item as Record<string, unknown>)[h]
      const str = val === null || val === undefined ? '' : String(val)
      const sanitized = sanitizeCSVValue(str)
      return sanitized.includes(',') || sanitized.includes('"') || sanitized.includes('\n')
        ? `"${sanitized.replace(/"/g, '""')}"`
        : sanitized
    }).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

function convertToYaml(data: unknown): string {
  if (typeof data === 'string') return data
  return simpleStringifyYaml(data).trim()
}

export function DataFormatTool() {
  const [input, setInput] = useState('{\n  "name": "hello",\n  "count": 42\n}')
  const [output, setOutput] = useState('')
  const [fromFormat, setFromFormat] = useState<Format>('json')
  const [toFormat, setToFormat] = useState<Format>('yaml')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const convert = () => {
    setError('')
    try {
      let parsed: unknown
      if (fromFormat === 'json') {
        parsed = JSON.parse(input)
      } else if (fromFormat === 'yaml') {
        parsed = parseSimpleYaml(input)
      } else {
        const arr = parseCSV(input)
        parsed = arr.length === 1 ? arr[0] : arr
      }

      let result: string
      if (toFormat === 'json') {
        result = JSON.stringify(parsed, null, 2)
      } else if (toFormat === 'yaml') {
        result = convertToYaml(parsed)
      } else {
        result = toCSV(parsed)
      }
      setOutput(result)
    } catch (e) {
      setError(`Conversion error: ${e instanceof Error ? e.message : 'Invalid input'}`)
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

  const formats: { key: Format; label: string }[] = [
    { key: 'json', label: 'JSON' },
    { key: 'yaml', label: 'YAML' },
    { key: 'csv', label: 'CSV' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#9ca3af]">From:</span>
          {formats.map((f) => (
            <button
              key={f.key}
              onClick={() => setFromFormat(f.key)}
              className={`px-3 py-1.5 rounded text-xs font-medium border-2 transition-all ${
                fromFormat === f.key
                  ? 'bg-[#e94560] text-white border-[#f39c12]'
                  : 'bg-transparent text-[#9ca3af] border-[#2d2d44] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-[#e94560] text-lg">→</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#9ca3af]">To:</span>
          {formats.map((f) => (
            <button
              key={f.key}
              onClick={() => setToFormat(f.key)}
              className={`px-3 py-1.5 rounded text-xs font-medium border-2 transition-all ${
                toFormat === f.key
                  ? 'bg-[#16213e] text-white border-[#e94560]'
                  : 'bg-transparent text-[#9ca3af] border-[#2d2d44] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[#9ca3af] mb-2">{fromFormat.toUpperCase()} Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Paste your ${fromFormat.toUpperCase()} here...`}
            className="w-full h-64 p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-[#e94560] placeholder:text-[#4a4a5a]"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-[#9ca3af]">{toFormat.toUpperCase()} Output</label>
            {output && (
              <button
                onClick={copyToClipboard}
                className="text-xs text-[#9ca3af] hover:text-[#e94560] transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Result will appear here..."
            className="w-full h-64 p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm resize-none focus:outline-none placeholder:text-[#4a4a5a]"
          />
        </div>
      </div>

      {error && <p className="text-[#e94560] text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={convert}
          className="flex-1 py-2 px-4 bg-[#e94560] text-white rounded-lg font-medium border-2 border-[#f39c12] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
        >
          → Convert
        </button>
        <button
          onClick={() => { setFromFormat(toFormat); setToFormat(fromFormat); setInput(output); setOutput(input) }}
          className="px-4 py-2 bg-[#16213e] text-white rounded-lg font-medium border-2 border-[#2d2d44] hover:border-[#e94560] transition-all"
        >
          ⇄ Swap
        </button>
        <button
          onClick={clear}
          className="px-4 py-2 bg-transparent text-[#9ca3af] rounded-lg font-medium border-2 border-[#2d2d44] hover:text-white hover:border-[#e94560] transition-all"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

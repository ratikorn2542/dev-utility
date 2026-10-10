'use client'

import { useState, useMemo, useCallback } from 'react'

interface CronParts {
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}

const MINUTE_OPTIONS = [
  { value: '*', label: 'Every minute' },
  { value: '0', label: 'At minute 0' },
  { value: '15', label: 'At minute 15' },
  { value: '30', label: 'At minute 30' },
  { value: '45', label: 'At minute 45' },
  { value: '*/5', label: 'Every 5 minutes' },
  { value: '*/10', label: 'Every 10 minutes' },
  { value: '*/15', label: 'Every 15 minutes' },
  { value: '*/30', label: 'Every 30 minutes' },
]

const HOUR_OPTIONS = [
  { value: '*', label: 'Every hour' },
  { value: '0', label: 'At midnight (0)' },
  { value: '6', label: 'At 6 AM' },
  { value: '9', label: 'At 9 AM' },
  { value: '12', label: 'At noon (12)' },
  { value: '17', label: 'At 5 PM' },
  { value: '9-17', label: '9 AM to 5 PM' },
  { value: '*/2', label: 'Every 2 hours' },
  { value: '*/4', label: 'Every 4 hours' },
  { value: '*/6', label: 'Every 6 hours' },
]

const DAY_OF_MONTH_OPTIONS = [
  { value: '*', label: 'Every day' },
  { value: '1', label: 'On the 1st' },
  { value: '15', label: 'On the 15th' },
  { value: '1,15', label: '1st and 15th' },
  { value: '*/5', label: 'Every 5 days' },
]

const MONTH_OPTIONS = [
  { value: '*', label: 'Every month' },
  { value: '1', label: 'January' },
  { value: '6', label: 'June' },
  { value: '12', label: 'December' },
  { value: '1,4,7,10', label: 'Quarterly' },
  { value: '*/3', label: 'Every 3 months' },
]

const DAY_OF_WEEK_OPTIONS = [
  { value: '*', label: 'Every day' },
  { value: '1-5', label: 'Weekdays (Mon-Fri)' },
  { value: '0,6', label: 'Weekends (Sat, Sun)' },
  { value: '1', label: 'Monday' },
  { value: '5', label: 'Friday' },
  { value: '0', label: 'Sunday' },
]

const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every day at 9 AM', value: '0 9 * * *' },
  { label: 'Every Monday at 9 AM', value: '0 9 * * 1' },
  { label: 'Every weekday at 9 AM', value: '0 9 * * 1-5' },
  { label: 'First of month at midnight', value: '0 0 1 * *' },
]

const DEFAULT_CRON: CronParts = { minute: '0', hour: '9', dayOfMonth: '*', month: '*', dayOfWeek: '*' }

function buildCronExpression(parts: CronParts): string {
  return `${parts.minute} ${parts.hour} ${parts.dayOfMonth} ${parts.month} ${parts.dayOfWeek}`
}

function parseCronExpression(expr: string): CronParts | null {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return null
  return { minute: parts[0], hour: parts[1], dayOfMonth: parts[2], month: parts[3], dayOfWeek: parts[4] }
}

function formatTime(hour: string, minute: string): string {
  const h = parseInt(hour)
  const m = parseInt(minute)
  if (isNaN(h) || isNaN(m)) return `${hour}:${minute}`
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function describeCronField(value: string, type: 'minute' | 'hour' | 'dom' | 'month' | 'dow'): string {
  if (value === '*') {
    switch (type) {
      case 'minute': return 'every minute'
      case 'hour': return 'every hour'
      case 'dom': return 'every day'
      case 'month': return 'every month'
      case 'dow': return 'every day of week'
    }
  }
  if (value.includes('/')) {
    const interval = value.split('/')[1]
    switch (type) {
      case 'minute': return `every ${interval} minutes`
      case 'hour': return `every ${interval} hours`
      case 'dom': return `every ${interval} days`
      case 'month': return `every ${interval} months`
      default: return `every ${interval}`
    }
  }
  if (value.includes('-')) {
    const [start, end] = value.split('-')
    if (type === 'dow') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return `${days[Number(start)] || start} to ${days[Number(end)] || end}`
    }
    return `from ${start} to ${end}`
  }
  if (value.includes(',')) {
    return `at ${value.replace(/,/g, ', ')}`
  }
  switch (type) {
    case 'minute': return `at minute ${value}`
    case 'hour': return `at hour ${value}`
    case 'dom': return `on day ${value}`
    case 'month': return {
      '1': 'January', '2': 'February', '3': 'March', '4': 'April',
      '5': 'May', '6': 'June', '7': 'July', '8': 'August',
      '9': 'September', '10': 'October', '11': 'November', '12': 'December'
    }[value] || `in month ${value}`
    case 'dow': return {
      '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
      '4': 'Thursday', '5': 'Friday', '6': 'Saturday'
    }[value] || `on day ${value}`
    default: return value
  }
}

function getCronDescription(expr: string): string {
  const parts = parseCronExpression(expr)
  if (!parts) return 'Invalid expression'
  const min = describeCronField(parts.minute, 'minute')
  const hour = describeCronField(parts.hour, 'hour')
  const dom = describeCronField(parts.dayOfMonth, 'dom')
  const month = describeCronField(parts.month, 'month')
  const dow = describeCronField(parts.dayOfWeek, 'dow')

  let timeStr: string
  if (parts.hour === '*' && parts.minute === '*') {
    timeStr = 'every minute'
  } else if (parts.hour === '*') {
    timeStr = `at ${min} past every hour`
  } else if (parts.minute === '*') {
    timeStr = `every minute past ${hour}`
  } else {
    timeStr = `at ${formatTime(parts.hour, parts.minute)}`
  }

  let desc = `Runs ${timeStr}`
  if (parts.dayOfMonth !== '*' && parts.month !== '*') desc += `, ${dom}, ${month}`
  else if (parts.dayOfMonth !== '*') desc += `, ${dom}`
  else if (parts.month !== '*') desc += `, ${month}`
  if (parts.dayOfWeek !== '*') desc += `, ${dow}`
  return desc
}

function getNextRuns(expr: string, count = 5): string[] {
  try {
    const parts = parseCronExpression(expr)
    if (!parts) return []

    const matches = (value: string, num: number): boolean => {
      if (value === '*') return true
      if (value.includes('/')) {
        const interval = parseInt(value.split('/')[1])
        return num % interval === 0
      }
      if (value.includes(',')) return value.split(',').some((v) => matches(v.trim(), num))
      if (value.includes('-')) {
        const [min, max] = value.split('-').map(Number)
        return num >= min && num <= max
      }
      return parseInt(value) === num
    }

    const now = new Date()
    const runs: string[] = []
    const d = new Date(now)
    d.setSeconds(0)
    d.setMilliseconds(0)
    d.setMinutes(d.getMinutes() + 1)

    let iterations = 0
    while (runs.length < count && iterations < 525960) {
      if (matches(parts.minute, d.getMinutes()) &&
          matches(parts.hour, d.getHours()) &&
          matches(parts.dayOfMonth, d.getDate()) &&
          matches(parts.month, d.getMonth() + 1) &&
          matches(parts.dayOfWeek, d.getDay())) {
        runs.push(d.toLocaleString())
      }
      d.setMinutes(d.getMinutes() + 1)
      iterations++
    }
    return runs
  } catch {
    return []
  }
}

export function CronBuilderTool() {
  const [activeTab, setActiveTab] = useState<'visual' | 'raw'>('visual')
  const [rawExpression, setRawExpression] = useState('0 9 * * *')
  const [cronPart, setCronPart] = useState<CronParts>(DEFAULT_CRON)
  const [inputError, setInputError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const expression = useMemo(() =>
    activeTab === 'raw' ? rawExpression : buildCronExpression(cronPart),
    [activeTab, rawExpression, cronPart]
  )

  const description = useMemo(() => getCronDescription(expression), [expression])
  const nextRuns = useMemo(() => getNextRuns(expression, 5), [expression])

  const handleTabChange = useCallback((tab: 'visual' | 'raw') => {
    setActiveTab(tab)
    if (tab === 'raw') setRawExpression(buildCronExpression(cronPart))
    else {
      const parsed = parseCronExpression(rawExpression)
      if (parsed) setCronPart(parsed)
    }
  }, [cronPart, rawExpression])

  const handleRawChange = useCallback((value: string) => {
    setRawExpression(value)
    const parsed = parseCronExpression(value)
    if (parsed) { setCronPart(parsed); setInputError(null) }
    else if (value.trim()) setInputError('Invalid cron expression format')
  }, [])

  const handleCopy = useCallback(async (value: string, field: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }, [])

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => handleTabChange('visual')}
          className={`px-4 py-2 rounded text-sm font-medium border-2 transition-all ${
            activeTab === 'visual'
              ? 'bg-[#e94560] text-white border-[#f39c12]'
              : 'bg-transparent text-[#9ca3af] border-[#2d2d44] hover:text-white'
          }`}
        >
          Visual Builder
        </button>
        <button
          onClick={() => handleTabChange('raw')}
          className={`px-4 py-2 rounded text-sm font-medium border-2 transition-all ${
            activeTab === 'raw'
              ? 'bg-[#e94560] text-white border-[#f39c12]'
              : 'bg-transparent text-[#9ca3af] border-[#2d2d44] hover:text-white'
          }`}
        >
          Raw Expression
        </button>
      </div>

      {activeTab === 'visual' ? (
        <div className="p-4 bg-[#0f0f23] border-2 border-[#2d2d44] rounded-lg">
          <h3 className="text-sm text-[#9ca3af] font-medium mb-4">Build Your Cron Expression</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {([
              { key: 'minute' as const, label: 'Minute', options: MINUTE_OPTIONS },
              { key: 'hour' as const, label: 'Hour', options: HOUR_OPTIONS },
              { key: 'dayOfMonth' as const, label: 'Day of Month', options: DAY_OF_MONTH_OPTIONS },
              { key: 'month' as const, label: 'Month', options: MONTH_OPTIONS },
              { key: 'dayOfWeek' as const, label: 'Day of Week', options: DAY_OF_WEEK_OPTIONS },
            ]).map(({ key, label, options }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs text-[#9ca3af]">{label}</label>
                <select
                  value={cronPart[key]}
                  onChange={(e) => setCronPart((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full p-2 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white text-sm focus:outline-none focus:border-[#e94560]"
                >
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#0f0f23] border-2 border-[#2d2d44] rounded-lg">
          <h3 className="text-sm text-[#9ca3af] font-medium mb-4">Enter Cron Expression</h3>
          <input
            value={rawExpression}
            onChange={(e) => handleRawChange(e.target.value)}
            placeholder="* * * * *"
            className="w-full p-3 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-lg text-center focus:outline-none focus:border-[#e94560] placeholder:text-[#4a4a5a]"
          />
          {inputError && <p className="text-[#e94560] text-sm mt-2">{inputError}</p>}
          <div className="flex flex-wrap gap-2 mt-4">
            {PRESETS.slice(0, 6).map((preset) => (
              <button
                key={preset.value}
                onClick={() => { setRawExpression(preset.value); const p = parseCronExpression(preset.value); if (p) setCronPart(p) }}
                className="px-3 py-1 rounded border border-[#2d2d44] text-xs text-[#9ca3af] hover:text-white hover:border-[#e94560] transition-all font-mono"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expression Result */}
      <div className="p-4 bg-[#0f0f23] border-2 border-[#2d2d44] rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-[#9ca3af] font-medium">Expression Result</h3>
          <button
            onClick={() => handleCopy(expression, 'expr')}
            className="text-xs text-[#9ca3af] hover:text-[#e94560] transition-colors font-mono"
          >
            {copiedField === 'expr' ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <div className="p-3 bg-[#1a1a2e] rounded-lg mb-3">
          <code className="text-xl font-mono font-bold text-[#f39c12] break-all">{expression}</code>
        </div>
        <p className="text-[#9ca3af]">{description}</p>
      </div>

      {/* Next Runs */}
      {nextRuns.length > 0 && (
        <div className="p-4 bg-[#0f0f23] border-2 border-[#2d2d44] rounded-lg">
          <h3 className="text-sm text-[#9ca3af] font-medium mb-3">Next 5 Execution Times</h3>
          <div className="space-y-2">
            {nextRuns.map((run, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#1a1a2e]">
                <span className="text-xs text-[#9ca3af]">#{idx + 1}</span>
                <code className="font-mono text-sm text-white">{run}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

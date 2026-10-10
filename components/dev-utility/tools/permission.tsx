'use client'

import React, { useState, useCallback } from 'react'

interface PermissionState {
  owner: { read: boolean; write: boolean; execute: boolean }
  group: { read: boolean; write: boolean; execute: boolean }
  other: { read: boolean; write: boolean; execute: boolean }
}

function computeOctal(perms: PermissionState): string {
  const calc = (p: 'owner' | 'group' | 'other') => {
    let val = 0
    if (perms[p].read) val += 4
    if (perms[p].write) val += 2
    if (perms[p].execute) val += 1
    return val
  }
  return `${calc('owner')}${calc('group')}${calc('other')}`
}

function getPermissionBits(perms: PermissionState): string {
  const fmt = (p: 'owner' | 'group' | 'other') =>
    (perms[p].read ? 'r' : '-') + (perms[p].write ? 'w' : '-') + (perms[p].execute ? 'x' : '-')
  return `${fmt('owner')}${fmt('group')}${fmt('other')}`
}

function parseOctalToPerms(octal: string): PermissionState | null {
  const cleaned = octal.replace(/[^0-7]/g, '')
  if (cleaned.length !== 3 || !/^[0-7]{3}$/.test(cleaned)) return null
  const digits = cleaned.split('').map(Number)
  const toRWX = (n: number) => ({
    read: n >= 4,
    write: (n % 4) >= 2,
    execute: (n % 2) === 1,
  })
  return { owner: toRWX(digits[0]), group: toRWX(digits[1]), other: toRWX(digits[2]) }
}

export function PermissionTool() {
  const [perms, setPerms] = useState<PermissionState>({
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    other: { read: true, write: false, execute: false },
  })
  const [octalInput, setOctalInput] = useState('755')
  const [inputError, setInputError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const octal = computeOctal(perms)
  const bits = getPermissionBits(perms)

  const handleChange = useCallback(
    (entity: keyof PermissionState, perm: 'read' | 'write' | 'execute', checked: boolean) => {
      setPerms((prev) => {
        const next = { ...prev, [entity]: { ...prev[entity], [perm]: checked } }
        setOctalInput(computeOctal(next))
        return next
      })
    },
    []
  )

  const handleOctalInputChange = useCallback((value: string) => {
    setOctalInput(value)
    const parsed = parseOctalToPerms(value)
    if (parsed) { setPerms(parsed); setInputError(null) }
    else { setInputError('Invalid octal permission (use 0-7 for each digit)') }
  }, [])

  const handleCopy = useCallback(async (value: string, field: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }, [])

  return (
    <div className="space-y-6">
      {/* Permission Bits */}
      <div className="p-4 bg-[#0f0f23] border-2 border-[#2d2d44] rounded-lg">
        <h3 className="text-sm text-[#9ca3af] font-medium mb-4">Permission Bits</h3>

        <div className="flex gap-3 items-center mb-4">
          <input
            type="text"
            value={octalInput}
            onChange={(e) => handleOctalInputChange(e.target.value)}
            maxLength={3}
            className="w-20 text-center font-mono text-lg font-bold p-2 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white focus:outline-none focus:border-[#e94560]"
          />
          <span className="text-sm text-[#9ca3af]">Octal input</span>
          {inputError && <span className="text-xs text-[#e94560]">{inputError}</span>}
        </div>

        <div className="grid grid-cols-4 gap-3 text-center text-sm">
          <div />
          <div className="font-medium text-[#9ca3af]">Read</div>
          <div className="font-medium text-[#9ca3af]">Write</div>
          <div className="font-medium text-[#9ca3af]">Execute</div>

          {(['owner', 'group', 'other'] as const).map((entity) => (
            <React.Fragment key={entity}>
              <div className="font-medium text-[#9ca3af] capitalize">{entity}</div>
              {(['read', 'write', 'execute'] as const).map((perm) => (
                <div key={`${entity}-${perm}`} className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={perms[entity][perm]}
                    onChange={(e) => handleChange(entity, perm, e.target.checked)}
                    className="w-5 h-5 accent-[#e94560] cursor-pointer"
                  />
                </div>
              ))}
            </React.Fragment>
          ))}

          <div className="font-bold text-lg text-white">Octal</div>
          <div className="col-span-3 font-bold text-2xl tabular-nums text-[#f39c12]">{octal}</div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-[#1a1a2e] text-center">
          <p className="text-xs text-[#9ca3af] mb-1">Symbolic</p>
          <p className="font-mono text-lg tracking-wider text-white">{bits}</p>
        </div>
      </div>

      {/* Command */}
      <div className="p-4 bg-[#0f0f23] border-2 border-[#2d2d44] rounded-lg">
        <h3 className="text-sm text-[#9ca3af] font-medium mb-4">Command</h3>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0a0a1a] font-mono text-lg text-white mb-4">
          <span className="text-green-400">$</span>
          <span>chmod {octal}</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleCopy(`chmod ${octal}`, 'chmod')}
            className="flex-1 py-2 px-4 bg-[#16213e] text-white rounded-lg font-medium border-2 border-[#2d2d44] hover:border-[#e94560] transition-all text-sm"
          >
            {copiedField === 'chmod' ? '✓ Copied!' : 'Copy chmod'}
          </button>
          <button
            onClick={() => handleCopy(octal, 'octal')}
            className="flex-1 py-2 px-4 bg-[#16213e] text-white rounded-lg font-medium border-2 border-[#2d2d44] hover:border-[#e94560] transition-all text-sm"
          >
            {copiedField === 'octal' ? '✓ Copied!' : `Copy ${octal}`}
          </button>
        </div>
      </div>
    </div>
  )
}

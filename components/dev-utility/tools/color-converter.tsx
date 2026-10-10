'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  HexColorPicker,
  HslStringColorPicker,
  RgbStringColorPicker,
} from 'react-colorful'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
    : clean
  if (full.length !== 6) return null
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return { r, g, b }
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rN = r / 255, gN = g / 255, bN = b / 255
  const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN)
  const delta = max - min
  let h = 0, s = 0
  const l = (max + min) / 2
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
    if (max === rN) h = ((gN - bN) / delta + (gN < bN ? 6 : 0)) / 6
    else if (max === gN) h = ((bN - rN) / delta + 2) / 6
    else h = ((rN - gN) / delta + 4) / 6
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function hexToOklch(hex: string): { l: number; c: number; h: number } | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const rL = srgbToLinear(rgb.r / 255)
  const gL = srgbToLinear(rgb.g / 255)
  const bL = srgbToLinear(rgb.b / 255)
  const l1 = 0.4122214708 * rL + 0.5363325363 * gL + 0.0514459929 * bL
  const m1 = 0.2119034982 * rL + 0.6806995451 * gL + 0.1073969566 * bL
  const s1 = 0.0883024619 * rL + 0.2817188376 * gL + 0.6299787005 * bL
  const l_ = Math.cbrt(l1), m_ = Math.cbrt(m1), s_ = Math.cbrt(s1)
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const bCh = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  const C = Math.sqrt(a * a + bCh * bCh)
  let H = Math.atan2(bCh, a) * (180 / Math.PI)
  if (H < 0) H += 360
  return {
    l: Math.round(L * 1000) / 10,
    c: Math.round(C * 1000) / 10,
    h: Math.round(H * 10) / 10,
  }
}

type PickerMode = 'hex' | 'rgb' | 'hsl'

export function ColorConverterTool() {
  const [color, setColor] = useState('#3b82f6')
  const [pickerMode, setPickerMode] = useState<PickerMode>('hex')
  const [hexInput, setHexInput] = useState('#3b82f6')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const rgb = useMemo(() => hexToRgb(color), [color])
  const hsl = useMemo(() => (rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null), [rgb])
  const oklch = useMemo(() => hexToOklch(color), [color])

  const outputs = useMemo(() => {
    if (!rgb || !hsl) return []
    const { r, g, b } = rgb
    const { h, s, l } = hsl
    const formats = [
      { label: 'HEX', value: color },
      { label: 'RGB', value: `rgb(${r}, ${g}, ${b})` },
      { label: 'HSL', value: `hsl(${h}, ${s}%, ${l}%)` },
    ]
    if (oklch) {
      formats.push({ label: 'OKLCH', value: `oklch(${oklch.l}% ${oklch.c} ${oklch.h})` })
    }
    return formats
  }, [color, rgb, hsl, oklch])

  const handleColorChange = useCallback((newColor: string) => {
    setColor(newColor)
    setHexInput(newColor)
  }, [])

  const handleHexInputChange = useCallback((value: string) => {
    setHexInput(value)
    if (value.match(/^#[0-9a-fA-F]{6}$/) || value.match(/^#[0-9a-fA-F]{3}$/)) {
      setColor(value)
    }
  }, [])

  const handleCopy = useCallback(async (value: string, idx: number) => {
    await navigator.clipboard.writeText(value)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }, [])

  const handleReset = useCallback(() => {
    setColor('#3b82f6')
    setHexInput('#3b82f6')
  }, [])

  const pickerColor = useMemo(() => {
    if (pickerMode === 'hsl' && hsl) return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
    if (pickerMode === 'rgb' && rgb) return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    return color
  }, [pickerMode, color, rgb, hsl])

  const pickerOnChange = useCallback((val: string) => {
    if (pickerMode === 'hex') {
      handleColorChange(val)
    } else if (pickerMode === 'rgb') {
      const match = val.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (match) {
        const hex = '#' + [match[1], match[2], match[3]]
          .map((n) => parseInt(n).toString(16).padStart(2, '0'))
          .join('')
        handleColorChange(hex)
      }
    } else if (pickerMode === 'hsl') {
      const match = val.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
      if (match) {
        const h = parseInt(match[1]) / 360
        const s = parseInt(match[2]) / 100
        const l = parseInt(match[3]) / 100
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1; if (t > 1) t -= 1
          if (t < 1/6) return p + (q - p) * 6 * t
          if (t < 1/2) return q
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
          return p
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        const r = Math.round(hue2rgb(p, q, h + 1/3) * 255)
        const g = Math.round(hue2rgb(p, q, h) * 255)
        const b = Math.round(hue2rgb(p, q, h - 1/3) * 255)
        const hex = '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
        handleColorChange(hex)
      }
    }
  }, [pickerMode, handleColorChange])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Color Picker */}
        <div className="p-4 bg-[#0f0f23] border-2 border-[#2d2d44] rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm text-[#9ca3af] font-medium">Color Picker</h3>
            <select
              value={pickerMode}
              onChange={(e) => setPickerMode(e.target.value as PickerMode)}
              className="text-xs px-2 py-1 bg-[#1a1a2e] border border-[#2d2d44] rounded text-white focus:outline-none focus:border-[#e94560]"
            >
              <option value="hex">HEX</option>
              <option value="rgb">RGB</option>
              <option value="hsl">HSL</option>
            </select>
          </div>

          <div className="flex flex-col items-center">
            {/* react-colorful picker */}
            <div className="w-full" style={{ height: 200 }}>
              {pickerMode === 'hex' && (
                <HexColorPicker color={color} onChange={handleColorChange} style={{ width: '100%', height: '100%' }} />
              )}
              {pickerMode === 'rgb' && (
                <RgbStringColorPicker color={pickerColor} onChange={pickerOnChange} style={{ width: '100%', height: '100%' }} />
              )}
              {pickerMode === 'hsl' && (
                <HslStringColorPicker color={pickerColor} onChange={pickerOnChange} style={{ width: '100%', height: '100%' }} />
              )}
            </div>

            {/* HEX Input */}
            <div className="w-full mt-4">
              <label className="block text-xs text-[#9ca3af] mb-1">HEX Input</label>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexInputChange(e.target.value)}
                placeholder="#000000"
                className="w-full p-2.5 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg text-white font-mono text-sm focus:outline-none focus:border-[#e94560] placeholder:text-[#4a4a5a]"
              />
            </div>

            {/* Color Preview */}
            <div
              className="w-full h-16 mt-3 rounded-lg border-2 border-[#2d2d44] shadow-inner"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>

        {/* Right: All Formats */}
        <div className="p-4 bg-[#0f0f23] border-2 border-[#2d2d44] rounded-lg">
          <h3 className="text-sm text-[#9ca3af] font-medium mb-3">All Formats</h3>
          <div className="space-y-2">
            {outputs.map((output, idx) => (
              <div
                key={output.label}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#1a1a2e] group hover:border-[#e94560] border border-transparent transition-all"
              >
                <span className="w-16 text-xs font-medium text-[#9ca3af] shrink-0">
                  {output.label}
                </span>
                <code className="flex-1 text-sm font-mono text-white truncate">
                  {output.value}
                </code>
                <button
                  onClick={() => handleCopy(output.value, idx)}
                  className="px-2 py-1 text-xs text-[#9ca3af] hover:text-[#e94560] opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  {copiedIdx === idx ? '✓' : '⧉'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-transparent text-[#9ca3af] rounded-lg font-medium border-2 border-[#2d2d44] hover:text-white hover:border-[#e94560] transition-all text-sm"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'perspiciatis', 'unde',
  'omnis', 'iste', 'natus', 'error', 'voluptatem', 'accusantium', 'doloremque',
  'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo',
  'inventore', 'veritatis', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta',
]

function generateSentence(minWords = 8, maxWords = 20): string {
  const wordCount = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords
  const words = Array.from({ length: wordCount }, () =>
    LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]
  )
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
  return words.join(' ') + '.'
}

function generateParagraph(): string {
  const sentenceCount = Math.floor(Math.random() * 4) + 3
  return Array.from({ length: sentenceCount }, () => generateSentence()).join(' ')
}

export function LoremTool() {
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [count, setCount] = useState(3)
  const [copied, setCopied] = useState(false)

  const generate = () => {
    setParagraphs(Array.from({ length: count }, () => generateParagraph()))
  }

  const copyAll = async () => {
    await navigator.clipboard.writeText(paragraphs.join('\n\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const clear = () => {
    setParagraphs([])
  }

  const wordCount = paragraphs.reduce((acc, p) => acc + p.split(/\s+/).length, 0)
  const charCount = paragraphs.reduce((acc, p) => acc + p.length, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm text-[#9ca3af]">Paragraphs:</label>
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="px-3 py-1.5 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded text-white text-sm focus:outline-none focus:border-[#e94560]"
        >
          {[1, 2, 3, 5, 8, 10].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <button
          onClick={generate}
          className="flex-1 py-2 px-4 bg-[#e94560] text-white rounded-lg font-medium border-2 border-[#f39c12] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
        >
          Generate Lorem Ipsum
        </button>
        {paragraphs.length > 0 && (
          <>
            <button
              onClick={copyAll}
              className="px-4 py-2 bg-[#16213e] text-white rounded-lg font-medium border-2 border-[#2d2d44] hover:border-[#e94560] transition-all text-sm"
            >
              {copied ? '✓ Copied!' : 'Copy All'}
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

      {paragraphs.length > 0 && (
        <div className="space-y-4">
          <div className="flex gap-4 text-xs text-[#4a4a5a]">
            <span>{paragraphs.length} paragraphs</span>
            <span>{wordCount} words</span>
            <span>{charCount.toLocaleString()} characters</span>
          </div>
          <div className="p-4 bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-white text-sm leading-relaxed mb-3 last:mb-0">
                {p}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

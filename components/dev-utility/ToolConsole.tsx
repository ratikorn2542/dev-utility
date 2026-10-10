'use client'

import { tools } from './tools'
import { useActiveTool } from './tools/useActiveTool'
import { useFavorites } from './tools/useFavorites'
import { Star, ShieldCheck } from 'lucide-react'

const TOOL_TYPE_LABELS = {
  'two-way': 'แปลงไป-กลับ',
  'one-way': 'แปลงค่า',
  'n-way': 'หลายรูปแบบ',
  freestyle: 'เครื่องมือโต้ตอบ',
  generator: 'สร้างค่า',
  snippet: 'ข้อมูลอ้างอิง',
} as const

export function ToolConsole() {
  const { activeTool } = useActiveTool()
  const { toggleFavorite, isFavorite } = useFavorites()

  const tool = tools.find((t) => t.id === activeTool) || tools[0]

  return (
    <main className="min-w-0 flex-1 bg-[#0d1424]">
      <div className="border-b border-[#243150] bg-[#0f1728]/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1260px] items-start justify-between gap-4 px-5 py-5 sm:px-7 lg:px-10 lg:py-6">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="tool-type-chip">{TOOL_TYPE_LABELS[tool.type]}</span>
              <span className="text-xs text-[#7888a8]">{tool.category}</span>
            </div>
            <h1 className="text-xl font-semibold tracking-[-0.025em] text-[#f2f5ff] sm:text-2xl">{tool.name}</h1>
            {tool.description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#91a0be]">{tool.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => toggleFavorite(tool.id)}
            aria-label={isFavorite(tool.id) ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
            className={`tool-favorite ${isFavorite(tool.id) ? 'tool-favorite-active' : ''}`}
            title={isFavorite(tool.id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`size-4 ${isFavorite(tool.id) ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{isFavorite(tool.id) ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1260px] px-5 py-6 sm:px-7 lg:px-10 lg:py-8">
        <section className="tool-canvas">
          {tool.component}
        </section>
      </div>

      <div className="mx-auto max-w-[1260px] px-5 pb-8 sm:px-7 lg:px-10">
        <div className="flex items-center gap-2 text-xs leading-5 text-[#71809e]">
          <ShieldCheck className="size-4 shrink-0 text-[#52b590]" />
          <span>ประมวลผลทั้งหมดในเบราว์เซอร์ ข้อมูลของคุณไม่ถูกส่งออกไปที่อื่น</span>
        </div>
      </div>
    </main>
  )
}

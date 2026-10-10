import { Braces, Circle } from 'lucide-react'
import { DevUtilityLayout } from '@/components/dev-utility/DevUtilityLayout'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string }>
}) {
  const { tool } = await searchParams

  return (
    <div className="app-shell min-h-screen">
      <header className="app-header">
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="brand-mark">
              <Braces className="size-5" strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#edf2ff]">Dev Utility</span>
                <span className="hidden rounded-md border border-[#263453] bg-[#141e33] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#91a5cb] sm:inline">
                  Local toolkit
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#7e8dab]">เครื่องมือเล็ก ๆ สำหรับงานพัฒนาในทุกวัน</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-[#7e8dab] sm:flex">
            <Circle className="size-2 fill-[#43b48e] text-[#43b48e]" />
            ทำงานในเบราว์เซอร์ของคุณ
          </div>
        </div>
      </header>
      <DevUtilityLayout initialTool={tool} />
    </div>
  )
}

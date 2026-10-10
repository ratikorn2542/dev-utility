import { ReactNode } from 'react'

export type ToolCategory = 'Converter' | 'Hash' | 'Typo' | 'Snippet'

export interface BaseTool {
  id: string
  name: string
  description?: string
  category: ToolCategory
}

export interface GeneratorTool extends BaseTool {
  type: 'generator'
  component: ReactNode
}

export interface OneWayTool extends BaseTool {
  type: 'one-way'
  component: ReactNode
}

export interface TwoWayTool extends BaseTool {
  type: 'two-way'
  component: ReactNode
}

export interface NWayTool extends BaseTool {
  type: 'n-way'
  component: ReactNode
}

export interface FreeStyleTool extends BaseTool {
  type: 'freestyle'
  component: ReactNode
}

export interface SnippetTool extends BaseTool {
  type: 'snippet'
  component: ReactNode
}

export type Tool =
  | GeneratorTool
  | OneWayTool
  | TwoWayTool
  | NWayTool
  | FreeStyleTool
  | SnippetTool

export type ToolRegistryItem = Tool & {
  keywords?: string[]
}

export interface SnippetItem {
  key: string
  value: string
  description?: string
  keywords?: string[]
}

'use client'

import { useState, useCallback, useReducer, useEffect, useRef } from 'react'
import { ChevronRight, ChevronDown, Plus, Trash2, Copy, Search, Undo2, Redo2, Code, GitBranch, AlertCircle, Check } from 'lucide-react'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

interface HistoryState {
  json: JsonValue | null
  text: string
}

interface EditorState {
  json: JsonValue | null
  text: string
  mode: 'tree' | 'text'
  searchQuery: string
  expandedPaths: Set<string>
  error: string | null
  history: HistoryState[]
  historyIndex: number
}

type Action =
  | { type: 'SET_JSON'; json: JsonValue | null; text: string }
  | { type: 'SET_TEXT'; text: string; json: JsonValue | null }
  | { type: 'SET_MODE'; mode: 'tree' | 'text' }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'TOGGLE_EXPAND'; path: string }
  | { type: 'EXPAND_ALL' }
  | { type: 'COLLAPSE_ALL' }
  | { type: 'UPDATE_NODE'; path: string; value: JsonValue }
  | { type: 'ADD_NODE'; path: string; key: string; value: JsonValue }
  | { type: 'DELETE_NODE'; path: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_ERROR' }

function getPathParts(path: string): string[] {
  return path.split('.').filter(Boolean)
}

function setValueAtPath(json: JsonValue | null, path: string, value: JsonValue): JsonValue | null {
  if (!json) return null
  const parts = getPathParts(path)
  const result = Array.isArray(json) ? [...json] : { ...json as Record<string, JsonValue> }
  let current: JsonValue = result

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (Array.isArray(current)) {
      current = current[parseInt(part, 10)]
    } else {
      current = (current as Record<string, JsonValue>)[part]
    }
  }

  const lastPart = parts[parts.length - 1]
  if (Array.isArray(current)) {
    current[parseInt(lastPart, 10)] = value
  } else {
    (current as Record<string, JsonValue>)[lastPart] = value
  }

  return result
}

function deleteAtPath(json: JsonValue | null, path: string): JsonValue | null {
  if (!json) return null
  const parts = getPathParts(path)
  const result = Array.isArray(json) ? [...json] : { ...json as Record<string, JsonValue> }
  let current: JsonValue = result

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (Array.isArray(current)) {
      current = current[parseInt(part, 10)]
    } else {
      current = (current as Record<string, JsonValue>)[part]
    }
  }

  const lastPart = parts[parts.length - 1]
  if (Array.isArray(current)) {
    current.splice(parseInt(lastPart, 10), 1)
  } else {
    delete (current as Record<string, JsonValue>)[lastPart]
  }

  return result
}

function addAtPath(json: JsonValue | null, path: string, key: string, value: JsonValue): JsonValue | null {
  if (!json) return null
  const parts = getPathParts(path)
  const result = Array.isArray(json) ? [...json] : { ...json as Record<string, JsonValue> }
  let current: JsonValue = result

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (Array.isArray(current)) {
      current = current[parseInt(part, 10)]
    } else {
      current = (current as Record<string, JsonValue>)[part]
    }
  }

  if (Array.isArray(current)) {
    current.push(value)
  } else {
    (current as Record<string, JsonValue>)[key] = value
  }

  return result
}

function collectAllPaths(json: JsonValue | null, prefix = 'root'): string[] {
  if (json === null || json === undefined) return [prefix]
  if (Array.isArray(json)) {
    const paths = [prefix]
    json.forEach((item, i) => {
      paths.push(...collectAllPaths(item, `${prefix}.${i}`))
    })
    return paths
  }
  if (typeof json === 'object') {
    const paths = [prefix]
    Object.keys(json).forEach((key) => {
      paths.push(...collectAllPaths((json as Record<string, JsonValue>)[key], `${prefix}.${key}`))
    })
    return paths
  }
  return [prefix]
}

function countNodes(json: JsonValue | null): number {
  if (json === null || json === undefined) return 0
  if (Array.isArray(json)) {
    return 1 + json.reduce<number>((sum, item) => sum + countNodes(item), 0)
  }
  if (typeof json === 'object') {
    return 1 + Object.values(json).reduce<number>((sum, val) => sum + countNodes(val), 0)
  }
  return 1
}

function getMaxDepth(json: JsonValue | null, currentDepth = 0): number {
  if (json === null || json === undefined) return currentDepth
  if (Array.isArray(json)) {
    if (json.length === 0) return currentDepth
    return Math.max(...json.map((item) => getMaxDepth(item, currentDepth + 1)))
  }
  if (typeof json === 'object') {
    const entries = Object.entries(json)
    if (entries.length === 0) return currentDepth
    return Math.max(...entries.map(([, val]) => getMaxDepth(val, currentDepth + 1)))
  }
  return currentDepth
}

function editorReducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SET_JSON':
      return {
        ...state,
        json: action.json,
        text: action.text,
        error: null,
      }
    case 'SET_TEXT':
      return {
        ...state,
        json: action.json,
        text: action.text,
        error: null,
      }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query }
    case 'TOGGLE_EXPAND': {
      const newExpanded = new Set(state.expandedPaths)
      if (newExpanded.has(action.path)) {
        newExpanded.delete(action.path)
      } else {
        newExpanded.add(action.path)
      }
      return { ...state, expandedPaths: newExpanded }
    }
    case 'EXPAND_ALL': {
      const allPaths = collectAllPaths(state.json)
      return { ...state, expandedPaths: new Set(allPaths) }
    }
    case 'COLLAPSE_ALL':
      return { ...state, expandedPaths: new Set(['root']) }
    case 'UPDATE_NODE': {
      if (!state.json) return state
      const newJson = setValueAtPath(state.json, action.path, action.value)
      const newText = JSON.stringify(newJson, null, 2)
      return {
        ...state,
        json: newJson,
        text: newText,
      }
    }
    case 'ADD_NODE': {
      if (!state.json) return state
      const newJson = addAtPath(state.json, action.path, action.key, action.value)
      const newText = JSON.stringify(newJson, null, 2)
      return {
        ...state,
        json: newJson,
        text: newText,
      }
    }
    case 'DELETE_NODE': {
      if (!state.json) return state
      const newJson = deleteAtPath(state.json, action.path)
      const newText = JSON.stringify(newJson, null, 2)
      return {
        ...state,
        json: newJson,
        text: newText,
      }
    }
    case 'UNDO': {
      if (state.historyIndex <= 0) return state
      const prevState = state.history[state.historyIndex - 1]
      return {
        ...state,
        json: prevState.json,
        text: prevState.text,
        historyIndex: state.historyIndex - 1,
        error: null,
      }
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state
      const nextState = state.history[state.historyIndex + 1]
      return {
        ...state,
        json: nextState.json,
        text: nextState.text,
        historyIndex: state.historyIndex + 1,
        error: null,
      }
    }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

const SAMPLE_JSON = `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "address": {
    "city": "Bangkok",
    "zip": "10100"
  },
  "phones": [
    { "type": "home", "number": "02-123-4567" },
    { "type": "mobile", "number": "081-234-5678" }
  ],
  "active": true,
  "balance": null
}`

function parseJsonSafe(text: string): { json: JsonValue | null; error: string | null } {
  try {
    const parsed = JSON.parse(text)
    return { json: parsed, error: null }
  } catch (e) {
    return { json: null, error: (e as Error).message }
  }
}

function getValueType(value: JsonValue): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'string':
      return 'text-emerald-400'
    case 'number':
      return 'text-sky-400'
    case 'boolean':
      return 'text-violet-400'
    case 'null':
      return 'text-rose-400'
    case 'array':
      return 'text-amber-400'
    case 'object':
      return 'text-amber-400'
    default:
      return 'text-zinc-400'
  }
}

interface JsonNodeProps {
  path: string
  keyName: string
  value: JsonValue
  expandedPaths: Set<string>
  searchQuery: string
  onToggle: (path: string) => void
  onUpdate: (path: string, value: JsonValue) => void
  onDelete: (path: string) => void
  onAdd: (path: string, key: string, value: JsonValue) => void
  isRoot?: boolean
  depth?: number
}

function JsonNode({
  path,
  keyName,
  value,
  expandedPaths,
  searchQuery,
  onToggle,
  onUpdate,
  onDelete,
  onAdd,
  isRoot = false,
  depth = 0,
}: JsonNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isAddingKey, setIsAddingKey] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const valueType = getValueType(value)
  const isExpandable = valueType === 'object' || valueType === 'array'
  const isExpanded = expandedPaths.has(path)

  const matchesSearch = searchQuery && (
    keyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    JSON.stringify(value).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDoubleClick = () => {
    if (!isExpandable) {
      setEditValue(valueType === 'string' ? value as string : JSON.stringify(value))
      setIsEditing(true)
    }
  }

  const handleEditSave = () => {
    let parsedValue: JsonValue = editValue
    if (valueType === 'number') {
      parsedValue = parseFloat(editValue) || 0
    } else if (valueType === 'boolean') {
      parsedValue = editValue.toLowerCase() === 'true'
    } else if (valueType === 'null') {
      parsedValue = editValue.toLowerCase() === 'null' ? null : editValue
    }
    onUpdate(path, parsedValue)
    setIsEditing(false)
  }

  const handleAddKey = () => {
    if (newKey.trim()) {
      const defaultVal: JsonValue = valueType === 'array' ? '' : ''
      onAdd(path, newKey.trim(), defaultVal)
      setNewKey('')
      setNewValue('')
      setIsAddingKey(false)
    }
  }

  const handleDelete = () => {
    if (isRoot) return
    onDelete(path)
  }

  const renderValue = () => {
    if (isEditing) {
      return (
        <span className="inline-flex items-center gap-1 ml-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEditSave()
              if (e.key === 'Escape') setIsEditing(false)
            }}
            className="px-2 py-0.5 bg-[#1a1a2e] border border-[#e94560] rounded text-sm text-white font-mono focus:outline-none w-32"
            autoFocus
          />
        </span>
      )
    }

    if (isExpandable) {
      const itemCount = Array.isArray(value) ? value.length : Object.keys(value as object).length
      return (
        <span className="text-zinc-500 text-xs ml-1">
          {isExpanded ? '' : `[${itemCount} ${itemCount === 1 ? 'item' : 'items'}]`}
        </span>
      )
    }

    const displayValue = valueType === 'string' ? `"${value}"` : String(value)

    return (
      <span
        className={`${getTypeColor(valueType)} font-mono ml-2 cursor-pointer hover:opacity-80`}
        onDoubleClick={handleDoubleClick}
      >
        {displayValue}
      </span>
    )
  }

  const renderChildren = () => {
    if (!isExpandable || !isExpanded) return null

    if (valueType === 'array') {
      return (
        <div className="pl-4 border-l border-zinc-800">
          {(value as JsonValue[]).map((item, index) => (
            <JsonNode
              key={`${path}.${index}`}
              path={`${path}.${index}`}
              keyName={`[${index}]`}
              value={item}
              expandedPaths={expandedPaths}
              searchQuery={searchQuery}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAdd={onAdd}
              depth={depth + 1}
            />
          ))}
        </div>
      )
    }

    const obj = value as Record<string, JsonValue>
    return (
      <div className="pl-4 border-l border-zinc-800">
        {Object.entries(obj).map(([key, val]) => (
          <JsonNode
            key={`${path}.${key}`}
            path={`${path}.${key}`}
            keyName={key}
            value={val}
            expandedPaths={expandedPaths}
            searchQuery={searchQuery}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAdd={onAdd}
            depth={depth + 1}
          />
        ))}
      </div>
    )
  }

  const renderAddControls = () => {
    if (!isExpanded || isRoot) return null

    if (isAddingKey) {
      return (
        <div className="flex items-center gap-1 ml-2 text-xs">
          <input
            type="text"
            placeholder="key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="w-20 px-1 py-0.5 bg-[#1a1a2e] border border-zinc-600 rounded text-white text-xs focus:outline-none focus:border-[#e94560]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddKey()
              if (e.key === 'Escape') setIsAddingKey(false)
            }}
            autoFocus
          />
          <span className="text-zinc-500">:</span>
          <input
            type="text"
            placeholder="value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="w-20 px-1 py-0.5 bg-[#1a1a2e] border border-zinc-600 rounded text-white text-xs focus:outline-none focus:border-[#e94560]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddKey()
              if (e.key === 'Escape') setIsAddingKey(false)
            }}
          />
          <button
            onClick={handleAddKey}
            className="px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsAddingKey(false)}
            className="px-1 py-0.5 bg-zinc-700/50 text-zinc-400 rounded hover:bg-zinc-700"
          >
            ×
          </button>
        </div>
      )
    }

    return (
      <button
        onClick={() => setIsAddingKey(true)}
        className="ml-2 p-0.5 text-zinc-600 hover:text-emerald-400 transition-colors"
        title="Add property"
      >
        <Plus className="w-3 h-3" />
      </button>
    )
  }

  return (
    <div className={`py-0.5 ${matchesSearch ? 'bg-yellow-500/20 rounded px-1' : ''}`}>
      <div className="flex items-center hover:bg-zinc-800/50 rounded px-1 py-0.5 group">
        {isExpandable ? (
          <button
            onClick={() => onToggle(path)}
            className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <span className="w-4 h-4" />
        )}

        <span className={`${getTypeColor(valueType)} font-mono text-sm ${isRoot ? 'font-bold' : ''}`}>
          {isRoot ? 'root' : keyName}
        </span>

        {!isRoot && !isExpandable && (
          <span className="text-zinc-600 mx-1">:</span>
        )}

        {renderValue()}

        {!isRoot && (
          <>
            {renderAddControls()}
            <button
              onClick={handleDelete}
              className="ml-auto p-0.5 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}

        {isRoot && valueType !== 'array' && valueType !== 'object' && (
          <span className="ml-2 text-xs text-zinc-500">(root value)</span>
        )}
      </div>

      {renderChildren()}
    </div>
  )
}

export function JsonEditorTool() {
  const initialState: EditorState = {
    json: JSON.parse(SAMPLE_JSON),
    text: SAMPLE_JSON,
    mode: 'tree',
    searchQuery: '',
    expandedPaths: new Set(['root']),
    error: null,
    history: [{ json: JSON.parse(SAMPLE_JSON), text: SAMPLE_JSON }],
    historyIndex: 0,
  }

  const [state, dispatch] = useReducer(editorReducer, initialState)
  const [indent, setIndent] = useState(2)
  const [copied, setCopied] = useState(false)
  const [localText, setLocalText] = useState(SAMPLE_JSON)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleTextChange = useCallback((text: string) => {
    setLocalText(text)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const { json, error } = parseJsonSafe(text)
      if (error) {
        dispatch({ type: 'SET_TEXT', text, json: null })
      } else {
        dispatch({ type: 'SET_TEXT', text, json })
      }
    }, 300)
  }, [])

  const handleToggle = useCallback((path: string) => {
    dispatch({ type: 'TOGGLE_EXPAND', path })
  }, [])

  const handleUpdate = useCallback((path: string, value: JsonValue) => {
    const newJson = setValueAtPath(state.json, path, value)
    const newText = JSON.stringify(newJson, null, indent)
    setLocalText(newText)
    dispatch({ type: 'SET_JSON', json: newJson, text: newText })
  }, [state.json, indent])

  const handleDelete = useCallback((path: string) => {
    const newJson = deleteAtPath(state.json, path)
    const newText = JSON.stringify(newJson, null, indent)
    setLocalText(newText)
    dispatch({ type: 'SET_JSON', json: newJson, text: newText })
  }, [state.json, indent])

  const handleAdd = useCallback((path: string, key: string, value: JsonValue) => {
    const newJson = addAtPath(state.json, path, key, value)
    const newText = JSON.stringify(newJson, null, indent)
    setLocalText(newText)
    dispatch({ type: 'SET_JSON', json: newJson, text: newText })
  }, [state.json, indent])

  const handleExpandAll = () => {
    dispatch({ type: 'EXPAND_ALL' })
  }

  const handleCollapseAll = () => {
    dispatch({ type: 'COLLAPSE_ALL' })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(state.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleUndo = () => {
    dispatch({ type: 'UNDO' })
    setLocalText(state.history[state.historyIndex - 1]?.text || '')
  }

  const handleRedo = () => {
    dispatch({ type: 'REDO' })
    setLocalText(state.history[state.historyIndex + 1]?.text || '')
  }

  const handleFormat = () => {
    const formatted = JSON.stringify(state.json, null, indent)
    setLocalText(formatted)
    dispatch({ type: 'SET_JSON', json: state.json, text: formatted })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          dispatch({ type: 'REDO' })
          setLocalText(state.history[state.historyIndex + 1]?.text || '')
        } else {
          dispatch({ type: 'UNDO' })
          setLocalText(state.history[state.historyIndex - 1]?.text || '')
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault()
        dispatch({ type: 'REDO' })
        setLocalText(state.history[state.historyIndex + 1]?.text || '')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.historyIndex, state.history])

  const nodeCount = countNodes(state.json)
  const maxDepth = getMaxDepth(state.json)
  const { error } = parseJsonSafe(localText)

  const canUndo = state.historyIndex > 0
  const canRedo = state.historyIndex < state.history.length - 1

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'SET_MODE', mode: 'tree' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border-2 transition-all ${
              state.mode === 'tree'
                ? 'bg-[#e94560] text-white border-[#f39c12]'
                : 'bg-transparent text-[#9ca3af] border-[#2d2d44] hover:text-white'
            }`}
          >
            <GitBranch className="w-3 h-3" />
            Tree
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_MODE', mode: 'text' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border-2 transition-all ${
              state.mode === 'text'
                ? 'bg-[#e94560] text-white border-[#f39c12]'
                : 'bg-transparent text-[#9ca3af] border-[#2d2d44] hover:text-white'
            }`}
          >
            <Code className="w-3 h-3" />
            Text
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9ca3af]">Indent:</span>
          <select
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value))}
            className="px-2 py-1 bg-[#1a1a2e] border border-[#2d2d44] rounded text-white text-xs focus:outline-none focus:border-[#e94560]"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={8}>8 spaces</option>
          </select>
        </div>

        <div className="flex items-center gap-1 flex-1 max-w-xs">
          <Search className="w-3 h-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Search keys/values..."
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH', query: e.target.value })}
            className="flex-1 px-2 py-1 bg-[#1a1a2e] border border-[#2d2d44] rounded text-white text-xs focus:outline-none focus:border-[#e94560] placeholder:text-zinc-600"
          />
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded transition-colors ${
              canUndo ? 'text-[#9ca3af] hover:text-white hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded transition-colors ${
              canRedo ? 'text-[#9ca3af] hover:text-white hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-rose-400 text-xs font-mono">{error}</p>
        </div>
      )}

      <div className="bg-[#1a1a2e] border-2 border-[#2d2d44] rounded-lg overflow-hidden">
        {state.mode === 'tree' ? (
          <div className="p-4 max-h-[500px] overflow-auto">
            {state.json !== null ? (
              <JsonNode
                path="root"
                keyName="root"
                value={state.json}
                expandedPaths={state.expandedPaths}
                searchQuery={state.searchQuery}
                onToggle={handleToggle}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onAdd={handleAdd}
                isRoot
              />
            ) : (
              <div className="text-zinc-500 text-sm text-center py-8">
                Paste valid JSON in Text mode to see tree view
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <button
                onClick={handleFormat}
                className="px-2 py-1 bg-[#16213e] text-white text-xs rounded border border-[#2d2d44] hover:border-[#e94560] transition-colors"
              >
                Format
              </button>
            </div>
            <textarea
              ref={textAreaRef}
              value={localText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full h-[500px] p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none"
              spellCheck={false}
              placeholder="Paste your JSON here..."
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleExpandAll}
            className="text-xs text-[#9ca3af] hover:text-white transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="text-xs text-[#9ca3af] hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500">
            {nodeCount} nodes · depth {maxDepth}
          </span>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all ${
              copied
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-transparent text-[#9ca3af] border-[#2d2d44] hover:text-white hover:border-[#e94560]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

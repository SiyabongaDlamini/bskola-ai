'use client'

import { useCallback, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

import type { TeachingBoard, TeachingSection } from './teaching-board'

const STORAGE_KEY = 'bskola_teaching_boards'

const subjectOptions = [
  'All',
  'Math',
  'Science',
  'History',
  'English',
  'Programming',
  'Business',
  'Other'
] as const

function loadBoards(): TeachingBoard[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveBoards(boards: TeachingBoard[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards))
  } catch {
    // quota exceeded or private mode — silently skip
  }
}

export interface BoardLibraryProps {
  onSelectBoard: (board: TeachingBoard) => void
}

export function BoardLibrary({ onSelectBoard }: BoardLibraryProps) {
  const [boards, setBoards] = useState<TeachingBoard[]>(() => {
    if (typeof window === 'undefined') return []
    return loadBoards()
  })
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState<'All' | (typeof subjectOptions[number])>('All')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return boards.filter((b) => {
      const matchesQuery =
        b.topic.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q)
      const matchesSubject =
        subject === 'All' || b.subject === subject
      return matchesQuery && matchesSubject
    })
  }, [boards, query, subject])

  const addBoard = useCallback((board: TeachingBoard) => {
    setBoards((prev) => {
      const next = [board, ...prev.filter((b) => b.id !== board.id)]
      saveBoards(next)
      return next
    })
  }, [])

  const deleteBoard = useCallback((id: string) => {
    setBoards((prev) => {
      const next = prev.filter((b) => b.id !== id)
      saveBoards(next)
      return next
    })
  }, [])

  if (boards.length === 0) {
    return (
      <section className="flex-1 flex flex-col items-center justify-center pt-20 sm:pt-32 px-6">
        <div className="max-w-xl w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-teaching-accent/30 bg-teaching-muted/50 px-4 py-1 text-xs font-semibold text-teaching-accent uppercase tracking-wider">
            My Library · Athenar
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Your lesson boards
          </h2>
          <p className="text-lg text-muted-foreground">
            Boards you generate appear here. Pick a topic above and Athenar
            builds your first one.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex-1 min-h-0 p-6 sm:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Your lesson boards
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} board{filtered.length !== 1 ? 's' : ''} saved
              locally in your browser.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search boards…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64 sm:w-80"
            />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as any)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {subjectOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Separator />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onSelect={onSelectBoard}
              onDelete={deleteBoard}
            />
          ))}
        </div>

        {filtered.length < boards.length && (
          <div className="mt-6 flex justify-center">
            <p className="text-xs text-muted-foreground">
              Some boards hidden by current filters.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

interface BoardCardProps {
  board: TeachingBoard
  onSelect: (board: TeachingBoard) => void
  onDelete: (id: string) => void
}

function BoardCard({ board, onSelect, onDelete }: BoardCardProps) {
  const sectionCount = board.sections.length
  const itemCount = board.sections.reduce(
    (sum: number, s: TeachingSection) => sum + s.items.length,
    0
  )

  return (
    <Card
      className="group cursor-pointer hover:border-teaching-accent/50 transition-colors"
      onClick={() => onSelect(board)}
    >
      <div className="overflow-hidden">
        <div className="bg-teaching-muted/40 border-b border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <BadgeLite variant="outline" className="text-teaching-accent border-teaching-accent/40">
              {board.subject}
            </BadgeLite>
            <BadgeLite variant="secondary">{board.level}</BadgeLite>
          </div>
          <h3 className="font-semibold text-foreground group-hover:text-teaching-accent transition-colors leading-tight">
            {board.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {board.topic}
          </p>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
            <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(board)
              }}
              className="flex-1"
            >
              Open
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(board.id)
              }}
              className="size-8 opacity-50 group-hover:opacity-100"
              aria-label="Delete board"
            >
              ×
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface BadgeLiteProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline'
  className?: string
  children: React.ReactNode
}

function BadgeLite({ variant = 'default', className, children }: BadgeLiteProps) {
  const base =
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors'
  const variants: Record<string, string> = {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    outline: 'text-foreground border-border'
  }
  return (
    <div className={base + ' ' + variants[variant] + ' ' + (className ?? '')}>
      {children}
    </div>
  )
}

'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'

import type {
  TeachingBoard,
  TeachingItem,
  TeachingSection
} from './teaching-board'

const SECTION_ORDER: Array<TeachingSection['type']> = [
  'objectives',
  'concepts',
  'examples',
  'summary',
  'quiz',
  'other'
]

const SECTION_LABELS: Record<TeachingSection['type'], string> = {
  objectives: 'Learning Objectives',
  concepts: 'Key Concepts',
  examples: 'Worked Examples',
  summary: 'Summary',
  quiz: 'Quick Quiz',
  other: 'Notes'
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatSectionItems(items: TeachingItem[]): string {
  return items
    .map((item) => {
      const lines: string[] = []
      if (item.title) lines.push(`**${item.title}**`)
      if (item.content) lines.push(item.content)
      if (item.detail) lines.push(`_${item.detail}_`)
      return lines.join('\n')
    })
    .join('\n\n')
}

export interface BoardViewerProps {
  board: TeachingBoard
  onRegenerate: () => void
  onClose: () => void
}

export function BoardViewer({ board, onRegenerate, onClose }: BoardViewerProps) {
  const [followUp, setFollowUp] = useState('')
  const [chatting, setChatting] = useState(false)
  const [chatHistory, setChatHistory] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([])
  const abortRef = useRef<AbortController | null>(null)

  const boardMarkdown = useMemo(() => {
    const lines: string[] = []
    lines.push(`# ${board.title}\n`)
    lines.push(`Topic: ${board.topic} · ${board.subject} · ${board.level} level\n`)
    lines.push(`Built by Athenar on BSkola\n`)
    for (const section of board.sections) {
      lines.push(`## ${SECTION_LABELS[section.type]}\n`)
      lines.push(formatSectionItems(section.items) + '\n')
    }
    return lines.join('\n')
  }, [board])

  const askFollowUp = useCallback(
    async (question: string) => {
      if (!question.trim()) return
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const userMsg = { role: 'user' as const, content: question }
      setChatHistory((prev) => [...prev, userMsg])
      setFollowUp('')
      setChatting(true)

      try {
        const context = `You are Athenar, an AI tutor on BSkola. The student is asking a follow-up question about this teaching board they just generated:

BOARD:
${boardMarkdown}

STUDENT QUESTION: ${question}

Answer concisely and helpfully, referencing the board content when useful. Do not regenerate the whole board unless asked.`

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                parts: [{ type: 'text', text: context }]
              }
            ],
            chatId: `board-followup-${Date.now()}`
          }),
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error(
            `Athenar couldn't answer (${response.status})`
          )
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body from Athenar.')

        let collected = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          collected += new TextDecoder().decode(value, { stream: true })
        }

        const text = collected
          .replace(/0:"(.*?)"/g, (_, m) => m)
          .replace(/\\(.)/g, '$1')
          .replace(/^data: /gm, '')
          .trim()

        if (!text) {
          throw new Error('Athenar returned an empty answer.')
        }

        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', content: text }
        ])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message =
          err instanceof Error ? err.message : 'Unknown error.'
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Sorry, I couldn't answer that right now. ${message}`
          }
        ])
        toast.error('Failed to get answer from Athenar')
      } finally {
        setChatting(false)
      }
    },
    [boardMarkdown]
  )

  const exportMarkdown = useCallback(() => {
    const blob = new Blob([boardMarkdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${board.topic.replace(/\s+/g, '-')}-board.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`"${board.title}" exported to markdown`)
  }, [board, boardMarkdown])

  const copyMarkdown = useCallback(() => {
    navigator.clipboard.writeText(boardMarkdown)
    toast.success('Board copied to clipboard')
  }, [boardMarkdown])

  return (
    <div className="flex flex-col h-full">
      {/* Board header + actions */}
      <header className="flex-shrink-0 border-b border-border bg-background/80 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              ← Back to library
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-teaching-accent border-teaching-accent/40">
                {board.subject}
              </Badge>
              <Badge variant="secondary">{board.level}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRegenerate}>
              Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={exportMarkdown}>
              Export markdown
            </Button>
            <Button size="sm" onClick={copyMarkdown}>
              Copy
            </Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-2">
          <h1 className="text-2xl font-bold tracking-tight">{board.title}</h1>
          <p className="text-sm text-muted-foreground">
            Topic: {board.topic} · {board.subject} · {board.level} level
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* Board content */}
        <div className="flex-1 min-w-0 p-6 sm:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {board.sections.map((section) => (
                <Card
                  key={section.title}
                  className="overflow-hidden border-teaching-accent/30"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-teaching-accent border-teaching-accent/40">
                        {SECTION_LABELS[section.type]}
                      </Badge>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {section.items.length} item{section.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {section.type === 'concepts' || section.type === 'examples' ? (
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger asChild>
                          <button
                            className="w-full text-left px-0 py-2 text-sm font-medium text-teaching-accent hover:text-teaching-accent/90 underline-offset-4"
                          >
                            View {section.items.length} {section.type === 'concepts' ? 'concepts' : 'examples'}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          {renderItems(section.items)}
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      renderItems(section.items)
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator className="my-4" />

            <Card className="bg-teaching-muted/40 border-teaching-accent/30">
              <CardHeader>
                <CardTitle className="text-teaching-accent font-bold flex items-center gap-2">
                  <span aria-hidden="true">★</span> Built by Athenar on BSkola
                </CardTitle>
                <CardDescription>
                  Ask follow-up questions below, or export this board to
                  keep it in your notes.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Follow-up chat panel */}
        <div className="w-full lg:w-96 min-w-[320px] border-l border-border bg-background flex flex-col">
          <div className="border-b border-border p-5 bg-background/50">
            <h3 className="font-semibold text-foreground">Ask Athenar</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Follow-up questions about this board
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-sm text-muted-foreground">
                  No questions yet. Ask Athenar anything about this lesson.
                </p>
              </div>
            ) : (
              chatHistory.map((msg, i) => {
                const isUser = msg.role === 'user'
                return (
                  <div
                    key={i}
                    className={cn(
                      'max-w-[85%] p-3 rounded-lg',
                      isUser
                        ? 'ml-auto rounded-tr-none rounded-bl-none bg-primary text-primary-foreground'
                        : 'mr-auto rounded-tl-none rounded-br-none bg-accent text-accent-foreground border border-accent'
                    )}
                  >
                    {escapeHtml(msg.content)}
                  </div>
                )
              })
            )}
            {chatting && (
              <div className="max-w-[85%] ml-auto p-3 rounded-tl-lg rounded-tr-lg rounded-br-lg bg-accent text-accent-foreground flex flex-col gap-1">
                <span className="h-3 w-3 rounded-full bg-accent-foreground animate-pulse" />
                <span className="h-3 w-1/2 rounded-full bg-accent-foreground animate-pulse" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
          </div>
          <div className="border-t border-border p-4 bg-background">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                askFollowUp(followUp)
              }}
              className="flex gap-2"
            >
              <Input
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="Ask Athenar about this board…"
                disabled={chatting}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={chatting || !followUp.trim()}
                className="px-4"
              >
                {chatting ? <Spinner className="h-4 w-4" /> : 'Ask'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function renderItems(items: TeachingItem[]) {
  return items.map((item) => (
    <div key={item.id} className="p-3 rounded-lg border border-border teaching-muted/50">
      {item.title && (
        <div className="font-semibold text-foreground">{item.title}</div>
      )}
      <div className="mt-1 text-sm text-muted-foreground leading-relaxed">
        {escapeHtml(item.content)}
      </div>
      {item.detail && (
        <div className="mt-1 text-xs text-muted-foreground">
          {escapeHtml(item.detail)}
        </div>
      )}
    </div>
  ))
}

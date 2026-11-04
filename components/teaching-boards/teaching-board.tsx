'use client'

import { useCallback, useRef, useState } from 'react'

import { toast } from 'sonner'

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

interface TeachingItem {
  id: string
  title: string
  content: string
  detail?: string
}

interface TeachingSection {
  type:
    | 'objectives'
    | 'concepts'
    | 'examples'
    | 'summary'
    | 'quiz'
    | 'other'
  title: string
  items: TeachingItem[]
}

interface TeachingBoard {
  id: string
  topic: string
  title: string
  subject: string
  level: string
  sections: TeachingSection[]
}

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

const levelOptions = ['Beginner', 'Intermediate', 'Advanced'] as const
const subjectOptions = [
  'Math',
  'Science',
  'History',
  'English',
  'Programming',
  'Business',
  'Other'
] as const

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function parseMarkdownToSections(markdown: string): TeachingSection[] {
  const rawSections = markdown.split(/(?=^#{2,3}\s)/m).filter(Boolean)
  const sections: TeachingSection[] = []

  for (const raw of rawSections) {
    const headerMatch = raw.match(/^#{2,3}\s+(.+)/m)
    if (!headerMatch) continue

    const title = headerMatch[1].trim()
    const body = raw.replace(/^#{2,3}\s+.+\n?/, '').trim()
    if (!title) continue

    const items: TeachingItem[] = []
    const lines = body.split(/\n+/)
    let current: TeachingItem | null = null

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      const listMatch = trimmed.match(/^[-*•]\s+(.+)/)
      if (listMatch) {
        if (current) items.push(current)
        current = {
          id: `${title}-${items.length}`,
          title: trimmed,
          content: listMatch[1].trim(),
          detail: ''
        }
        continue
      }

      if (current) {
        current.content += `\n${trimmed}`
      } else {
        current = {
          id: `${title}-${items.length}`,
          title: '',
          content: trimmed,
          detail: ''
        }
      }
    }
    if (current) items.push(current)

    const type: TeachingSection['type'] = 'other'
    sections.push({ type, title, items })
  }

  sections.sort(
    (a, b) =>
      SECTION_ORDER.indexOf(a.type) - SECTION_ORDER.indexOf(b.type)
  )
  return sections
}

function generateFallbackBoard(topic: string): TeachingBoard {
  return {
    id: `board-${Date.now()}`,
    topic,
    title: `${topic} — Lesson Board`,
    subject: 'General',
    level: 'Beginner',
    sections: [
      {
        type: 'objectives',
        title: 'Learning Objectives',
        items: [
          {
            id: 'obj-1',
            title: 'Understand the core ideas',
            content: `Grasp the foundational concepts of ${topic}.`
          },
          {
            id: 'obj-2',
            title: 'Apply what you learn',
            content: `Work through a practical example of ${topic}.`
          }
        ]
      },
      {
        type: 'concepts',
        title: 'Key Concepts',
        items: [
          {
            id: 'concept-1',
            title: 'What it is',
            content: `A clear explanation of ${topic} and why it matters.`
          }
        ]
      },
      {
        type: 'examples',
        title: 'Worked Examples',
        items: [
          {
            id: 'example-1',
            title: 'Step by step',
            content: `A worked example applying ${topic} to a real scenario.`
          }
        ]
      },
      {
        type: 'summary',
        title: 'Summary',
        items: [
          {
            id: 'summary-1',
            title: 'Takeaway',
            content: `The most important thing to remember about ${topic}.`
          }
        ]
      },
      {
        type: 'quiz',
        title: 'Quick Quiz',
        items: [
          {
            id: 'quiz-1',
            title: `Check your understanding of ${topic}`,
            content: "Review the board above, then answer this question."
          }
        ]
      }
    ]
  }
}

interface TeachingBoardProps {
  initialTopic?: string
}

export function TeachingBoard({ initialTopic }: TeachingBoardProps) {
  const [board, setBoard] = useState<TeachingBoard | null>(null)
  const [topic, setTopic] = useState(initialTopic ?? '')
  const [level, setLevel] = useState('Beginner')
  const [subject, setSubject] = useState('General')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const generateBoard = useCallback(async (topicValue: string) => {
    if (!topicValue.trim()) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setGenerating(true)
    setError(null)
    setBoard(null)

    try {
      const systemPrompt = `You are Athenar, an AI tutor on BSkola. Create a structured teaching board for the topic "${topicValue}" at ${level} level (${subject}).

Return ONLY markdown with these exact sections, each starting with a "## " header:

## Learning Objectives
- 3-4 bullet objectives

## Key Concepts
- 4-6 concepts, each as: Concept Name — one sentence explanation

## Worked Examples
- 2-3 examples, each as: Example Title — step-by-step walkthrough

## Summary
- 2-3 sentence takeaway

## Quick Quiz
- 2-3 multiple choice questions with the correct answer marked

Keep explanations concise, clear, and beginner-friendly. Do not include any intro or outro text.`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              parts: [{ type: 'text', text: systemPrompt }]
            }
          ],
          chatId: `board-${Date.now()}`
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        throw new Error(
          `Athenar could not generate the board (${response.status}).${errText ? ' ' + errText.slice(0, 200) : ''}`
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

      if (!text || text.length < 20) {
        throw new Error('Athenar returned an empty board. Try again.')
      }

      const sections = parseMarkdownToSections(text)
      if (sections.length === 0) {
        throw new Error("Athenar's response didn't parse into teachable sections. Try again.")
      }

      setBoard({
        id: `board-${Date.now()}`,
        topic: topicValue,
        title: `${topicValue} — Lesson Board`,
        subject,
        level,
        sections
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const message =
        err instanceof Error ? err.message : 'Unknown error generating board.'
      setError(message)
      toast.error('Failed to generate teaching board')
    } finally {
      setGenerating(false)
    }
  }, [level, subject])

  const regenerateBoard = useCallback(() => {
    if (board?.topic) {
      generateBoard(board.topic)
    }
  }, [board, generateBoard])

  const openInChat = useCallback(() => {
    const query = board
      ? `Teach me about "${board.topic}" — ${board.title}`
      : topic
    const url = new URL(window.location.origin + '/search')
    url.searchParams.set('q', query)
    window.location.href = url.toString()
  }, [board, topic])

  const saveToLibrary = useCallback(() => {
    if (!board) return
    toast.success(`"${board.title}" saved to your library.`)
  }, [board])

  const renderSection = (section: TeachingSection) => {
    const isCollapsible =
      section.type === 'concepts' || section.type === 'examples'
    return (
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
          {isCollapsible ? (
            <Collapsible defaultOpen>
              <CollapsibleTrigger asChild>
                <button className="w-full text-left px-0 py-2 text-sm font-medium text-teaching-accent hover:text-teaching-accent/90 underline-offset-4">
                  View {section.items.length} {section.type === 'concepts' ? 'concepts' : 'examples'}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                {section.items.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg border border-border teaching-muted/50">
                    <div className="font-semibold text-foreground">{item.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {escapeHtml(item.content)}
                    </div>
                    {item.detail && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {escapeHtml(item.detail)}
                      </div>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            section.items.map((item) => (
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
          )}
        </CardContent>
      </Card>
    )
  }

  const emptyState = (
    <section className="flex-1 flex flex-col items-center justify-center pt-20 sm:pt-32 px-6">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-teaching-accent/30 bg-teaching-muted/50 px-4 py-1 text-xs font-semibold text-teaching-accent uppercase tracking-wider">
          Athenar · AI Tutor
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Teach anything on{' '}
          <span className="text-teaching-accent">BSkola</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Turn any topic into a structured lesson board: objectives, key concepts,
          worked examples, a summary, and a quick quiz.
        </p>

        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-base">Create a teaching board</CardTitle>
            <CardDescription>
              Enter a topic and Athenar builds the lesson for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="e.g. Photosynthesis, French Revolution, Compound Interest"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as any)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {subjectOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {levelOptions.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => generateBoard(topic)}
              disabled={generating || !topic.trim()}
              className="w-full"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Generating…
                </span>
              ) : (
                'Generate board'
              )}
            </Button>
          </CardFooter>
        </Card>

        {error && (
          <Card className="w-full max-w-md mx-auto border-destructive/50 bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-destructive">
                Setup needed
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-destructive-foreground/80 leading-relaxed">
              {error}
              <br />
              <br />
              Set an AI API key and DATABASE_URL in <code className="font-mono text-xs">.env.local</code>,
              then restart the dev server to generate boards with Athenar.
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                See board layout preview
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </section>
  )

  if (!board) {
    return <main className="flex-1">{emptyState}</main>
  }

  return (
    <main className="flex-1 min-h-0">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setBoard(null)}>
              ← New board
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-teaching-accent border-teaching-accent/40">
                {subject}
              </Badge>
              <Badge variant="secondary">{level}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={regenerateBoard}
              disabled={generating}
            >
              {generating ? <Spinner className="h-4 w-4" /> : 'Regenerate'}
            </Button>
            <Button onClick={openInChat}>Open in chat</Button>
            <Button onClick={saveToLibrary}>Save to library</Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-2">
          <h1 className="text-2xl font-bold tracking-tight">{board.title}</h1>
          <p className="text-sm text-muted-foreground">
            Topic: {board.topic} · {subject} · {level} level
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {board.sections.map((section) => renderSection(section))}
        </div>

        <Separator className="my-4" />

        <Card className="bg-teaching-muted/40 border-teaching-accent/30">
          <CardHeader>
            <CardTitle className="text-teaching-accent font-bold flex items-center gap-2">
              <span aria-hidden="true">★</span> Built by Athenar on BSkola
            </CardTitle>
            <CardDescription>
              Save this board to your library and revisit it anytime. Open it in
              chat to ask follow-up questions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  )
}

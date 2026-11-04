'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'

import { BoardLibrary } from '@/components/teaching-boards/board-library'
import { BoardViewer } from '@/components/teaching-boards/board-viewer'
import { TeachingBoard } from '@/components/teaching-boards/teaching-board'

export default function TeachPageClient() {
  const [tab, setTab] = useState<'create' | 'library'>('create')
  const [board, setBoard] = useState<TeachingBoard | null>(null)

  if (board) {
    return (
      <BoardViewer
        board={board}
        onRegenerate={() => setBoard(null)}
        onClose={() => setBoard(null)}
      />
    )
  }

  return (
    <div className="flex flex-col min-h-svh">
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-background pt-20 pb-32 sm:pt-32 sm:pb-40 px-6 sm:px-8 lg:px-12">
          <div className="relative z-10 mx-auto max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teaching-accent/30 bg-teaching-muted/50 px-4 py-1 text-xs font-semibold text-teaching-accent uppercase tracking-wider mb-6">
              Athenar · AI Tutor
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Teach anything on{' '}
              <span className="text-teaching-accent">BSkola</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:mt-7 sm:text-xl lg:mt-8 lg:text-2xl">
              Turn any topic into a structured lesson board: objectives, key
              concepts, worked examples, a summary, and a quick quiz. Save your
              boards and revisit them anytime.
            </p>

            <div className="mt-10 flex gap-3">
              <Button
                onClick={() => setTab('create')}
                className={cn(
                  'px-6',
                  tab === 'create'
                    ? 'bg-teaching-accent text-teaching-accent-foreground'
                    : 'border border-input bg-background hover:bg-accent'
                )}
              >
                Create board
              </Button>
              <Button
                onClick={() => setTab('library')}
                variant="outline"
                className="px-6"
              >
                My library
              </Button>
            </div>
          </div>
        </section>

        {tab === 'create' ? (
          <TeachingBoard onBoardCreated={setBoard} />
        ) : (
          <BoardLibrary onSelectBoard={setBoard} />
        )}
      </main>
    </div>
  )
}

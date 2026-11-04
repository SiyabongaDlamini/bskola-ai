'use client'

import { useState } from 'react'

import { BoardLibrary } from '@/components/teaching-boards/board-library'
import { BoardViewer } from '@/components/teaching-boards/board-viewer'
import { TeachingBoard } from '@/components/teaching-boards/teaching-board'

export default function TeachLibraryClient() {
  const [board, setBoard] = useState<TeachingBoard | null>(null)

  if (board) {
    return (
      <BoardViewer
        board={board}
        onRegenerate={() => {
          // no-op in library view; regenerate happens in creator
        }}
        onClose={() => setBoard(null)}
      />
    )
  }

  return <BoardLibrary onSelectBoard={setBoard} />
}

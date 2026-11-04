import { TeachingBoard } from '@/components/teaching-boards/teaching-board'

export const metadata = {
  title: 'Teach | BSkola',
  description:
    'Turn any topic into a structured lesson board with Athenar, your AI tutor. Objectives, key concepts, worked examples, summary, and a quick quiz.'
}

export default function TeachPage() {
  return <TeachingBoard />
}

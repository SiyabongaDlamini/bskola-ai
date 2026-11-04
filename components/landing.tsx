'use client'

import { useState } from 'react'
import Link from 'next/link'

import type { ModelSelectorData } from '@/lib/types/model-selector'

import { Button } from '@/components/ui/button'

import { Chat } from '@/components/chat'

interface LandingPageProps {
  isCloudDeployment?: boolean
  libraryAvailable?: boolean
  modelSelectorData?: ModelSelectorData
  isGuest?: boolean
}

export function LandingPage({
  isCloudDeployment,
  libraryAvailable,
  modelSelectorData,
  isGuest = false
}: LandingPageProps) {
  const [showSearch, setShowSearch] = useState(false)

  return (
    <div className="flex flex-col min-h-svh">
      <main className="flex-1">
        {!showSearch ? (
          <section className="relative isolate overflow-hidden bg-background pt-20 pb-32 sm:pt-32 sm:pb-40">
            <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
              <div className="relative z-10 mx-auto max-w-2xl">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  Learn anything with <span className="text-primary">Athenar</span>, your AI tutor
                </h1>
                <p className="mt-6 text-lg text-muted-foreground sm:mt-7 sm:text-xl lg:mt-8 lg:text-2xl">
                  Ask a question and get a grounded, cited answer. Save useful results to your
                  library and build your knowledge one search at a time.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:justify-center">
                  <Link href="/auth/login">
                    <Button>Sign in</Button>
                  </Link>
                  <Button onClick={() => setShowSearch(true)}>Start searching</Button>
                </div>
                <div className="mt-16 flex flex-col gap-6 sm:mt-20">
                  <h2 className="text-lg font-semibold tracking-tight">How it works</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-6">
                    <div>
                      <h3 className="font-semibold">Ask</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Type any question in plain language.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Get answers</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Athenar searches and replies with sources you can verify.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Build knowledge</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Save results to your library and revisit them later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="relative isolate overflow-hidden bg-background">
            <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-12">
              <div className="flex items-center gap-2 mb-6">
                <Button variant="outline" size="sm" onClick={() => setShowSearch(false)}>
                  ← Back
                </Button>
              </div>
              <Chat
                isGuest={isGuest}
                isCloudDeployment={isCloudDeployment}
                libraryAvailable={libraryAvailable ?? false}
                modelSelectorData={modelSelectorData}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { isAnonymousMode } from '@/lib/auth/provider'
import { getModelSelectorData } from '@/lib/model-selector/get-model-selector-data'

import { Chat } from '@/components/chat'
import { LandingPage } from '@/components/landing'

export default async function Page() {
  const userId = await getCurrentUserId()
  const isCloudDeployment = process.env.MORPHIC_CLOUD_DEPLOYMENT === 'true'
  const libraryAvailable = !isAnonymousMode()
  const modelSelectorData = await getModelSelectorData()

  const common = {
    isCloudDeployment,
    libraryAvailable,
    modelSelectorData
  }

  if (userId) {
    return <Chat isGuest={false} {...common} />
  }

  return <LandingPage {...common} />
}

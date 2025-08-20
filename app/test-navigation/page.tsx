"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function TestNavigationPage() {
  const router = useRouter()

  const testNavigation = (path: string) => {

    try {
      router.push(path)
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Navigation Test</h1>
      
      <div className="space-y-4">
        <Button onClick={() => testNavigation('/')}>
          Go to Home
        </Button>
        
        <Button onClick={() => testNavigation('/games/7up7down')}>
          Go to 7Up 7Down
        </Button>
        
        <Button onClick={() => testNavigation('/games/spinwin')}>
          Go to Spin & Win
        </Button>
        
        <Button onClick={() => testNavigation('/games/lottery')}>
          Go to Lottery
        </Button>
        
        <Button onClick={() => testNavigation('/api/debug/lottery-test')}>
          Test Lottery API
        </Button>
      </div>
      
      <div className="mt-8 p-4 bg-gray-800 rounded">
        <h2 className="text-xl font-bold mb-4">Debug Info</h2>
        <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
        <p>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR'}</p>
      </div>
    </div>
  )
}


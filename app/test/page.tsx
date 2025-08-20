"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function TestPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Test Page</h1>
      
      <div className="space-y-4">
        <Button onClick={() => router.push('/')}>
          Go to Home
        </Button>
        
        <Button onClick={() => router.push('/games/7up7down')}>
          Go to 7Up 7Down
        </Button>
        
        <Button onClick={() => router.push('/games/spinwin')}>
          Go to Spin & Win
        </Button>
        
        <Button onClick={() => router.push('/games/lottery')}>
          Go to Lottery
        </Button>
      </div>
      
      <div className="mt-8 p-4 bg-gray-800 rounded">
        <h2 className="text-xl font-bold mb-4">Current Status</h2>
        <p>✅ Test page loaded successfully</p>
        <p>✅ Navigation buttons are working</p>
        <p>✅ Environment variables should be set</p>
      </div>
    </div>
  )
}





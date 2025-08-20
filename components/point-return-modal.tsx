"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { ArrowUpRight, Coins, User } from "lucide-react"

interface PointReturnModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface MasterInfo {
  id: string
  username: string
  role: string
}

export function PointReturnModal({ isOpen, onClose, onSuccess }: PointReturnModalProps) {
  const { user, updatePoints } = useAuth()
  const [masterInfo, setMasterInfo] = useState<MasterInfo | null>(null)
  const [returnAmount, setReturnAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMaster, setIsLoadingMaster] = useState(true)

  // Fetch master information
  useEffect(() => {
    if (isOpen && user) {
      fetchMasterInfo()
    }
  }, [isOpen, user])

  const fetchMasterInfo = async () => {
    setIsLoadingMaster(true)
    try {
      const response = await fetch('/api/user/master-info', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMasterInfo(data.master)
      } else {
        toast.error('Could not find your master')
      }
    } catch (error) {
      toast.error('Failed to load master information')
    } finally {
      setIsLoadingMaster(false)
    }
  }

  const handleReturnPoints = async () => {
    if (!user || !masterInfo) return

    const amount = parseInt(returnAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount > user.points) {
      toast.error('You don\'t have enough points')
      return
    }

    if (amount < 100) {
      toast.error('Minimum return amount is 100 points')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/return-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify({
          amount,
          masterId: masterInfo.id
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(`Successfully returned ${amount.toLocaleString()} points to ${masterInfo.username}`)
        updatePoints(user.points - amount)
        setReturnAmount("")
        onSuccess?.()
        onClose()
      } else {
        toast.error(result.error || 'Failed to return points')
      }
    } catch (error) {
      toast.error('Failed to return points')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickReturn = (percentage: number) => {
    if (!user) return
    const amount = Math.floor(user.points * percentage)
    setReturnAmount(amount.toString())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white/95 dark:bg-gray-900/95 border-white/20 mobile-modal">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-lg">
            <Coins className="w-5 h-5 text-yellow-500" />
            Return Points to Master
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Balance */}
          <div className="text-center p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {user?.points.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Your Current Points</div>
          </div>

          {/* Master Information */}
          {isLoadingMaster ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading master info...</p>
            </div>
          ) : masterInfo ? (
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <User className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <div className="font-semibold text-blue-600 dark:text-blue-400">
                  {masterInfo.username}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {masterInfo.role.replace('_', ' ')}
                </div>
              </div>
              <Badge className="bg-blue-500 text-white text-xs">
                Your Master
              </Badge>
            </div>
          ) : (
            <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-red-600 dark:text-red-400 text-sm">
                No master found. Contact support.
              </p>
            </div>
          )}

          {/* Quick Return Buttons */}
          {user && user.points > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Return</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReturn(0.25)}
                  className="text-xs mobile-button mobile-touch-target"
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReturn(0.5)}
                  className="text-xs mobile-button mobile-touch-target"
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReturn(0.75)}
                  className="text-xs mobile-button mobile-touch-target"
                >
                  75%
                </Button>
              </div>
            </div>
          )}

          {/* Return Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="returnAmount" className="text-sm font-medium">
              Amount to Return
            </Label>
            <Input
              id="returnAmount"
              type="number"
              value={returnAmount}
              onChange={(e) => setReturnAmount(e.target.value)}
              placeholder="Enter amount (min: 100)"
              className="text-center text-lg font-mono mobile-input"
              min="100"
              max={user?.points || 0}
            />
            <div className="text-xs text-gray-500 text-center">
              Minimum: 100 points • Maximum: {user?.points.toLocaleString() || 0} points
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 mobile-button mobile-touch-target"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReturnPoints}
              disabled={isLoading || !masterInfo || !returnAmount || parseInt(returnAmount) < 100}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white mobile-button mobile-touch-target"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Return Points
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>• Points will be transferred to your master's account</p>
            <p>• This action cannot be undone</p>
            <p>• Transaction will be recorded in your history</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




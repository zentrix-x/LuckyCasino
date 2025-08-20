"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ReferralSummary {
  code: string
  totalReferrals: number
  totalRewards: number
}

export function ReferralSystem() {
  const [summary, setSummary] = useState<ReferralSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    const fetchSummary = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("jwt") : null
        if (!token) {
          setLoading(false)
          return
        }
        const res = await fetch("/api/referrals", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!active) return
        if (res.ok) {
          const data = await res.json()
          console.log("Referral data:", data) // Debug log
          setSummary({
            code: data?.referralCode ?? data?.code ?? "USER123",
            totalReferrals: data?.stats?.totalReferrals ?? data?.totalReferrals ?? 0,
            totalRewards: data?.stats?.totalEarned ?? data?.totalRewards ?? 0,
          })
        } else {
          console.log("Referral API error:", res.status, res.statusText)
        }
      } catch (error) {
        console.error("Referral fetch error:", error)
        // Set fallback data for testing
        setSummary({
          code: "USER123",
          totalReferrals: 0,
          totalRewards: 0,
        })
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchSummary()
    return () => {
      active = false
    }
  }, [])

  const copyCode = async () => {
    if (!summary?.code) return
    try {
      await navigator.clipboard.writeText(summary.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <Card className="bg-white/10 dark:bg-gray-800/50 border-white/20 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <span className="text-lg">👥</span>
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : !summary ? (
          <div className="text-muted-foreground text-sm">Sign in to view your referral stats.</div>
        ) : (
          <div className="space-y-4">
            {/* Referral Code Section */}
            <div className="space-y-2">
              <span className="text-sm text-white font-medium">Your Code</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-8 bg-orange-500/20 border border-orange-500/30 rounded px-3 flex items-center">
                  <span className="text-orange-300 font-mono text-sm font-semibold">{summary.code || "USER123"}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={copyCode}
                  className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-300">{summary.totalReferrals}</div>
                <div className="text-xs text-white font-medium">Total Referrals</div>
              </div>
              <div className="text-center p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-300">{summary.totalRewards.toLocaleString()}</div>
                <div className="text-xs text-white font-medium">Total Rewards</div>
              </div>
            </div>

            {/* Referral Benefits */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎁</span>
                <span className="text-sm font-medium text-white">Referral Benefits</span>
              </div>
              <div className="text-xs text-white/90 space-y-1">
                <div>• 1 Referral: +100 Points</div>
                <div>• 5 Referrals: +500 Points + VIP Status</div>
                <div>• 10 Referrals: +1000 Points + Exclusive Rewards</div>
              </div>
            </div>

            {/* Debug Info - Remove this later */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs">
              <div className="text-blue-300 font-medium mb-2">Debug Info:</div>
              <div className="text-white/90">Code: "{summary.code}"</div>
              <div className="text-white/90">Referrals: {summary.totalReferrals}</div>
              <div className="text-white/90">Rewards: {summary.totalRewards}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
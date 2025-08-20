"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSoundEffects } from "./sound-manager"

interface EnhancedGameCardProps {
  title: string
  description: string
  image: string
  payout: string
  players: string
  comingSoon?: boolean
  onPlay?: () => void
}

export function EnhancedGameCard({
  title,
  description,
  image,
  payout,
  players,
  comingSoon = false,
  onPlay,
}: EnhancedGameCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { playHover, playClick } = useSoundEffects()

  return (
    <Card
      className={`
        casino-card-gradient border-primary/20 transition-all duration-500 cursor-pointer
        hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/20
        ${isHovered ? "transform scale-105 casino-glow" : ""}
        ${comingSoon ? "opacity-60" : ""}
      `}
      onMouseEnter={() => {
        setIsHovered(true)
        playHover()
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="relative overflow-hidden">
        <div className="relative">
          <img
            src={image || "/placeholder.svg"}
            alt={title}
            className="w-full h-48 object-cover rounded-lg mb-4 transition-transform duration-300 hover:scale-110"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge variant="secondary" className="bg-primary text-primary-foreground font-semibold">
              {payout}
            </Badge>
            <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
              {players}
            </Badge>
          </div>
          {comingSoon && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <Badge variant="destructive" className="text-lg px-4 py-2">
                Coming Soon
              </Badge>
            </div>
          )}
        </div>
        <CardTitle className="text-2xl font-serif text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">{description}</p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-medium">Live Now</span>
          </div>
          <span className="text-muted-foreground">Max Payout: {payout}</span>
        </div>

        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 casino-glow"
          disabled={comingSoon}
          onClick={() => {
            playClick()
            onPlay?.()
          }}
        >
          {comingSoon ? "Coming Soon" : "🎮 Play Now"}
        </Button>
      </CardContent>
    </Card>
  )
}

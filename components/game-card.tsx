import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface GameCardProps {
  title: string
  description: string
  image: string
  comingSoon?: boolean
  payout?: string
  players?: string
}

export function GameCard({ title, description, image, comingSoon = false, payout, players }: GameCardProps) {
  return (
    <Card className="casino-card-gradient border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:scale-105 group overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden">
          <img
            src={image || "/placeholder.svg"}
            alt={title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            {comingSoon && <Badge className="bg-secondary text-secondary-foreground font-semibold">Coming Soon</Badge>}
            {players && (
              <Badge variant="outline" className="bg-primary/10 border-primary text-primary font-semibold">
                🔴 {players}
              </Badge>
            )}
          </div>
          {payout && (
            <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground font-bold text-sm">
              {payout}
            </Badge>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <CardTitle className="text-foreground font-serif text-xl mb-3 group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground mb-4 leading-relaxed">{description}</CardDescription>
        {!comingSoon && (
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold casino-glow"
            size="sm"
          >
            🎮 Play Now
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

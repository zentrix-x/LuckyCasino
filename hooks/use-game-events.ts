"use client"

import { useEffect, useRef } from "react"

export type RoundStartEvent = {
	roundId: string
	start: string
	end: string
}

export type ResultPublishedEvent = {
	roundId: string
	winningOutcome: string | null
	totals: Record<string, number>
	totalBet?: number
	totalPayout?: number
	houseProfit?: number
}

export function useGameEvents(
	gameType: string,
	onRoundStart?: (e: RoundStartEvent) => void,
	onResultPublished?: (e: ResultPublishedEvent) => void,
) {
	const esRef = useRef<EventSource | null>(null)

	useEffect(() => {
		const url = `/api/events/${gameType}`
		const es = new EventSource(url)
		esRef.current = es

		es.addEventListener("round_start", (ev: MessageEvent) => {
			try {
				const data = JSON.parse(ev.data)
				onRoundStart?.(data)
			} catch {}
		})

		es.addEventListener("result_published", (ev: MessageEvent) => {
			try {
				const data = JSON.parse(ev.data)
				onResultPublished?.(data)
			} catch {}
		})

		return () => {
			es.close()
			esRef.current = null
		}
	}, [gameType])
}





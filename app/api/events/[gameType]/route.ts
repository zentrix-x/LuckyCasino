export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { subscribe } from '@/lib/events'

export async function GET(_req: NextRequest, context: { params: Promise<{ gameType: string }> }) {
	const { gameType } = await context.params
	const stream = subscribe(gameType)
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			'Connection': 'keep-alive',
		},
	})
}


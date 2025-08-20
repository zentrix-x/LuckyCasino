type Subscriber = {
	gameType: string
	controller: ReadableStreamDefaultController
}

const g = global as any

if (!g.__eventSubscribers) {
	g.__eventSubscribers = new Set<Subscriber>()
}

export function subscribe(gameType: string) {
	const stream = new ReadableStream({
		start(controller) {
			const sub: Subscriber = { gameType, controller }
			g.__eventSubscribers.add(sub)
			// send initial comment to keep connection alive
			controller.enqueue(new TextEncoder().encode(`: connected\n\n`))
		},
		cancel() {
			// cleanup happens in unsubscribe via return value of handler
		},
	})
	return stream
}

export function publish(gameType: string, event: string, data: any) {
	const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`
	const bytes = new TextEncoder().encode(payload)
	for (const sub of g.__eventSubscribers as Set<Subscriber>) {
		if (sub.gameType === gameType) {
			try { sub.controller.enqueue(bytes) } catch {}
		}
	}
}





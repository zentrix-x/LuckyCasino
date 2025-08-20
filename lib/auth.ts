import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export interface DecodedToken {
  userId: string
  role?: string
  username?: string
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    // Normalize different payload shapes to a common one
    const userId = decoded?.userId || decoded?.id || decoded?._id
    if (!userId) return null
    return {
      userId: typeof userId === 'string' ? userId : String(userId),
      role: decoded?.role,
      username: decoded?.username,
    }
  } catch {
    return null
  }
}
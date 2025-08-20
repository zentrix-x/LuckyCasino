const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

console.log('Testing JWT functionality...')
console.log('JWT_SECRET:', JWT_SECRET)

// Test creating a token
const testPayload = { id: 'test-user-id', role: 'user' }
const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '7d' })
console.log('Created token:', token)

// Test verifying the token
try {
  const decoded = jwt.verify(token, JWT_SECRET)
  console.log('Token verification successful:', decoded)
} catch (error) {
  console.error('Token verification failed:', error.message)
}

// Test with the old secret that was causing issues
const oldSecret = 'your-secret-key'
try {
  const decodedWithOldSecret = jwt.verify(token, oldSecret)
  console.log('Token verification with old secret successful:', decodedWithOldSecret)
} catch (error) {
  console.log('Token verification with old secret failed (expected):', error.message)
}

console.log('JWT test completed.')



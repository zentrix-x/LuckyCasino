# Development Setup Script for Casino Site
# This script sets up the development environment

Write-Host "🚀 Setting up Casino Site Development Environment..." -ForegroundColor Green

# Check if MongoDB is running
Write-Host "📊 Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoResponse = Invoke-WebRequest -Uri "http://localhost:27017" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "✅ MongoDB is running" -ForegroundColor Green
} catch {
    Write-Host "❌ MongoDB is not running. Please start MongoDB first." -ForegroundColor Red
    Write-Host "   You can download MongoDB Community Server from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
}

# Check if Redis is running
Write-Host "🔴 Checking Redis..." -ForegroundColor Yellow
try {
    $redisResponse = Invoke-WebRequest -Uri "http://localhost:6379" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "✅ Redis is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Redis is not running. The app will use fallback cache." -ForegroundColor Yellow
    Write-Host "   To use Redis, you can:" -ForegroundColor Yellow
    Write-Host "   1. Install Redis for Windows: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Yellow
    Write-Host "   2. Use Docker: docker run -d --name redis-dev -p 6379:6379 redis:7-alpine" -ForegroundColor Yellow
    Write-Host "   3. Use Redis Cloud (free tier): https://redis.com/try-free/" -ForegroundColor Yellow
}

# Check if Node.js is installed
Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
Write-Host "📦 Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm is installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Create development environment file
Write-Host "📝 Creating development environment..." -ForegroundColor Yellow
$envContent = @"
# Development Environment Variables
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/casino

# Redis Configuration (optional for development)
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production

# Performance Configuration
MAX_CONCURRENT_USERS=1000
MAX_BETS_PER_SECOND=100
MAX_API_REQUESTS_PER_SECOND=1000
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ Development environment file created" -ForegroundColor Green

# Start the development server
Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host "   The app will be available at: http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Yellow

npm run dev




# Development Start Script for Casino Site
# This script starts the development server with proper Redis handling

Write-Host "🚀 Starting Casino Site Development Server..." -ForegroundColor Green

Write-Host "📦 Using high-performance in-memory cache" -ForegroundColor Green

# Check if MongoDB is running
Write-Host "📊 Checking MongoDB..." -ForegroundColor Yellow
try {
    $mongoResponse = Invoke-WebRequest -Uri "http://localhost:27017" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ MongoDB is running" -ForegroundColor Green
} catch {
    Write-Host "❌ MongoDB is not running. Please start MongoDB first." -ForegroundColor Red
    Write-Host "   You can download MongoDB Community Server from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    exit 1
}

# Start the development server
Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host "   The app will be available at: http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""


npm run dev

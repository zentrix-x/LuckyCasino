#!/bin/bash

echo "🎰 Lucky Casino - Deployment Script"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🚀 Ready to deploy!"
echo ""
echo "Choose your deployment option:"
echo "1. Deploy to Vercel (Recommended)"
echo "2. Deploy to Netlify"
echo "3. Deploy to Railway"
echo "4. Local testing only"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🚀 Deploying to Vercel..."
        vercel
        ;;
    2)
        echo "🚀 Deploying to Netlify..."
        echo "Please visit https://app.netlify.com and drag the .next folder"
        ;;
    3)
        echo "🚀 Deploying to Railway..."
        echo "Please visit https://railway.app and connect your repository"
        ;;
    4)
        echo "🏠 Starting local development server..."
        npm run dev
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your environment variables"
echo "2. Configure your database"
echo "3. Share the URL with your client"
echo "4. Use the test accounts from DEPLOYMENT_GUIDE.md"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md"





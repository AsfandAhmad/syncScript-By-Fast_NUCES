#!/bin/bash

# SyncScript Environment Setup Script
# This script validates and sets up all required environment variables

echo "🔧 SyncScript Environment Setup"
echo "================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm $(npm --version)"

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
echo "✅ Frontend dependencies installed"

# Check environment variables
echo ""
echo "🔐 Checking environment variables..."

if [ ! -f .env.local ]; then
    echo "❌ .env.local not found in frontend directory"
    echo "Creating .env.local from template..."
    cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ntzetlkjlmpyqdezpuau.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Service Role Key (server-side only, never expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50emV0bGtqbG1weXFkZXpwdWF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk5OTU2OCwiZXhwIjoyMDg2NTc1NTY4fQ.3hbSL554QR-WzSVWPT-uhEBnFvfcMAAKaqtAk5zNjs0
EOF
    echo "⚠️  .env.local created with placeholder values"
    echo "   Please update NEXT_PUBLIC_SUPABASE_ANON_KEY with your actual anon key"
else
    echo "✅ .env.local found"
fi

# Validate required environment variables
if grep -q "your-supabase-anon-key" .env.local; then
    echo "⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured"
    echo "   Please update it in frontend/.env.local with your actual Supabase anon key"
else
    echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is configured"
fi

if grep -q "your-project-id" .env.local; then
    echo "⚠️  NEXT_PUBLIC_SUPABASE_URL contains placeholder"
else
    echo "✅ NEXT_PUBLIC_SUPABASE_URL is configured"
fi

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Update frontend/.env.local with your actual Supabase anon key"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000 in your browser"

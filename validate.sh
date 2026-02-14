#!/bin/bash
echo "🔍 SyncScript Validation Report"
echo "================================"
echo ""

echo "📁 Frontend Structure:"
echo "  Pages:"
find frontend/app -name "page.tsx" | wc -l | xargs echo "    - Found"
echo "  Services:"
ls frontend/lib/services/*.ts | wc -l | xargs echo "    - Found"
echo "  Components:"
ls frontend/components/*.tsx | wc -l | xargs echo "    - Found"
echo ""

echo "🗄️  Supabase Structure:"
echo "  Migrations:"
ls supabase/migrations/*.sql | wc -l | xargs echo "    - Found"
echo "  Edge Functions:"
ls -d supabase/functions/*/ | wc -l | xargs echo "    - Found"
echo ""

echo "📦 Dependencies:"
if [ -d "frontend/node_modules" ]; then
  echo "  ✅ node_modules exists"
  echo "  ✅ Packages installed: $(ls frontend/node_modules | wc -l)"
else
  echo "  ❌ node_modules missing - run: npm install --legacy-peer-deps"
fi
echo ""

echo "🔐 Environment Variables:"
if [ -f "frontend/.env.local" ]; then
  echo "  ✅ .env.local exists"
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" frontend/.env.local; then
    echo "  ✅ NEXT_PUBLIC_SUPABASE_URL configured"
  fi
  if grep -q "SUPABASE_SERVICE_ROLE_KEY" frontend/.env.local; then
    echo "  ✅ SUPABASE_SERVICE_ROLE_KEY configured"
  fi
else
  echo "  ❌ .env.local missing"
fi
echo ""

echo "✅ Validation Complete!"

#!/bin/bash

# ============================================
# SIMPLE TEST SCRIPT - Test chatbot nhanh
# Usage: ./test.sh
# ============================================

# COLORS
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# CONFIG - THAY ĐỔI THEO PROJECT CỦA BẠN
FUNCTION_URL="https://ftqwpsftzbagidoudwoq.supabase.co/functions/v1/chatbot-process"
ANON_KEY="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cXdwc2Z0emJhZ2lkb3Vkd29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjUxOTAsImV4cCI6MjA3NTg0MTE5MH0.Lj0GpMHhxolPsjJJpleXwknaFs5eP0tdSfySZRcHeSQ"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🤖 CHATBOT IMAGE TEST SCRIPT       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Simple greeting
echo -e "${YELLOW}Test 1: Simple Greeting${NC}"
echo "Message: 'Xin chào'"
echo "---"

response1=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{
    "platform": "web",
    "session_id": "test-1",
    "message_text": "Xin chào",
    "timestamp": "2025-01-01T00:00:00Z"
  }')

if echo "$response1" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Success${NC}"
  echo "Response: $(echo "$response1" | jq -r '.response' | head -c 80)..."
  echo "Type: $(echo "$response1" | jq -r '.recommendation_type')"
else
  echo -e "${RED}❌ Failed${NC}"
  echo "$response1"
fi

echo ""
echo "---"
echo ""

# Test 2: Product request
echo -e "${YELLOW}Test 2: Product Request (SHOWCASE)${NC}"
echo "Message: 'Cho tôi xem áo sơ mi'"
echo "---"

response2=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{
    "platform": "web",
    "session_id": "test-2",
    "message_text": "Cho tôi xem áo sơ mi",
    "timestamp": "2025-01-01T00:00:00Z"
  }')

if echo "$response2" | jq -e '.success' > /dev/null 2>&1; then
  rec_type=$(echo "$response2" | jq -r '.recommendation_type')
  product_count=$(echo "$response2" | jq '.products | length')
  
  echo -e "${GREEN}✅ Success${NC}"
  echo "Response: $(echo "$response2" | jq -r '.response' | head -c 80)..."
  echo "Type: $rec_type"
  echo "Products: $product_count"
  
  if [ "$rec_type" = "showcase" ]; then
    echo -e "${GREEN}✅ Correctly detected as SHOWCASE${NC}"
  else
    echo -e "${RED}❌ Should be SHOWCASE, got: $rec_type${NC}"
  fi
  
  if [ "$product_count" -gt 0 ]; then
    echo -e "${GREEN}✅ Products returned${NC}"
    
    # Show first product
    echo ""
    echo "First product:"
    echo "$response2" | jq '.products[0] | {name, price, images: (.images | length)}'
    
    # Check if has images
    image_count=$(echo "$response2" | jq '.products[0].images | length')
    if [ "$image_count" -gt 0 ]; then
      echo -e "${GREEN}✅ Product has $image_count images${NC}"
      echo "First image URL:"
      echo "$response2" | jq -r '.products[0].images[0].image_url'
    else
      echo -e "${RED}❌ Product has NO images${NC}"
    fi
  else
    echo -e "${RED}❌ NO products returned${NC}"
    echo ""
    echo "💡 POSSIBLE ISSUES:"
    echo "   1. Database has no products with images"
    echo "   2. LLM not returning product IDs"
    echo "   3. Product IDs don't match database"
    echo ""
    echo "Run this SQL to check:"
    echo "   SELECT p.id, p.name, COUNT(pi.id) as images"
    echo "   FROM products p"
    echo "   LEFT JOIN product_images pi ON p.id = pi.product_id"
    echo "   GROUP BY p.id, p.name;"
  fi
else
  echo -e "${RED}❌ Failed${NC}"
  echo "$response2"
fi

echo ""
echo "---"
echo ""

# Test 3: General question (should be NONE)
echo -e "${YELLOW}Test 3: General Question (NONE)${NC}"
echo "Message: 'Shop mở cửa mấy giờ?'"
echo "---"

response3=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{
    "platform": "web",
    "session_id": "test-3",
    "message_text": "Shop mở cửa mấy giờ?",
    "timestamp": "2025-01-01T00:00:00Z"
  }')

if echo "$response3" | jq -e '.success' > /dev/null 2>&1; then
  rec_type=$(echo "$response3" | jq -r '.recommendation_type')
  
  echo -e "${GREEN}✅ Success${NC}"
  echo "Response: $(echo "$response3" | jq -r '.response' | head -c 80)..."
  echo "Type: $rec_type"
  
  if [ "$rec_type" = "none" ]; then
    echo -e "${GREEN}✅ Correctly detected as NONE${NC}"
  else
    echo -e "${YELLOW}⚠️  Expected NONE, got: $rec_type${NC}"
  fi
else
  echo -e "${RED}❌ Failed${NC}"
  echo "$response3"
fi

echo ""
echo "---"
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   📊 SUMMARY                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Count successes
success_count=0
if echo "$response1" | jq -e '.success' > /dev/null 2>&1; then ((success_count++)); fi
if echo "$response2" | jq -e '.success' > /dev/null 2>&1; then ((success_count++)); fi
if echo "$response3" | jq -e '.success' > /dev/null 2>&1; then ((success_count++)); fi

echo "Tests passed: $success_count/3"
echo ""

if [ $success_count -eq 3 ]; then
  # Check if showcase test has products
  product_count=$(echo "$response2" | jq '.products | length')
  if [ "$product_count" -gt 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System is working.${NC}"
  else
    echo -e "${YELLOW}⚠️  Tests passed but no products returned${NC}"
    echo "   Check database and LLM response"
  fi
else
  echo -e "${RED}❌ Some tests failed. Check errors above.${NC}"
fi

echo ""
echo "📝 Next steps:"
echo "   1. Check logs: supabase functions logs chatbot-process"
echo "   2. Verify database has products with images"
echo "   3. Test on frontend"
echo ""chmod +x test.sh
./test.sh
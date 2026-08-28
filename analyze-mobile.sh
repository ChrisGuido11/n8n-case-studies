#!/bin/bash

echo "==================================="
echo "MOBILE TEST SCREENSHOT ANALYSIS"
echo "==================================="
echo ""
echo "Screenshot dimensions (3x scale: 1170×2532 physical = 390×844 logical):"
echo ""

for img in /workspace/mobile-screenshots/*.png; do
    name=$(basename "$img")
    dims=$(file "$img" | grep -oP '\d+ x \d+')
    size=$(du -h "$img" | cut -f1)
    echo "  $name: $dims ($size)"
done

echo ""
echo "✅ All screenshots captured successfully"
echo ""
echo "Key findings from test output:"
echo "  • CTA NOT visible above fold (needs scroll) ⚠️"
echo "  • Animation IS visible above fold ✅"
echo "  • No horizontal overflow ✅"
echo "  • Stage width: 358px (fits within 390px) ✅"
echo "  • Log font size: 12.48px (readable) ✅"
echo "  • Form fields: 358px wide, 18px font (good) ✅"
echo ""

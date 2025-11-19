#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  PRE-UPLOAD VALIDATION CHECK - Stalwart Mail Server          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

PACKAGE="/Users/user/Documents/Getlood/Olares/stalwart.tar.gz"
CHART_DIR="/Users/user/Documents/Getlood/Olares/stalwart"

# Check 1: Package exists
echo "1️⃣  Checking package exists..."
if [ -f "$PACKAGE" ]; then
    echo "   ✅ Package found: $PACKAGE"
    ls -lh "$PACKAGE"
else
    echo "   ❌ Package not found!"
    exit 1
fi
echo ""

# Check 2: Chart directory exists
echo "2️⃣  Checking chart directory..."
if [ -d "$CHART_DIR" ]; then
    echo "   ✅ Chart directory found: $CHART_DIR"
else
    echo "   ❌ Chart directory not found!"
    exit 1
fi
echo ""

# Check 3: Critical files
echo "3️⃣  Checking critical files in package..."
for file in "Chart.yaml" "OlaresManifest.yaml" "values.yaml" "templates/deployment.yaml" "templates/service.yaml"; do
    if tar -tzf "$PACKAGE" | grep -q "stalwart/$file"; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file MISSING!"
        exit 1
    fi
done
echo ""

# Check 4: metadata.appid
echo "4️⃣  Checking metadata.appid..."
if grep -q "appid: e51f5a8f" "$CHART_DIR/OlaresManifest.yaml"; then
    echo "   ✅ appid: e51f5a8f"
else
    echo "   ❌ appid missing or incorrect!"
    exit 1
fi
echo ""

# Check 5: Name consistency
echo "5️⃣  Checking name consistency..."
CHART_NAME=$(grep "^name:" "$CHART_DIR/Chart.yaml" | awk '{print $2}')
MANIFEST_NAME=$(grep "^  name:" "$CHART_DIR/OlaresManifest.yaml" | head -1 | awk '{print $2}')
FOLDER_NAME=$(basename "$CHART_DIR")

echo "   Chart.yaml name:        $CHART_NAME"
echo "   OlaresManifest.yaml:    $MANIFEST_NAME"
echo "   Folder name:            $FOLDER_NAME"

if [ "$CHART_NAME" = "$MANIFEST_NAME" ] && [ "$CHART_NAME" = "$FOLDER_NAME" ]; then
    echo "   ✅ All names match: $CHART_NAME"
else
    echo "   ❌ Names don't match!"
    exit 1
fi
echo ""

# Summary
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ ALL CHECKS PASSED - READY FOR UPLOAD!                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📤 You can now upload: $PACKAGE"
echo ""

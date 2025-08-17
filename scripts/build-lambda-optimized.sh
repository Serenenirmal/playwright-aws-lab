#!/bin/bash

echo "🏗️ Building optimized Lambda package..."

# Clean up previous builds
rm -rf build/ lambda.zip

# Create clean build directory
mkdir -p build

# Copy only essential files
echo "📋 Copying essential files..."
cp -r scripts/ build/
cp -r tests/ build/
cp package.json build/
cp playwright.config.ts build/

# Create minimal package.json for Lambda
cat > build/package.json << EOF
{
  "name": "playwright-aws-lab",
  "version": "1.0.0",
  "main": "scripts/lambda-handler.js",
  "scripts": {
    "test": "mkdir -p test-results playwright-report && playwright test"
  },
  "dependencies": {
    "@playwright/test": "^1.45.0",
    "@aws-sdk/client-s3": "^3.540.0"
  }
}
EOF

# Install only production dependencies in build directory
cd build
echo "📦 Installing production dependencies..."
npm install --production --no-optional

# Remove unnecessary files to reduce size (but keep required ones)
echo "🗑️ Removing unnecessary files..."
find node_modules -name "*.d.ts" -delete
find node_modules -name "*.map" -delete
find node_modules -name "README*" -delete
find node_modules -name "CHANGELOG*" -delete
find node_modules -name "*.test.js" -delete

# Install only Chromium browser
echo "🌐 Installing Chromium for Lambda..."
npx playwright install chromium --with-deps

# Create optimized zip
echo "📦 Creating Lambda package..."
zip -r ../lambda.zip . -x '*.git*' 'node_modules/.cache/*' 'test-results/*'

cd ..

# Check package size
PACKAGE_SIZE=$(ls -lh lambda.zip | awk '{print $5}')
echo "📏 Lambda package size: $PACKAGE_SIZE"

# Verify size is under Lambda limit
if [ $(stat -c%s lambda.zip) -gt 52428800 ]; then
    echo "⚠️ Warning: Package size exceeds 50MB Lambda limit"
    echo "💡 Consider using Lambda Layers or Container Images for larger packages"
else
    echo "✅ Package size is within Lambda limits"
fi

echo "🎉 Lambda package ready for deployment!"

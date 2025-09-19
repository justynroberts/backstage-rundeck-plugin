#!/bin/bash

# Backstage Rundeck Plugin - Automated Installation Script
# This script automates the workspace installation method

set -e  # Exit on any error

echo "🚀 Backstage Rundeck Plugin - Automated Installation"
echo "=================================================="

# Check if we're in a Backstage project
if [ ! -f "package.json" ] || ! grep -q "backstage" package.json; then
    echo "❌ Error: This doesn't appear to be a Backstage project directory"
    echo "   Please run this script from your Backstage app root directory"
    exit 1
fi

# Check for required directories
if [ ! -d "packages/backend" ]; then
    echo "❌ Error: packages/backend directory not found"
    echo "   Please run this script from your Backstage app root directory"
    exit 1
fi

echo "✅ Backstage project detected"

# Check if plugin already exists
if [ -d "plugins/rundeck" ]; then
    echo "⚠️  Plugin directory already exists at plugins/rundeck"
    read -p "Do you want to remove it and reinstall? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf plugins/rundeck
        echo "🗑️  Removed existing plugin directory"
    else
        echo "❌ Installation cancelled"
        exit 1
    fi
fi

# Step 1: Clone plugin
echo "📦 Step 1: Cloning plugin to plugins/rundeck..."
mkdir -p plugins
git clone https://github.com/justynroberts/backstage-rundeck-plugin.git plugins/rundeck

# Step 2: Build plugin
echo "🔧 Step 2: Building plugin..."
cd plugins/rundeck
yarn install
yarn build
cd ../..

# Step 3: Add backend dependency
echo "📝 Step 3: Adding backend dependency..."
if ! grep -q "plugin-scaffolder-backend-module-rundeck" packages/backend/package.json; then
    # Create backup
    cp packages/backend/package.json packages/backend/package.json.backup

    # Add dependency using a more reliable method
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('packages/backend/package.json', 'utf8'));
    pkg.dependencies['@internal/plugin-scaffolder-backend-module-rundeck'] = 'workspace:*';
    fs.writeFileSync('packages/backend/package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
    echo "✅ Added dependency to packages/backend/package.json"
else
    echo "✅ Dependency already exists in packages/backend/package.json"
fi

# Step 4: Add backend import
echo "📝 Step 4: Adding backend import..."
if ! grep -q "plugin-scaffolder-backend-module-rundeck" packages/backend/src/index.ts; then
    # Create backup
    cp packages/backend/src/index.ts packages/backend/src/index.ts.backup

    # Find the right place to add the import (after other scaffolder imports)
    if grep -q "plugin-scaffolder-backend-module-github" packages/backend/src/index.ts; then
        # Add after github scaffolder module
        sed -i.tmp '/plugin-scaffolder-backend-module-github/a\
\
// Add Rundeck scaffolder actions\
backend.add(import('\''@internal/plugin-scaffolder-backend-module-rundeck'\''));
' packages/backend/src/index.ts
        rm packages/backend/src/index.ts.tmp
    else
        # Add after scaffolder backend
        sed -i.tmp '/plugin-scaffolder-backend/a\
\
// Add Rundeck scaffolder actions\
backend.add(import('\''@internal/plugin-scaffolder-backend-module-rundeck'\''));
' packages/backend/src/index.ts
        rm packages/backend/src/index.ts.tmp
    fi
    echo "✅ Added import to packages/backend/src/index.ts"
else
    echo "✅ Import already exists in packages/backend/src/index.ts"
fi

# Step 5: Add configuration
echo "📝 Step 5: Adding configuration..."
if ! grep -q "rundeck:" app-config.yaml; then
    cat >> app-config.yaml << 'EOF'

# Rundeck integration configuration
rundeck:
  url: ${RUNDECK_API_URL}
  apiToken: ${RUNDECK_API_TOKEN}
EOF
    echo "✅ Added configuration to app-config.yaml"
else
    echo "✅ Rundeck configuration already exists in app-config.yaml"
fi

# Step 6: Create .env file
echo "📝 Step 6: Setting up environment file..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# Rundeck Configuration
RUNDECK_API_URL=https://demo.rundeck.com
RUNDECK_API_TOKEN=dummy-token-for-testing
EOF
    echo "✅ Created .env file with dummy Rundeck configuration"
else
    if ! grep -q "RUNDECK_API_URL" .env; then
        cat >> .env << 'EOF'

# Rundeck Configuration
RUNDECK_API_URL=https://demo.rundeck.com
RUNDECK_API_TOKEN=dummy-token-for-testing
EOF
        echo "✅ Added Rundeck configuration to existing .env file"
    else
        echo "✅ Rundeck configuration already exists in .env file"
    fi
fi

# Step 7: Install dependencies
echo "📦 Step 7: Installing dependencies..."
yarn install

echo ""
echo "🎉 Installation Complete!"
echo "======================="
echo ""
echo "✅ Plugin has been successfully installed!"
echo ""
echo "📋 Next Steps:"
echo "   1. Update your .env file with real Rundeck URL and API token"
echo "   2. Start Backstage: yarn start"
echo "   3. Check logs for 'rundeck:job:execute' in scaffolder actions"
echo ""
echo "🔧 Configuration files modified:"
echo "   - packages/backend/package.json (backup: package.json.backup)"
echo "   - packages/backend/src/index.ts (backup: index.ts.backup)"
echo "   - app-config.yaml"
echo "   - .env"
echo ""
echo "📖 For more information, see:"
echo "   - plugins/rundeck/README.md"
echo "   - plugins/rundeck/INSTALLATION-CHECKLIST.md"
echo ""
echo "🚀 Ready to start: yarn start"
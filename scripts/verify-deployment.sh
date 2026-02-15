#!/bin/bash
echo "🔍 Verifying deployment..."

# Check if files exist
files_to_check=(
    "dist/server.mjs"
    "ecosystem.config.json"
    "package.json"
    "public/index.html"
    "public/app.js"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check Node.js version
node_version=$(node --version | sed 's/v//')
required_version="18.0.0"

if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" = "$required_version" ]; then
    echo "✅ Node.js version $node_version meets requirement (>= $required_version)"
else
    echo "❌ Node.js version $node_version does not meet requirement (>= $required_version)"
    exit 1
fi

echo "✅ Deployment verification passed!"

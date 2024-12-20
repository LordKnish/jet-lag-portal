#!/bin/bash

# Function to create directory if it doesn't exist
create_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        echo "Created directory: $1"
    else
        echo "Directory already exists: $1"
    fi
}

# Function to create file if it doesn't exist
create_file() {
    if [ ! -f "$1" ]; then
        touch "$1"
        echo "Created file: $1"
    else
        echo "File already exists: $1"
    fi
}

# Create source directory structure
create_dir "src/assets/images"
create_dir "src/assets/icons"
create_dir "src/components/common"
create_dir "src/components/game"
create_dir "src/components/map"
create_dir "src/hooks"
create_dir "src/pages"
create_dir "src/store"
create_dir "src/types"
create_dir "src/utils"

# Create TypeScript configuration files directory
create_dir "config"

# Create VS Code settings directory
create_dir ".vscode"

# Create public directory for static assets
create_dir "public"

# Create the basic files
create_file "README.md"
create_file ".gitignore"
create_file "src/vite-env.d.ts"
create_file "src/main.tsx"
create_file "src/App.tsx"
create_file "src/index.css"

# Create configuration files
create_file "tsconfig.json"
create_file "tsconfig.node.json"
create_file "vite.config.ts"
create_file ".prettierrc"
create_file ".eslintrc.json"
create_file "tailwind.config.js"
create_file "postcss.config.js"
create_file ".vscode/settings.json"

# Create initial component directories
create_dir "src/components/game/board"
create_dir "src/components/game/cards"
create_dir "src/components/game/map"
create_dir "src/components/common/layout"
create_dir "src/components/common/ui"

# Create type definition files
create_file "src/types/game.ts"
create_file "src/types/map.ts"
create_file "src/types/cards.ts"

# Create store files
create_file "src/store/gameStore.ts"
create_file "src/store/mapStore.ts"
create_file "src/store/cardStore.ts"

# Create utility files
create_file "src/utils/constants.ts"
create_file "src/utils/helpers.ts"
create_file "src/utils/mapUtils.ts"

# Print directory structure if tree is installed
if command -v tree >/dev/null 2>&1; then
    echo -e "\nProject structure:"
    tree -L 3
else
    echo -e "\nProject structure created successfully for jl-tlv"
    echo "Install 'tree' package to view directory structure"
fi
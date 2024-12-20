#!/bin/bash

# Function to print the tree structure
print_tree() {
    local directory="$1"
    local prefix="$2"
    local is_last="$3"
    
    # Print the current directory with appropriate prefix
    if [[ "$is_last" == "true" ]]; then
        echo "${prefix}└── $(basename "$directory")/"
        new_prefix="${prefix}    "
    else
        echo "${prefix}├── $(basename "$directory")/"
        new_prefix="${prefix}│   "
    fi
    
    # Retrieve subdirectories, sorted alphabetically
    local subdirs=()
    while IFS= read -r -d $'\0' dir; do
        subdirs+=("$dir")
    done < <(find "$directory" -maxdepth 1 -type d ! -path "$directory" -print0 | sort -z)
    
    local count=${#subdirs[@]}
    local i=1
    for subdir in "${subdirs[@]}"; do
        if [[ $i -eq $count ]]; then
            print_tree "$subdir" "$new_prefix" "true"
        else
            print_tree "$subdir" "$new_prefix" "false"
        fi
        ((i++))
    done
}

# Main Execution
start_dir="${1:-.}"  # Default to current directory if no argument is provided

echo "$(basename "$start_dir")/"
print_tree "$start_dir" "" "false"

#!/usr/bin/env bash

set -euo pipefail
umask 077

usage() {
    echo "Usage: $0 [--force] [--dry-run] <source-worktree>"
    echo "Copies approved ignored local files from another SPORTSHUB worktree."
}

force=0
dry_run=0
source_argument=""

for argument in "$@"; do
    case "$argument" in
        --force)
            force=1
            ;;
        --dry-run)
            dry_run=1
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        -*)
            usage
            exit 1
            ;;
        *)
            if [ -n "$source_argument" ]; then
                usage
                exit 1
            fi
            source_argument="$argument"
            ;;
    esac
done

if [ -z "$source_argument" ]; then
    usage
    exit 1
fi

target_root="$(git rev-parse --show-toplevel)"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
source_root="$(cd "$source_argument" && pwd -P)"
source_git_root="$(git -C "$source_root" rev-parse --show-toplevel)"

if [ "$source_root" != "$source_git_root" ]; then
    echo "Source must be a worktree root: $source_argument" >&2
    exit 1
fi

target_common_dir="$(git -C "$target_root" rev-parse --path-format=absolute --git-common-dir)"
source_common_dir="$(git -C "$source_root" rev-parse --path-format=absolute --git-common-dir)"

if [ "$target_common_dir" != "$source_common_dir" ]; then
    echo "Source and target must be worktrees from the same repository." >&2
    exit 1
fi

if [ "$target_root" = "$source_root" ]; then
    echo "Source and target worktrees must differ." >&2
    exit 1
fi

manifest="$script_dir/worktree-local-files.txt"
if [ ! -f "$manifest" ]; then
    echo "Missing local-file manifest: $manifest" >&2
    exit 1
fi

copy_paths=""
copy_count=0
skipped_paths=""
skipped_count=0

while IFS= read -r relative_path || [ -n "$relative_path" ]; do
    case "$relative_path" in
        ''|'#'*)
            continue
            ;;
        /*|*'..'*)
            echo "Invalid manifest path: $relative_path" >&2
            exit 1
            ;;
    esac

    source_path="$source_root/$relative_path"
    target_path="$target_root/$relative_path"

    if [ ! -f "$source_path" ]; then
        echo "Missing required source file: $relative_path" >&2
        exit 1
    fi

    if ! git -C "$target_root" check-ignore -q -- "$relative_path"; then
        echo "Refusing to copy a path that Git does not ignore: $relative_path" >&2
        exit 1
    fi

    if [ -e "$target_path" ] || [ -L "$target_path" ]; then
        if cmp -s "$source_path" "$target_path"; then
            skipped_paths+="$relative_path"$'\n'
            skipped_count=$((skipped_count + 1))
        elif [ "$force" -eq 1 ]; then
            copy_paths+="$relative_path"$'\n'
            copy_count=$((copy_count + 1))
        else
            echo "Target differs and will not be overwritten: $relative_path" >&2
            echo "Re-run with --force only if the source copy should replace it." >&2
            exit 1
        fi
    else
        copy_paths+="$relative_path"$'\n'
        copy_count=$((copy_count + 1))
    fi
done < "$manifest"

if [ "$dry_run" -eq 1 ]; then
    printf 'Would copy %s local file(s):\n' "$copy_count"
    if [ "$copy_count" -gt 0 ]; then
        printf '%s' "$copy_paths"
    fi
    printf 'Already current %s local file(s):\n' "$skipped_count"
    if [ "$skipped_count" -gt 0 ]; then
        printf '%s' "$skipped_paths"
    fi
    exit 0
fi

if [ "$copy_count" -gt 0 ]; then
    while IFS= read -r relative_path; do
        if [ -z "$relative_path" ]; then
            continue
        fi
        source_path="$source_root/$relative_path"
        target_path="$target_root/$relative_path"
        mkdir -p "$(dirname "$target_path")"
        install -m 600 "$source_path" "$target_path"
    done <<< "$copy_paths"
fi

printf 'Copied %s local file(s).\n' "$copy_count"
printf 'Already current %s local file(s).\n' "$skipped_count"

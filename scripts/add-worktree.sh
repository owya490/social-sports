#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <worktree-path> <branch-name>" >&2
    exit 1
fi

source_root="$(git rev-parse --show-toplevel)"
worktree_path="$1"
branch_name="$2"

git -C "$source_root" worktree add -b "$branch_name" "$worktree_path" master
(
    cd "$worktree_path"
    "$source_root/scripts/bootstrap-worktree-env.sh" "$source_root"
)

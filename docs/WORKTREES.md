# Local worktrees

Git worktrees do not include ignored files. SPORTSHUB's helper scripts copy the approved local development files from an existing configured worktree without exposing or tracking them.

## Create a worktree

From your configured primary checkout, run:

```bash
./scripts/add-worktree.sh ../social-sports-611 brian2w/event-creation-transaction-safety
```

The command creates the branch from local `master`, then copies every path in `scripts/worktree-local-files.txt`. It refuses to copy a path unless Git ignores it in the destination worktree.

## Prepare an existing worktree

From the existing worktree's root, run:

```bash
./scripts/bootstrap-worktree-env.sh ~/code/social-sports
```

Use `--dry-run` to list filenames that would be copied. The script never overwrites a different local file by default. When intentionally refreshing an existing worktree from the source checkout, use:

```bash
./scripts/bootstrap-worktree-env.sh --force ~/code/social-sports
```

The source must be another worktree of the same repository. The scripts output paths and counts only, never secret values.

## Maintain the allowlist

When a new ignored local file is required in every worktree, add its repository-relative path to `scripts/worktree-local-files.txt`. Do not add generated deployment files such as `functions/lib/functions/.env`; deployment creates those from the selected environment source file.

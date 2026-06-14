#!/usr/bin/env python3

import json
import shlex
import subprocess
import sys


EXPECTED_REPO = "owya490/social-sports"
MUTATING_GH_RESOURCES = {
    "issue": {"close", "create", "edit"},
    "pr": {"close", "comment", "create", "edit", "merge", "review"},
}


def block(message: str) -> None:
    print(f"BLOCKED: {message}", file=sys.stderr)
    raise SystemExit(2)


def current_branch() -> str:
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        capture_output=True,
        check=False,
        text=True,
    )
    return result.stdout.strip()


def is_mutating_gh_command(tokens: list[str]) -> bool:
    return any(
        tokens[index] == "gh"
        and tokens[index + 1] in MUTATING_GH_RESOURCES
        and tokens[index + 2] in MUTATING_GH_RESOURCES[tokens[index + 1]]
        for index in range(len(tokens) - 2)
    )


def has_expected_repo(tokens: list[str]) -> bool:
    return any(
        tokens[index] == "--repo" and tokens[index + 1] == EXPECTED_REPO
        for index in range(len(tokens) - 1)
    )


def pushes_to_master(tokens: list[str]) -> bool:
    push_indexes = [
        index
        for index in range(len(tokens) - 1)
        if tokens[index : index + 2] == ["git", "push"]
    ]
    explicit_master = any(
        token == "master" or token.endswith(":master")
        for index in push_indexes
        for token in tokens[index + 2 :]
    )
    plain_push = any(
        index + 2 == len(tokens) or tokens[index + 2] in {"&&", "||", ";"}
        for index in push_indexes
    )
    return explicit_master or (plain_push and current_branch() == "master")


def main() -> None:
    try:
        payload = json.load(sys.stdin)
        command = payload.get("tool_input", {}).get("command", "")
        tokens = shlex.split(command)
    except (json.JSONDecodeError, ValueError):
        return

    if is_mutating_gh_command(tokens) and not has_expected_repo(tokens):
        block(f"mutating gh commands must include '--repo {EXPECTED_REPO}'.")

    if pushes_to_master(tokens):
        block("a direct push to master triggers production deployments; use a PR.")


if __name__ == "__main__":
    main()

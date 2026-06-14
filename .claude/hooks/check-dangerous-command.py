#!/usr/bin/env python3

import json
import shlex
import subprocess
import sys


EXPECTED_REPO = "owya490/social-sports"
MUTATING_GH_RESOURCES = {
    "issue": {
        "close",
        "comment",
        "create",
        "delete",
        "edit",
        "lock",
        "pin",
        "reopen",
        "transfer",
        "unlock",
        "unpin",
    },
    "pr": {
        "close",
        "comment",
        "create",
        "edit",
        "lock",
        "merge",
        "ready",
        "reopen",
        "review",
        "unlock",
    },
}
SHELL_SEPARATORS = set("();&|")
SHELLS = {"bash", "sh", "zsh"}
GIT_GLOBAL_OPTIONS_WITH_VALUES = {
    "-C",
    "-c",
    "--config-env",
    "--git-dir",
    "--namespace",
    "--work-tree",
}


def block(message: str) -> None:
    print(f"BLOCKED: {message}", file=sys.stderr)
    raise SystemExit(2)


def command_name(token: str) -> str:
    return token.rsplit("/", 1)[-1]


def current_branch() -> str:
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        capture_output=True,
        check=False,
        text=True,
    )
    return result.stdout.strip()


def command_segments(command: str) -> list[list[str]]:
    lexer = shlex.shlex(command, posix=True, punctuation_chars="();&|")
    lexer.commenters = ""
    lexer.whitespace_split = True

    segments: list[list[str]] = [[]]
    for token in lexer:
        if token and all(character in SHELL_SEPARATORS for character in token):
            if segments[-1]:
                segments.append([])
            continue
        segments[-1].append(token)

    non_empty_segments = [segment for segment in segments if segment]
    nested_segments = [
        nested_segment
        for segment in non_empty_segments
        for index, token in enumerate(segment[:-1])
        if command_name(token) in SHELLS
        and segment[index + 1] == "-c"
        and index + 2 < len(segment)
        for nested_segment in command_segments(segment[index + 2])
    ]
    return non_empty_segments + nested_segments


def is_mutating_gh_command(tokens: list[str]) -> bool:
    for gh_index, token in enumerate(tokens):
        if command_name(token) != "gh":
            continue

        index = gh_index + 1
        while index < len(tokens) and tokens[index].startswith("-"):
            if tokens[index] in {"--hostname", "--repo", "-R"}:
                index += 2
            else:
                index += 1

        if (
            index + 1 < len(tokens)
            and tokens[index] in MUTATING_GH_RESOURCES
            and tokens[index + 1] in MUTATING_GH_RESOURCES[tokens[index]]
        ):
            return True

    return False


def has_expected_repo(tokens: list[str]) -> bool:
    repo_values: list[str] = []
    for index, token in enumerate(tokens):
        if token.startswith("--repo="):
            repo_values.append(token.split("=", 1)[1])
        elif token == "--repo" and index + 1 < len(tokens):
            repo_values.append(tokens[index + 1])

    return bool(repo_values) and repo_values[-1] == EXPECTED_REPO


def pushes_to_master(tokens: list[str]) -> bool:
    arguments: list[str] | None = None
    for git_index, token in enumerate(tokens):
        if command_name(token) != "git":
            continue

        index = git_index + 1
        while index < len(tokens) and tokens[index].startswith("-"):
            if tokens[index] in GIT_GLOBAL_OPTIONS_WITH_VALUES:
                index += 2
            else:
                index += 1

        if index < len(tokens) and tokens[index] == "push":
            arguments = tokens[index + 1 :]
            break

    if arguments is None:
        return False

    if any(argument in {"--all", "--mirror"} for argument in arguments):
        return True

    destinations = [
        argument.lstrip("+").rsplit(":", 1)[-1]
        for argument in arguments
        if not argument.startswith("-")
    ]
    explicit_master = any(
        destination in {"master", "refs/heads/master"}
        for destination in destinations
    )
    if explicit_master:
        return True

    positional_arguments = [
        argument for argument in arguments if not argument.startswith("-")
    ]
    refspecs = positional_arguments[1:]
    pushes_current_branch = not refspecs or "HEAD" in refspecs
    return pushes_current_branch and current_branch() == "master"


def main() -> None:
    try:
        payload = json.load(sys.stdin)
        command = payload.get("tool_input", {}).get("command", "")
    except (json.JSONDecodeError, ValueError):
        return

    try:
        segments = command_segments(command)
    except ValueError:
        return

    for tokens in segments:
        if is_mutating_gh_command(tokens) and not has_expected_repo(tokens):
            block(f"mutating gh commands must include '--repo {EXPECTED_REPO}'.")

        if pushes_to_master(tokens):
            block("a direct push to master triggers production deployments; use a PR.")


if __name__ == "__main__":
    main()

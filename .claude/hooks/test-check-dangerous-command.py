#!/usr/bin/env python3

import json
import subprocess
import tempfile
import unittest
from pathlib import Path


HOOK = Path(__file__).with_name("check-dangerous-command.py")
REPO_ROOT = HOOK.parents[2]


def run_hook(
    command: str, cwd: Path | None = None
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["python3", str(HOOK)],
        input=json.dumps({"tool_input": {"command": command}}),
        capture_output=True,
        check=False,
        text=True,
        cwd=cwd,
    )


class CheckDangerousCommandTest(unittest.TestCase):
    def test_blocks_mutating_gh_command_without_explicit_repo(self) -> None:
        result = run_hook("gh pr create --draft")

        self.assertEqual(2, result.returncode)
        self.assertIn("--repo owya490/social-sports", result.stderr)

    def test_allows_mutating_gh_command_with_explicit_repo(self) -> None:
        result = run_hook(
            "gh pr create --repo owya490/social-sports --draft"
        )

        self.assertEqual(0, result.returncode)

    def test_allows_mutating_gh_command_with_equals_repo(self) -> None:
        result = run_hook(
            "gh pr create --repo=owya490/social-sports --draft"
        )

        self.assertEqual(0, result.returncode)

    def test_blocks_chained_mutating_gh_command_without_explicit_repo(self) -> None:
        result = run_hook("cd frontend && gh pr comment 123 --body review")

        self.assertEqual(2, result.returncode)

    def test_blocks_rtk_mutating_gh_command_without_explicit_repo(self) -> None:
        result = run_hook("rtk gh issue create --title defect")

        self.assertEqual(2, result.returncode)

    def test_blocks_issue_comment_without_explicit_repo(self) -> None:
        result = run_hook("gh issue comment 123 --body update")

        self.assertEqual(2, result.returncode)

    def test_blocks_pr_ready_without_explicit_repo(self) -> None:
        result = run_hook("gh pr ready 123")

        self.assertEqual(2, result.returncode)

    def test_blocks_global_wrong_repo_flag(self) -> None:
        result = run_hook("gh -R wrong/repo pr create --draft")

        self.assertEqual(2, result.returncode)

    def test_blocks_full_path_gh_mutation(self) -> None:
        result = run_hook("/opt/homebrew/bin/gh pr create --draft")

        self.assertEqual(2, result.returncode)

    def test_blocks_mutation_nested_in_shell_command(self) -> None:
        result = run_hook("bash -c 'gh pr create --draft'")

        self.assertEqual(2, result.returncode)

    def test_blocks_master_push_nested_in_shell_command(self) -> None:
        result = run_hook("sh -c 'git push origin master'")

        self.assertEqual(2, result.returncode)

    def test_does_not_accept_repo_flag_from_later_command(self) -> None:
        result = run_hook(
            "gh pr create --draft && echo --repo owya490/social-sports"
        )

        self.assertEqual(2, result.returncode)

    def test_does_not_accept_expected_repo_after_wrong_repo(self) -> None:
        result = run_hook(
            "gh pr create --repo wrong/repo && echo --repo owya490/social-sports"
        )

        self.assertEqual(2, result.returncode)

    def test_blocks_when_last_repo_flag_targets_wrong_repo(self) -> None:
        result = run_hook(
            "gh pr create --repo owya490/social-sports --repo wrong/repo"
        )

        self.assertEqual(2, result.returncode)

    def test_blocks_direct_push_to_master(self) -> None:
        result = run_hook("git push origin HEAD:master")

        self.assertEqual(2, result.returncode)
        self.assertIn("master triggers production deployments", result.stderr)

    def test_blocks_named_master_push(self) -> None:
        result = run_hook("git push origin master")

        self.assertEqual(2, result.returncode)
        self.assertIn("master triggers production deployments", result.stderr)

    def test_blocks_canonical_master_refspec(self) -> None:
        result = run_hook("git push origin HEAD:refs/heads/master")

        self.assertEqual(2, result.returncode)

    def test_blocks_force_prefixed_master_ref(self) -> None:
        result = run_hook("git push origin +refs/heads/master")

        self.assertEqual(2, result.returncode)

    def test_blocks_master_push_with_git_directory_option(self) -> None:
        result = run_hook("git -C . push origin master")

        self.assertEqual(2, result.returncode)

    def test_blocks_full_path_git_master_push(self) -> None:
        result = run_hook("/usr/bin/git push origin master")

        self.assertEqual(2, result.returncode)

    def test_blocks_push_all(self) -> None:
        result = run_hook("git push origin --all")

        self.assertEqual(2, result.returncode)

    def test_blocks_push_mirror(self) -> None:
        result = run_hook("git push --mirror origin")

        self.assertEqual(2, result.returncode)

    def test_blocks_plain_push_from_master_checkout(self) -> None:
        (REPO_ROOT / ".tmp").mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(
            dir=REPO_ROOT / ".tmp"
        ) as temporary_directory:
            subprocess.run(
                ["git", "init", "-b", "master"],
                cwd=temporary_directory,
                capture_output=True,
                check=True,
                text=True,
            )

            result = run_hook("git push", Path(temporary_directory))

        self.assertEqual(2, result.returncode)

    def test_allows_feature_branch_push(self) -> None:
        result = run_hook("git push -u origin brian2w/harness-engineering")

        self.assertEqual(0, result.returncode)

    def test_blocks_chained_master_push(self) -> None:
        result = run_hook("cd frontend && rtk git push origin master")

        self.assertEqual(2, result.returncode)

    def test_allows_feature_push_followed_by_unrelated_master_word(self) -> None:
        result = run_hook(
            "git push origin brian2w/harness-engineering && echo master"
        )

        self.assertEqual(0, result.returncode)

    def test_allows_two_independently_safe_commands(self) -> None:
        result = run_hook(
            "gh pr edit --repo owya490/social-sports && "
            "git push origin brian2w/harness-engineering"
        )

        self.assertEqual(0, result.returncode)

    def test_ignores_non_command_tool_input(self) -> None:
        result = subprocess.run(
            ["python3", str(HOOK)],
            input=json.dumps({"tool_input": {}}),
            capture_output=True,
            check=False,
            text=True,
        )

        self.assertEqual(0, result.returncode)


if __name__ == "__main__":
    unittest.main()

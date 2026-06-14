#!/usr/bin/env python3

import json
import subprocess
import unittest
from pathlib import Path


HOOK = Path(__file__).with_name("check-dangerous-command.py")


def run_hook(command: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["python3", str(HOOK)],
        input=json.dumps({"tool_input": {"command": command}}),
        capture_output=True,
        check=False,
        text=True,
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

    def test_blocks_chained_mutating_gh_command_without_explicit_repo(self) -> None:
        result = run_hook("cd frontend && gh pr comment 123 --body review")

        self.assertEqual(2, result.returncode)

    def test_blocks_rtk_mutating_gh_command_without_explicit_repo(self) -> None:
        result = run_hook("rtk gh issue create --title defect")

        self.assertEqual(2, result.returncode)

    def test_blocks_direct_push_to_master(self) -> None:
        result = run_hook("git push origin HEAD:master")

        self.assertEqual(2, result.returncode)
        self.assertIn("master triggers production deployments", result.stderr)

    def test_blocks_named_master_push(self) -> None:
        result = run_hook("git push origin master")

        self.assertEqual(2, result.returncode)
        self.assertIn("master triggers production deployments", result.stderr)

    def test_allows_feature_branch_push(self) -> None:
        result = run_hook("git push -u origin brian2w/harness-engineering")

        self.assertEqual(0, result.returncode)

    def test_blocks_chained_master_push(self) -> None:
        result = run_hook("cd frontend && rtk git push origin master")

        self.assertEqual(2, result.returncode)

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

"""Unit tests for policy objects (no Hermes import chain needed)."""

import os
import unittest
from pathlib import Path
from unittest.mock import patch

# Add python/src to path for test-time imports
import sys
_src = str(Path(__file__).resolve().parent.parent / "src")
if _src not in sys.path:
    sys.path.insert(0, _src)

from path_policy import PathPolicy, PathPolicyError
from network_policy import NetworkPolicy
from tool_policy import ToolPolicy
from secret_store import SecretStore


class TestPathPolicy(unittest.TestCase):
    def setUp(self):
        self.root = Path("/tmp/hermesdesk-workspace")
        self.policy = PathPolicy(
            self.root,
            extra_read=[Path("/tmp/readonly")],
            extra_write=[Path("/tmp/writable")],
        )

    def test_workspace_root(self):
        self.assertEqual(self.policy.workspace_root, Path("/tmp/hermesdesk-workspace"))

    def test_valid_path_under_root(self):
        result = self.policy.enforce(self.root / "file.txt", write=True)
        self.assertEqual(result, Path("/tmp/hermesdesk-workspace/file.txt"))

    def test_valid_path_extra_read(self):
        result = self.policy.enforce(Path("/tmp/readonly/data.txt"), write=False)
        self.assertEqual(result, Path("/tmp/readonly/data.txt"))

    def test_valid_path_extra_write(self):
        result = self.policy.enforce(Path("/tmp/writable/out.txt"), write=True)
        self.assertEqual(result, Path("/tmp/writable/out.txt"))

    def test_block_escaped_path(self):
        with self.assertRaises(PathPolicyError):
            self.policy.enforce(Path("/etc/passwd"), write=True)

    def test_read_only_on_write_extra(self):
        result = self.policy.enforce(Path("/tmp/writable/out.txt"), write=False)
        self.assertEqual(result, Path("/tmp/writable/out.txt"))


class TestNetworkPolicy(unittest.TestCase):
    def setUp(self):
        self.policy = NetworkPolicy(llm_host="openrouter.ai", extra_hosts="example.com")

    def test_allows_localhost(self):
        self.policy.check_url("http://127.0.0.1:8080/api")
        self.policy.check_url("http://localhost:8080/api")
        self.policy.check_url("http://[::1]:8080/api")

    def test_allows_default_allow_hosts(self):
        self.policy.check_url("https://speech.platform.bing.com/tts")

    def test_allows_llm_host(self):
        self.policy.check_url("https://openrouter.ai/api/v1/chat/completions")

    def test_allows_extra_host(self):
        self.policy.check_url("https://example.com/data")

    def test_blocks_unknown_host(self):
        with self.assertRaises(PermissionError):
            self.policy.check_url("https://evil.example.com/data")

    def test_default_policy_blocks_unknown(self):
        policy = NetworkPolicy()
        with self.assertRaises(PermissionError):
            policy.check_url("https://unknown.host/data")

    def test_default_policy_allows_localhost(self):
        policy = NetworkPolicy()
        policy.check_url("http://127.0.0.1:8080/api")


class TestToolPolicy(unittest.TestCase):
    def test_default_mode_tools(self):
        tools = ToolPolicy.resolve(power_user=False)
        self.assertEqual(len(tools), 7)
        self.assertEqual(tools, ["web", "file", "vision", "image_gen", "tts", "skills", "todo"])

    def test_power_user_mode_tools(self):
        tools = ToolPolicy.resolve(power_user=True)
        self.assertEqual(len(tools), 11)
        self.assertTrue("terminal" in tools)
        self.assertTrue("browser" in tools)
        self.assertTrue("code_execution" in tools)
        self.assertTrue("moa" in tools)

    def test_default_keeps_safe_tools(self):
        tools = ToolPolicy.resolve(power_user=False)
        self.assertNotIn("terminal", tools)
        self.assertNotIn("browser", tools)
        self.assertNotIn("code_execution", tools)

    def test_is_power_user_from_env(self):
        with patch.dict(os.environ, {"HERMESDESK_POWER_USER": "1"}):
            self.assertTrue(ToolPolicy.is_power_user())
        with patch.dict(os.environ, {"HERMESDESK_POWER_USER": "0"}):
            self.assertFalse(ToolPolicy.is_power_user())

    def test_is_power_user_default(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(ToolPolicy.is_power_user())


class TestSecretStore(unittest.TestCase):
    def test_no_op_when_no_url(self):
        with patch.dict(os.environ, {}, clear=True):
            store = SecretStore()
            result = store.fetch()
            self.assertIsNone(result)

    def test_no_op_with_url_but_no_provider(self):
        with patch.dict(os.environ, {"HERMESDESK_SECRET_URL": "http://127.0.0.1:1234/secret/token"}, clear=True):
            store = SecretStore()
            result = store.fetch()
            self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()

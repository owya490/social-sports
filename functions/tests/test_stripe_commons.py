"""
Comprehensive end-to-end tests for Stripe commons functionality.
Tests the configuration and shared utilities used across all Stripe modules.
"""

import os
from unittest.mock import Mock, patch

import pytest
from lib.stripe import commons


class TestStripeConfiguration:
    """Tests for Stripe API key configuration and environment setup."""

    @patch.dict(os.environ, {"STRIPE_API_KEY": "test_api_key_12345"})
    def test_stripe_api_key_loaded_from_environment(self):
        """Test that Stripe API key is correctly loaded from environment variable."""
        # Re-import to pick up the mocked environment variable
        import importlib

        importlib.reload(commons)

        import stripe

        assert stripe.api_key == "test_api_key_12345"

    @patch.dict(os.environ, {}, clear=True)
    def test_stripe_api_key_none_when_not_set(self):
        """Test that Stripe API key is None when environment variable is not set."""
        # Re-import to pick up the cleared environment
        import importlib

        importlib.reload(commons)

        import stripe

        assert stripe.api_key is None

    @patch.dict(os.environ, {"STRIPE_API_KEY": ""})
    def test_stripe_api_key_empty_string_when_env_empty(self):
        """Test that Stripe API key is empty string when environment variable is empty."""
        # Re-import to pick up the empty environment variable
        import importlib

        importlib.reload(commons)

        import stripe

        assert stripe.api_key == ""

    @patch.dict(os.environ, {"STRIPE_API_KEY": "live_api_key_67890"})
    def test_stripe_api_key_supports_live_keys(self):
        """Test that Stripe API key correctly handles live environment keys."""
        # Re-import to pick up the mocked environment variable
        import importlib

        importlib.reload(commons)

        import stripe

        assert stripe.api_key == "live_api_key_67890"


class TestWebhookEndpointSecret:
    """Tests for Stripe webhook endpoint secret configuration."""

    @patch.dict(os.environ, {"STRIPE_WEBHOOK_ENDPOINT_SECRET": "whsec_test_secret_123"})
    def test_webhook_secret_loaded_from_environment(self):
        """Test that webhook endpoint secret is correctly loaded from environment variable."""
        # Re-import to pick up the mocked environment variable
        import importlib

        importlib.reload(commons)

        from lib.stripe.commons import STRIPE_WEBHOOK_ENDPOINT_SECRET

        assert STRIPE_WEBHOOK_ENDPOINT_SECRET == "whsec_test_secret_123"

    @patch.dict(os.environ, {}, clear=True)
    def test_webhook_secret_none_when_not_set(self):
        """Test that webhook endpoint secret is None when environment variable is not set."""
        # Re-import to pick up the cleared environment
        import importlib

        importlib.reload(commons)

        from lib.stripe.commons import STRIPE_WEBHOOK_ENDPOINT_SECRET

        assert STRIPE_WEBHOOK_ENDPOINT_SECRET is None

    @patch.dict(os.environ, {"STRIPE_WEBHOOK_ENDPOINT_SECRET": ""})
    def test_webhook_secret_empty_string_when_env_empty(self):
        """Test that webhook endpoint secret is empty string when environment variable is empty."""
        # Re-import to pick up the empty environment variable
        import importlib

        importlib.reload(commons)

        from lib.stripe.commons import STRIPE_WEBHOOK_ENDPOINT_SECRET

        assert STRIPE_WEBHOOK_ENDPOINT_SECRET == ""

    @patch.dict(os.environ, {"STRIPE_WEBHOOK_ENDPOINT_SECRET": "whsec_live_secret_456"})
    def test_webhook_secret_supports_live_secrets(self):
        """Test that webhook endpoint secret correctly handles live environment secrets."""
        # Re-import to pick up the mocked environment variable
        import importlib

        importlib.reload(commons)

        from lib.stripe.commons import STRIPE_WEBHOOK_ENDPOINT_SECRET

        assert STRIPE_WEBHOOK_ENDPOINT_SECRET == "whsec_live_secret_456"


class TestErrorUrl:
    """Tests for the shared error URL constant."""

    def test_error_url_constant_value(self):
        """Test that ERROR_URL constant has the expected default value."""
        from lib.stripe.commons import ERROR_URL

        assert ERROR_URL == "/error"

    def test_error_url_is_string(self):
        """Test that ERROR_URL constant is a string type."""
        from lib.stripe.commons import ERROR_URL

        assert isinstance(ERROR_URL, str)

    def test_error_url_not_empty(self):
        """Test that ERROR_URL constant is not an empty string."""
        from lib.stripe.commons import ERROR_URL

        assert ERROR_URL != ""
        assert len(ERROR_URL) > 0

    def test_error_url_starts_with_slash(self):
        """Test that ERROR_URL constant starts with a forward slash for proper routing."""
        from lib.stripe.commons import ERROR_URL

        assert ERROR_URL.startswith("/")


class TestModuleImports:
    """Tests for module-level imports and dependencies."""

    def test_os_module_imported(self):
        """Test that os module is properly imported for environment variable access."""
        import lib.stripe.commons

        assert hasattr(lib.stripe.commons, "os")

    def test_stripe_module_imported(self):
        """Test that stripe module is properly imported and accessible."""
        import lib.stripe.commons

        assert hasattr(lib.stripe.commons, "stripe")

    def test_stripe_module_has_api_key_attribute(self):
        """Test that imported stripe module has the api_key attribute set."""
        import lib.stripe.commons
        import stripe

        assert hasattr(stripe, "api_key")


class TestConfigurationIntegration:
    """Integration tests for complete configuration setup."""

    @patch.dict(
        os.environ,
        {
            "STRIPE_API_KEY": "sk_test_integration_123",
            "STRIPE_WEBHOOK_ENDPOINT_SECRET": "whsec_test_integration_456",
        },
    )
    def test_complete_configuration_setup(self):
        """Test that all configuration values are properly set when all environment variables are present."""
        # Re-import to pick up the mocked environment variables
        import importlib

        importlib.reload(commons)

        import stripe
        from lib.stripe.commons import ERROR_URL, STRIPE_WEBHOOK_ENDPOINT_SECRET

        # Verify all configurations are set
        assert stripe.api_key == "sk_test_integration_123"
        assert STRIPE_WEBHOOK_ENDPOINT_SECRET == "whsec_test_integration_456"
        assert ERROR_URL == "/error"

    @patch.dict(os.environ, {}, clear=True)
    def test_configuration_graceful_degradation(self):
        """Test that configuration handles missing environment variables gracefully."""
        # Re-import to pick up the cleared environment
        import importlib

        importlib.reload(commons)

        import stripe
        from lib.stripe.commons import ERROR_URL, STRIPE_WEBHOOK_ENDPOINT_SECRET

        # Verify configuration handles missing values gracefully
        assert stripe.api_key is None
        assert STRIPE_WEBHOOK_ENDPOINT_SECRET is None
        assert ERROR_URL == "/error"  # This should always be set

    @patch.dict(
        os.environ,
        {
            "STRIPE_API_KEY": "sk_test_partial_123"
            # Missing STRIPE_WEBHOOK_ENDPOINT_SECRET
        },
    )
    def test_partial_configuration_setup(self):
        """Test that configuration works correctly when only some environment variables are set."""
        # Re-import to pick up the partial environment
        import importlib

        importlib.reload(commons)

        import stripe
        from lib.stripe.commons import ERROR_URL, STRIPE_WEBHOOK_ENDPOINT_SECRET

        # Verify partial configuration
        assert stripe.api_key == "sk_test_partial_123"
        assert STRIPE_WEBHOOK_ENDPOINT_SECRET is None
        assert ERROR_URL == "/error"


class TestEnvironmentVariableHandling:
    """Tests for various edge cases in environment variable handling."""

    @patch.dict(os.environ, {"STRIPE_API_KEY": "   sk_test_whitespace_123   "})
    def test_stripe_api_key_with_whitespace(self):
        """Test that Stripe API key handles whitespace in environment variable."""
        # Re-import to pick up the environment variable with whitespace
        import importlib

        importlib.reload(commons)

        import stripe

        # Note: os.environ.get() preserves whitespace, which is the expected behavior
        assert stripe.api_key == "   sk_test_whitespace_123   "

    @patch.dict(
        os.environ,
        {"STRIPE_WEBHOOK_ENDPOINT_SECRET": "   whsec_test_whitespace_456   "},
    )
    def test_webhook_secret_with_whitespace(self):
        """Test that webhook secret handles whitespace in environment variable."""
        # Re-import to pick up the environment variable with whitespace
        import importlib

        importlib.reload(commons)

        from lib.stripe.commons import STRIPE_WEBHOOK_ENDPOINT_SECRET

        # Note: os.environ.get() preserves whitespace, which is the expected behavior
        assert STRIPE_WEBHOOK_ENDPOINT_SECRET == "   whsec_test_whitespace_456   "

    @patch.dict(
        os.environ,
        {
            "STRIPE_API_KEY": "valid_key",
            "STRIPE_WEBHOOK_ENDPOINT_SECRET": "valid_secret",
            "OTHER_UNRELATED_VAR": "should_not_affect_stripe",
        },
    )
    def test_configuration_ignores_unrelated_environment_variables(self):
        """Test that Stripe configuration only uses relevant environment variables."""
        # Re-import to pick up the environment variables
        import importlib

        importlib.reload(commons)

        import stripe
        from lib.stripe.commons import STRIPE_WEBHOOK_ENDPOINT_SECRET

        # Verify only relevant variables are used
        assert stripe.api_key == "valid_key"
        assert STRIPE_WEBHOOK_ENDPOINT_SECRET == "valid_secret"
        # Verify the module doesn't have any reference to unrelated variables
        assert not hasattr(commons, "OTHER_UNRELATED_VAR")

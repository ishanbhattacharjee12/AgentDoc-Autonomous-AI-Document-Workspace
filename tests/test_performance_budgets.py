import unittest
import logging
from unittest.mock import patch
from app import config
from app.llm import budget_guard
from app.llm.budget_guard import (
    PerformanceBudgetError,
    check_budget_pre_llm,
    check_budget_post_llm,
    check_budget_parser,
    check_budget_pdf,
    reset_budget_warnings,
    get_budget_warnings
)

class TestPerformanceBudgets(unittest.TestCase):
    
    def setUp(self):
        # Save original config parameters
        self.orig_debug = config.DEBUG
        self.orig_max_prompt = budget_guard.BUDGET_MAX_PROMPT_TOKENS
        self.orig_max_completion = budget_guard.BUDGET_MAX_COMPLETION_TOKENS
        self.orig_max_stage = budget_guard.BUDGET_MAX_STAGE_LATENCY
        self.orig_max_parser = budget_guard.BUDGET_MAX_PARSER_LATENCY
        self.orig_max_pdf = budget_guard.BUDGET_MAX_PDF_LATENCY
        reset_budget_warnings()

    def tearDown(self):
        # Restore original configurations
        config.DEBUG = self.orig_debug
        budget_guard.BUDGET_MAX_PROMPT_TOKENS = self.orig_max_prompt
        budget_guard.BUDGET_MAX_COMPLETION_TOKENS = self.orig_max_completion
        budget_guard.BUDGET_MAX_STAGE_LATENCY = self.orig_max_stage
        budget_guard.BUDGET_MAX_PARSER_LATENCY = self.orig_max_parser
        budget_guard.BUDGET_MAX_PDF_LATENCY = self.orig_max_pdf

    def test_completion_under_10_percent_overrun_warning(self):
        """Verify that under 10% overrun does NOT raise error in debug mode, but records a warning."""
        config.DEBUG = True
        budget_guard.BUDGET_MAX_COMPLETION_TOKENS = 5000
        
        # 5057 is 1.1% over 5000 (well within 10% grace limit)
        check_budget_post_llm(completion_tokens=5057, elapsed_time=1.0, model="test-model")
        
        warnings = get_budget_warnings()
        self.assertEqual(len(warnings), 1)
        self.assertIn("Warning: 1.1% over budget", warnings[0])
        self.assertIn("Completion Tokens: 5057", warnings[0])

    def test_completion_over_10_percent_overrun_raises_in_debug(self):
        """Verify that over 10% overrun DOES raise PerformanceBudgetError in debug mode."""
        config.DEBUG = True
        budget_guard.BUDGET_MAX_COMPLETION_TOKENS = 5000
        
        # 5600 is 12% over 5000 (exceeds 10% grace limit)
        with self.assertRaises(PerformanceBudgetError) as ctx:
            check_budget_post_llm(completion_tokens=5600, elapsed_time=1.0, model="test-model")
        self.assertIn("exceeding the budget limit of 5000 tokens by 12.0%", str(ctx.exception))

    def test_completion_over_10_percent_logs_warning_in_production(self):
        """Verify that over 10% overrun does NOT raise in production, but logs a warning."""
        config.DEBUG = False
        budget_guard.BUDGET_MAX_COMPLETION_TOKENS = 5000
        
        with patch('app.llm.budget_guard.logger.warning') as mock_warn:
            check_budget_post_llm(completion_tokens=5600, elapsed_time=1.0, model="test-model")
            mock_warn.assert_called_once()
            self.assertIn("grace limit exceeded", mock_warn.call_args[0][1])

    def test_prompt_under_10_percent_warning(self):
        """Verify prompt budget under 10% warning."""
        config.DEBUG = True
        budget_guard.BUDGET_MAX_PROMPT_TOKENS = 1000
        
        # 1050 tokens is 5% overrun
        system_prompt = "A" * 2100
        user_prompt = "B" * 2100
        # approx tokens = 4200 // 4 = 1050
        
        check_budget_pre_llm(system_prompt, user_prompt)
        warnings = get_budget_warnings()
        self.assertEqual(len(warnings), 1)
        self.assertIn("Warning: 5.0% over budget", warnings[0])

    def test_stage_latency_over_10_percent_raises_in_debug(self):
        """Verify stage latency over 10% raises in debug mode."""
        config.DEBUG = True
        budget_guard.BUDGET_MAX_STAGE_LATENCY = 10.0
        
        # 12.0 seconds is 20% overrun
        with self.assertRaises(PerformanceBudgetError):
            check_budget_post_llm(completion_tokens=100, elapsed_time=12.0, model="test-model")

    def test_parser_under_10_percent_warning(self):
        """Verify parser duration under 10% warning."""
        config.DEBUG = True
        budget_guard.BUDGET_MAX_PARSER_LATENCY = 5.0
        
        # 5.2 seconds is 4% overrun
        check_budget_parser(elapsed_time=5.2)
        warnings = get_budget_warnings()
        self.assertEqual(len(warnings), 1)
        self.assertIn("Warning: 4.0% over budget", warnings[0])

    def test_pdf_latency_over_10_percent_raises_in_debug(self):
        """Verify PDF export latency over 10% raises in debug mode."""
        config.DEBUG = True
        budget_guard.BUDGET_MAX_PDF_LATENCY = 10.0
        
        # 15.0 seconds is 50% overrun
        with self.assertRaises(PerformanceBudgetError):
            check_budget_pdf(elapsed_time=15.0, format_ext="pdf")

if __name__ == '__main__':
    unittest.main()

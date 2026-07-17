import unittest
from unittest.mock import patch, MagicMock
from app.models import TaskPlan, PlannerOutput
from app.agent.orchestrator import _execute_plan_downstream
from app.llm.budget_guard import PerformanceBudgetError

class TestRoutingLogic(unittest.TestCase):

    def setUp(self):
        # Create a mock high confidence plan
        self.high_conf_plan = PlannerOutput(
            goal="Test Goal",
            document_type="project_plan",
            confidence="High",
            tasks=[
                TaskPlan(id=1, task="Task 1", purpose="Purpose 1", tool="analysis")
            ]
        )
        
        # Create a mock low confidence plan
        self.low_conf_plan = PlannerOutput(
            goal="Test Goal",
            document_type="business_document",
            confidence="Low",
            tasks=[
                TaskPlan(id=1, task="Task 1", purpose="Purpose 1", tool="analysis")
            ]
        )
        
        self.mock_metrics = MagicMock()
        self.mock_metrics.to_dict.return_value = {}

    @patch('app.agent.orchestrator.run_standard_generation')
    def test_explicit_standard_mode_success(self, mock_standard):
        """Verify that explicit Standard Mode runs successfully when classification is High."""
        mock_standard.return_value = ([], "Draft Content")
        
        with patch('app.agent.orchestrator.reflect_and_revise') as mock_reflect, \
             patch('app.agent.orchestrator.generate_docx') as mock_docx:
             
            mock_reflect.return_value = (MagicMock(passed=True, issues_found=[], improvements=[]), "Final Draft")
            mock_docx.return_value = "doc.pdf"
            
            res = _execute_plan_downstream(
                plan=self.high_conf_plan,
                request="test request",
                format_req="pdf",
                mode="standard",
                progress_cb=None,
                metrics=self.mock_metrics
            )
            self.assertEqual(res.status, "completed")
            self.assertEqual(res.routing_outcome, "Standard Mode (Merged)")
            self.assertEqual(res.fallback_reason, "")

    def test_explicit_standard_mode_low_confidence_fails(self):
        """Verify that explicit Standard Mode fails loudly when classification is Low."""
        res = _execute_plan_downstream(
            plan=self.low_conf_plan,
            request="test request",
            format_req="pdf",
            mode="standard",
            progress_cb=None,
            metrics=self.mock_metrics
        )
        self.assertEqual(res.status, "failed")
        self.assertIn("Low confidence", res.error)

    @patch('app.agent.orchestrator.run_standard_generation')
    def test_explicit_standard_mode_execution_error_propagates(self, mock_standard):
        """Verify that standard mode execution errors propagate directly and do not trigger fallback."""
        mock_standard.side_effect = PerformanceBudgetError("Tokens exceeded limit of 5000")
        
        res = _execute_plan_downstream(
            plan=self.high_conf_plan,
            request="test request",
            format_req="pdf",
            mode="standard",
            progress_cb=None,
            metrics=self.mock_metrics
        )
        self.assertEqual(res.status, "failed")
        self.assertIn("PerformanceBudgetError", res.error)

    @patch('app.agent.orchestrator.execute_plan')
    @patch('app.agent.orchestrator.synthesize')
    def test_explicit_advanced_mode(self, mock_synthesis, mock_execute):
        """Verify that explicit Advanced Mode executes sequential orchestration directly."""
        mock_execute.return_value = []
        mock_synthesis.return_value = "Sequential Draft"
        
        with patch('app.agent.orchestrator.reflect_and_revise') as mock_reflect, \
             patch('app.agent.orchestrator.generate_docx') as mock_docx:
             
            mock_reflect.return_value = (MagicMock(passed=True, issues_found=[], improvements=[]), "Final Draft")
            mock_docx.return_value = "doc.pdf"
            
            res = _execute_plan_downstream(
                plan=self.high_conf_plan,
                request="test request",
                format_req="pdf",
                mode="advanced",
                progress_cb=None,
                metrics=self.mock_metrics
            )
            self.assertEqual(res.status, "completed")
            self.assertEqual(res.routing_outcome, "Advanced Mode (Sequential)")
            self.assertEqual(res.fallback_reason, "")

    @patch('app.agent.orchestrator.execute_plan')
    @patch('app.agent.orchestrator.synthesize')
    def test_adaptive_mode_low_confidence_fallback(self, mock_synthesis, mock_execute):
        """Verify that Adaptive Mode falls back to Advanced Mode when classification is Low."""
        mock_execute.return_value = []
        mock_synthesis.return_value = "Sequential Draft"
        
        with patch('app.agent.orchestrator.reflect_and_revise') as mock_reflect, \
             patch('app.agent.orchestrator.generate_docx') as mock_docx:
             
            mock_reflect.return_value = (MagicMock(passed=True, issues_found=[], improvements=[]), "Final Draft")
            mock_docx.return_value = "doc.pdf"
            
            res = _execute_plan_downstream(
                plan=self.low_conf_plan,
                request="test request",
                format_req="pdf",
                mode="adaptive",
                progress_cb=None,
                metrics=self.mock_metrics
            )
            self.assertEqual(res.status, "completed")
            self.assertEqual(res.routing_outcome, "Adaptive Mode (Fell back to Advanced)")
            self.assertEqual(res.fallback_reason, "Template classification is Low Confidence.")

    @patch('app.agent.orchestrator.run_standard_generation')
    @patch('app.agent.orchestrator.execute_plan')
    @patch('app.agent.orchestrator.synthesize')
    def test_adaptive_mode_error_fallback(self, mock_synthesis, mock_execute, mock_standard):
        """Verify that Adaptive Mode falls back to Advanced Mode when Standard Mode fails."""
        mock_standard.side_effect = PerformanceBudgetError("Tokens exceeded limit of 5000")
        mock_execute.return_value = []
        mock_synthesis.return_value = "Sequential Draft"
        
        with patch('app.agent.orchestrator.reflect_and_revise') as mock_reflect, \
             patch('app.agent.orchestrator.generate_docx') as mock_docx:
             
            mock_reflect.return_value = (MagicMock(passed=True, issues_found=[], improvements=[]), "Final Draft")
            mock_docx.return_value = "doc.pdf"
            
            res = _execute_plan_downstream(
                plan=self.high_conf_plan,
                request="test request",
                format_req="pdf",
                mode="adaptive",
                progress_cb=None,
                metrics=self.mock_metrics
            )
            self.assertEqual(res.status, "completed")
            self.assertEqual(res.routing_outcome, "Adaptive Mode (Fell back to Advanced)")
            self.assertIn("Standard Mode failed: PerformanceBudgetError", res.fallback_reason)

if __name__ == '__main__':
    unittest.main()

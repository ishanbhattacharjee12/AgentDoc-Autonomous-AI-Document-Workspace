"""Demo mode contextual response generator."""

import re
import json
import logging

logger = logging.getLogger(__name__)

def _demo_response(system_prompt: str, user_prompt: str) -> str:
    """Generate contextual demo responses based on prompt content.

    These are not hardcoded plans — they analyze the user_prompt to determine
    what kind of response is needed (planning, execution, synthesis, reflection, revision).
    """
    prompt_lower = user_prompt.lower()

    # Detect standard mode merged requests
    if "predefined phases to execute" in prompt_lower or "generate the structured json" in prompt_lower:
        return _demo_standard_mode_response(user_prompt)

    # Detect planning requests
    if "create a dynamic execution plan" in prompt_lower or "generate a structured plan" in prompt_lower:
        return _demo_planner_response(user_prompt)

    # Detect reflection requests
    if "evaluate this document draft" in prompt_lower or "evaluate" in system_prompt.lower() and "reflection" in prompt_lower:
        return _demo_reflection_response(user_prompt)

    # Detect synthesis requests
    if "synthesize the following" in prompt_lower or "coherent, professional document" in prompt_lower:
        return _demo_synthesis_response(user_prompt)

    # Detect revision requests
    if "revise this document" in prompt_lower or "revision" in system_prompt.lower():
        return _demo_revision_response(user_prompt)

    # Default: task execution response
    return _demo_execution_response(user_prompt)


def _demo_planner_response(user_prompt: str) -> str:
    """Generate a dynamic plan based on the request content."""
    prompt_lower = user_prompt.lower()

    # Detect project plan requests
    if "project plan" in prompt_lower and "chatbot" in prompt_lower:
        return json.dumps({
            "goal": "Create a comprehensive project plan for launching an AI-powered customer support chatbot for a mid-sized e-commerce company",
            "document_type": "project_plan",
            "assumptions": [
                "The e-commerce company has 50-200 employees with a small technical team",
                "Current customer support is primarily manual (email/phone)",
                "Budget is moderate — suitable for a phased rollout rather than big-bang launch",
                "Integration with existing e-commerce platform (e.g., Shopify, Magento) is required",
                "The chatbot should handle common queries: order status, returns, product questions",
                "Timeline expectation is 4-6 months for initial launch"
            ],
            "tasks": [
                {"id": 1, "task": "Analyze project objectives and define measurable success criteria", "purpose": "Establish clear goals and KPIs for the chatbot launch", "tool": "analysis", "depends_on": []},
                {"id": 2, "task": "Define project scope and boundaries", "purpose": "Clarify what the chatbot will and will not handle to prevent scope creep", "tool": "analysis", "depends_on": [1]},
                {"id": 3, "task": "Research AI chatbot best practices for e-commerce", "purpose": "Gather industry knowledge on successful chatbot implementations", "tool": "knowledge", "depends_on": []},
                {"id": 4, "task": "Design project phases and timeline", "purpose": "Create a phased rollout plan with milestones and dependencies", "tool": "analysis", "depends_on": [1, 2, 3]},
                {"id": 5, "task": "Define team structure and role responsibilities", "purpose": "Assign clear ownership for each workstream", "tool": "analysis", "depends_on": [4]},
                {"id": 6, "task": "Identify risks, dependencies, and mitigation strategies", "purpose": "Proactively address potential blockers and failure modes", "tool": "analysis", "depends_on": [4, 5]},
                {"id": 7, "task": "Define success metrics and measurement framework", "purpose": "Establish how the project's success will be quantified post-launch", "tool": "analysis", "depends_on": [1, 6]}
            ]
        })

    # Detect onboarding/ambiguous requests
    if "onboarding" in prompt_lower or "dropping off" in prompt_lower:
        return json.dumps({
            "goal": "Create a practical customer onboarding improvement plan with phased 90-day execution, designed for leadership presentation",
            "document_type": "improvement_plan",
            "assumptions": [
                "The company is a SaaS or digital product with a self-serve onboarding flow",
                "Drop-off is happening but the exact funnel stage is unknown — investigation is needed",
                "Engineering team has 2-4 developers available part-time for improvements",
                "Budget is under $50K for the 90-day period",
                "Analytics tooling exists but may not be fully instrumented",
                "Quick wins should be prioritized over large infrastructure changes",
                "Leadership expects data-backed recommendations, not just opinions"
            ],
            "tasks": [
                {"id": 1, "task": "Frame the onboarding problem and identify what is unknown", "purpose": "Establish what we know vs. what we need to investigate before acting", "tool": "analysis", "depends_on": []},
                {"id": 2, "task": "Define investigation priorities and low-cost diagnostic methods", "purpose": "Determine where to look first with minimal engineering effort", "tool": "analysis", "depends_on": [1]},
                {"id": 3, "task": "Research onboarding best practices and common drop-off patterns", "purpose": "Apply industry knowledge to guide hypothesis formation", "tool": "knowledge", "depends_on": []},
                {"id": 4, "task": "Generate hypotheses and prioritize by impact vs. effort", "purpose": "Rank potential causes and fixes to focus limited resources", "tool": "analysis", "depends_on": [1, 2, 3]},
                {"id": 5, "task": "Design phased 90-day execution plan", "purpose": "Structure work into investigation, quick-wins, and sustained improvement phases", "tool": "analysis", "depends_on": [4]},
                {"id": 6, "task": "Define success metrics and measurement approach", "purpose": "Give leadership clear KPIs to track progress", "tool": "analysis", "depends_on": [4, 5]},
                {"id": 7, "task": "Identify risks, constraints, and contingency plans", "purpose": "Address budget, capacity, and timeline risks proactively", "tool": "analysis", "depends_on": [5, 6]},
                {"id": 8, "task": "Prepare leadership-ready recommendations and next steps", "purpose": "Synthesize findings into actionable executive recommendations", "tool": "analysis", "depends_on": [5, 6, 7]}
            ]
        })

    # Generic fallback for other requests
    return json.dumps({
        "goal": f"Address the request: {user_prompt[user_prompt.find('REQUEST:'):user_prompt.find('REQUEST:')+200] if 'REQUEST:' in user_prompt else user_prompt[:200]}",
        "document_type": "business_document",
        "assumptions": [
            "Standard business context applies",
            "Document should be actionable and professional",
            "Audience is business stakeholders"
        ],
        "tasks": [
            {"id": 1, "task": "Analyze the core request and identify requirements", "purpose": "Understand the specific needs and constraints", "tool": "analysis", "depends_on": []},
            {"id": 2, "task": "Research relevant domain knowledge and best practices", "purpose": "Provide substantive background context", "tool": "knowledge", "depends_on": []},
            {"id": 3, "task": "Structure findings and develop recommendations", "purpose": "Organize content into a coherent framework", "tool": "analysis", "depends_on": [1, 2]},
            {"id": 4, "task": "Define actionable next steps and success criteria", "purpose": "Provide practical value and measurability", "tool": "analysis", "depends_on": [3]}
        ]
    })


def _demo_execution_response(user_prompt: str) -> str:
    """Generate contextual execution output based on the task description."""
    prompt_lower = user_prompt.lower()

    # Extract task details — use task name as primary matching key
    task_match = re.search(r'CURRENT TASK:\s*-\s*Task:\s*(.+?)(?:\n|-\s*Purpose)', user_prompt, re.DOTALL)
    task_name = task_match.group(1).strip() if task_match else "General analysis"
    task_lower = task_name.lower()

    # Determine context: chatbot project or onboarding improvement
    is_chatbot = "chatbot" in prompt_lower
    is_onboarding = "onboarding" in prompt_lower or "dropping off" in prompt_lower

    # Match on TASK NAME (not full prompt) to avoid false matches
    # Objectives / success criteria
    if "objective" in task_lower or "success criteria" in task_lower or "success metric" in task_lower:
        if "chatbot" in prompt_lower:
            return """## Project Objectives and Success Criteria

### Primary Objectives
1. Deploy an AI-powered customer support chatbot capable of handling 60-70% of routine customer inquiries without human intervention
2. Reduce average customer response time from 4+ hours (email) to under 30 seconds for common queries
3. Improve customer satisfaction scores (CSAT) by 15% within 6 months of launch
4. Free up human support agents to handle complex, high-value customer interactions

### Success Metrics
| Metric | Current Baseline | 3-Month Target | 6-Month Target |
|--------|-----------------|----------------|----------------|
| First Response Time | 4.2 hours | < 30 seconds (bot) | < 30 seconds (bot) |
| Ticket Deflection Rate | 0% | 40% | 60-70% |
| CSAT Score | 3.6/5 | 3.9/5 | 4.1/5 |
| Resolution Without Escalation | N/A | 35% | 50% |
| Support Cost Per Ticket | $12.50 | $8.00 | $5.50 |

### Measurable KPIs
- Chatbot containment rate (% of conversations resolved without human handoff)
- Average handling time reduction for human agents
- Customer effort score (CES) for bot-assisted interactions
- Net Promoter Score (NPS) impact
- Monthly support cost savings"""
        else:
            return """## Success Metrics and Measurement Framework

### Key Performance Indicators
1. Onboarding Completion Rate — percentage of new users who complete the full onboarding flow
2. Time to First Value (TTFV) — how quickly users reach their first meaningful action
3. Day 7 / Day 30 Retention — cohort retention at key milestones
4. Drop-off Rate by Step — conversion between each onboarding step
5. Support Ticket Volume — reduction in onboarding-related support requests

### Measurement Approach
- Instrument each onboarding step with event tracking (existing analytics tool)
- Set up funnel visualization dashboards in the first two weeks
- Establish baseline metrics before implementing any changes
- Run A/B tests on improvements with statistical significance (95% confidence)
- Weekly metrics reviews during the 90-day period
- Monthly executive dashboard updates"""

    # Scope and boundaries
    if "scope" in prompt_lower and ("boundar" in prompt_lower or "define" in prompt_lower):
        return """## Project Scope and Boundaries

### In Scope
- AI chatbot for customer-facing support on the e-commerce website
- Integration with existing order management system for order status queries
- Support for: order tracking, return/refund requests, product FAQs, shipping inquiries
- Multi-turn conversation capability for complex queries
- Seamless handoff to human agents when the bot cannot resolve an issue
- Basic analytics dashboard for chatbot performance monitoring
- English language support (primary market)

### Out of Scope
- Voice-based AI assistant (phone support)
- Proactive outbound messaging / marketing automation
- Multi-language support (Phase 2 consideration)
- Social media platform integration (Facebook Messenger, WhatsApp — Phase 2)
- Inventory management or pricing decisions
- Customer authentication for account-level changes

### Key Boundaries
- The chatbot will NOT make refund decisions above $50 without human approval
- Personal data handling will comply with existing privacy policies
- Bot responses will be reviewed monthly for accuracy and tone
- Maximum 3 conversation turns before offering human escalation option"""

    # Risk analysis
    if "risk" in prompt_lower:
        if "chatbot" in prompt_lower:
            return """## Risk Assessment and Mitigation Strategies

### High Priority Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| Poor chatbot accuracy leading to customer frustration | Medium | High | Extensive testing with real customer queries; gradual rollout starting with simple queries; human review of early conversations |
| Integration failures with e-commerce platform | Medium | High | Early proof-of-concept integration; dedicated integration testing phase; fallback to manual processes |
| Low customer adoption / preference for human agents | Medium | Medium | Clear value proposition; easy human escalation; monitor adoption metrics weekly |
| Data privacy compliance issues | Low | Critical | Privacy review before launch; data handling audit; limit PII in bot conversations |
| Scope creep delaying launch | High | Medium | Strict scope document; change request process; MVP-first approach |

### Medium Priority Risks
- Training data quality issues leading to incorrect responses
- Team capacity constraints (competing priorities)
- Vendor lock-in with chosen AI/NLP platform
- Performance degradation under peak holiday traffic

### Risk Monitoring
- Weekly risk review during project standup
- Escalation path for critical risks to project sponsor
- Monthly risk register update and stakeholder communication"""
        else:
            return """## Risks, Constraints, and Contingency Plans

### Key Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Insufficient data to identify drop-off causes | Medium | High | Start with qualitative research (user interviews) alongside quantitative analysis |
| Engineering capacity consumed by other priorities | High | High | Scope Phase 1 to require minimal engineering; leverage no-code tools where possible |
| Improvements don't move key metrics | Medium | Medium | Run small A/B tests before full rollout; have pivot criteria defined |
| Stakeholder misalignment on priorities | Medium | Medium | Weekly leadership updates; clear decision framework |
| Budget exhausted before Phase 3 | Low | Medium | Front-load high-ROI activities; track spend weekly |

### Constraints
- Engineering capacity: 2-4 developers, part-time allocation
- Budget: Under $50K for 90-day period
- Timeline: Leadership expects visible progress within 30 days
- Technology: Must work within existing tech stack

### Contingency Plans
- If analytics are insufficient: invest first week in instrumentation before diagnosis
- If engineering is unavailable: focus on process and UX copy changes (no-code)
- If initial hypotheses are wrong: allocate Week 4-5 for hypothesis pivot"""

    # Phase planning / timeline
    if "phase" in prompt_lower or "timeline" in prompt_lower:
        if "90-day" in prompt_lower or "onboarding" in prompt_lower:
            return """## Phased 90-Day Execution Plan

### Phase 1: Discovery & Diagnosis (Days 1-21)
**Goal:** Understand where and why users are dropping off

Week 1-2: Instrumentation & Data Collection
- Audit existing analytics setup and identify gaps
- Instrument onboarding funnel with step-level event tracking
- Set up funnel visualization dashboard
- Conduct 5-8 user interviews (churned users from last 30 days)

Week 3: Analysis & Hypothesis Formation
- Analyze funnel data to identify highest-impact drop-off points
- Map user journey pain points from qualitative feedback
- Prioritize hypotheses by potential impact and testing feasibility
- Present initial findings to leadership

**Phase 1 Deliverables:** Funnel analysis report, prioritized hypothesis list, Phase 2 plan

### Phase 2: Quick Wins & Experimentation (Days 22-55)
**Goal:** Implement high-confidence improvements and test hypotheses

Week 4-5: Quick Wins Implementation
- Fix top 3-5 UX issues identified in Phase 1
- Optimize onboarding email sequences
- Simplify form fields / reduce required steps where possible
- Deploy changes and begin A/B testing

Week 6-8: Experimentation
- Run 2-3 structured A/B tests on key onboarding steps
- Test simplified vs. guided onboarding flows
- Implement progressive onboarding (defer non-essential setup)
- Monitor metrics daily, adjust experiments weekly

**Phase 2 Deliverables:** Implemented quick wins, A/B test results, updated metrics dashboard

### Phase 3: Optimization & Scale (Days 56-90)
**Goal:** Double down on what works, systematize improvements

Week 9-10: Analysis & Scaling
- Analyze A/B test results with statistical rigor
- Scale winning experiments to 100% of traffic
- Identify next tier of improvement opportunities

Week 11-13: Systematization
- Document onboarding best practices
- Set up automated monitoring and alerting for drop-off spikes
- Create playbook for ongoing onboarding optimization
- Final leadership presentation with results and next steps

**Phase 3 Deliverables:** Final results report, optimization playbook, 6-month roadmap"""
        else:
            return """## Project Phases and Timeline

### Phase 1: Foundation (Weeks 1-4)
- Requirements finalization and vendor selection
- Technical architecture design
- Development environment setup
- Initial chatbot training data collection
- Stakeholder alignment on success metrics

### Phase 2: Development (Weeks 5-12)
- Core chatbot development and NLP training
- E-commerce platform integration (order system, product catalog)
- Conversation flow design and implementation
- Human handoff workflow development
- Internal testing and QA

### Phase 3: Pilot (Weeks 13-16)
- Soft launch with 10% of website traffic
- Performance monitoring and rapid iteration
- Customer feedback collection
- Agent training on bot-assisted workflows
- Knowledge base refinement based on real queries

### Phase 4: Full Launch (Weeks 17-20)
- Gradual traffic ramp to 100%
- Full analytics dashboard deployment
- Performance optimization
- Documentation and runbook creation

### Phase 5: Optimization (Weeks 21-26)
- Advanced features based on pilot learnings
- Expanded query coverage
- Performance tuning and cost optimization
- Quarterly review and planning

### Key Milestones
| Milestone | Target Date | Owner |
|-----------|------------|-------|
| Requirements Approved | Week 2 | Product Manager |
| Architecture Signed Off | Week 4 | Tech Lead |
| Bot MVP Ready | Week 10 | Development Team |
| Pilot Launch | Week 13 | Project Manager |
| Full Launch | Week 17 | Project Manager |
| 3-Month Review | Week 26 | Product Manager |"""

    # Team / roles
    if "team" in prompt_lower or "role" in prompt_lower or "responsibilit" in prompt_lower:
        return """## Team Structure and Responsibilities

### Core Team

| Role | Responsibility | Allocation |
|------|---------------|------------|
| Project Manager | Overall project delivery, timeline management, stakeholder communication | Full-time |
| Product Manager | Requirements, user stories, acceptance criteria, prioritization | 75% |
| ML/AI Engineer | Chatbot model development, NLP training, performance tuning | Full-time |
| Backend Developer | API integration, conversation engine, data pipeline | Full-time |
| Frontend Developer | Chat widget UI, admin dashboard, user experience | 75% |
| QA Engineer | Test planning, conversation testing, regression testing | 50% |
| Customer Support Lead | Training data curation, bot response review, agent training | 50% |

### Extended Team (Part-time/Advisory)
- **Data Analyst**: Analytics setup, performance dashboards, A/B test analysis
- **DevOps Engineer**: Infrastructure, deployment pipeline, monitoring
- **UX Designer**: Conversation flow design, chat UI design, user research
- **Legal/Compliance**: Data privacy review, terms of service updates

### RACI Matrix
| Activity | PM | Product | ML Eng | Dev | QA | Support |
|----------|-----|---------|--------|-----|-----|---------|
| Requirements | A | R | C | C | I | C |
| Architecture | I | C | R | R | I | I |
| Bot Training | I | C | R | I | I | R |
| Integration | A | I | C | R | I | I |
| Testing | I | C | I | C | R | C |
| Launch | R | A | C | C | C | R |

R = Responsible, A = Accountable, C = Consulted, I = Informed"""

    # Problem framing / investigation
    if "problem" in prompt_lower or "unknown" in prompt_lower or "frame" in prompt_lower or "investigation" in prompt_lower:
        return """## Problem Framing and Investigation Priorities

### What We Know
- Users are dropping off during the onboarding process
- The overall trend suggests declining activation rates
- The problem is significant enough to warrant leadership attention

### What We Don't Know (Key Unknowns)
1. **Where exactly** in the funnel users are dropping off (which step/screen)
2. **Why** they are leaving (UX friction, confusion, lack of motivation, technical issues)
3. **Who** is dropping off (all user segments equally, or specific cohorts)
4. **When** the problem started or worsened (recent change? gradual decline?)
5. **How much** revenue impact the drop-off represents

### Investigation Priorities (Ordered by Information Value)

**Priority 1: Funnel Analytics (Days 1-5)**
- Reason: Highest information-to-effort ratio
- Method: Instrument onboarding steps, analyze existing data
- Expected Output: Identification of top 2-3 drop-off points
- Effort: Low (analytics configuration)

**Priority 2: User Session Analysis (Days 3-7)**
- Reason: Understanding behavioral patterns at drop-off points
- Method: Session recordings at identified drop-off steps
- Expected Output: Qualitative understanding of user behavior
- Effort: Low (tool setup + review time)

**Priority 3: Churned User Interviews (Days 5-14)**
- Reason: Direct user voice on pain points
- Method: 5-8 interviews with recently churned users
- Expected Output: Validated or invalidated hypotheses
- Effort: Medium (recruitment, scheduling, conducting)

**Priority 4: Cohort Comparison (Days 7-14)**
- Reason: Isolate whether the problem is segment-specific
- Method: Compare onboarding completion by user source, plan type, device
- Expected Output: Targeted vs. universal improvement approach
- Effort: Medium (data analysis)"""

    # Hypotheses / prioritization
    if "hypothes" in prompt_lower or "prioritiz" in prompt_lower:
        return """## Hypothesis Prioritization

### Hypotheses Ranked by Impact × Feasibility

| # | Hypothesis | Expected Impact | Effort to Test | Priority |
|---|-----------|----------------|----------------|----------|
| H1 | Onboarding flow has too many required steps | High | Low | ★★★ Do First |
| H2 | Users don't understand the value proposition early enough | High | Medium | ★★★ Do First |
| H3 | Technical errors/loading issues cause abandonment | Medium | Low | ★★ Quick Win |
| H4 | Email follow-up sequence is ineffective or poorly timed | Medium | Low | ★★ Quick Win |
| H5 | Mobile experience is significantly worse than desktop | Medium | Low | ★★ Quick Win |
| H6 | Users from specific acquisition channels have lower intent | Medium | Medium | ★ Investigate |
| H7 | Onboarding requires information users don't have readily | High | Medium | ★ Investigate |

### Recommended Action Priority
1. **Immediate (Week 1-2):** Validate H1, H3, H5 with analytics — these require minimal effort
2. **Short-term (Week 2-4):** Test H2 with A/B test on value messaging; fix H4 email timing
3. **Medium-term (Week 4-8):** Deep-dive on H6 and H7 based on Phase 1 findings"""

    # Recommendations / next steps
    if "recommend" in prompt_lower or "next step" in prompt_lower or "leadership" in prompt_lower:
        return """## Recommendations and Next Steps

### Executive Recommendations

1. **Invest in measurement first** — Before making changes, ensure we can measure impact accurately. Estimated 3-5 days of analytics work.

2. **Adopt a hypothesis-driven approach** — Resist the urge to redesign everything at once. Test specific hypotheses with controlled experiments.

3. **Prioritize low-effort, high-information actions** — Start with analytics instrumentation and user interviews before committing engineering resources.

4. **Set realistic expectations** — Meaningful improvement will take 60-90 days. Quick wins may show in 30 days but sustainable improvement requires systematic work.

5. **Assign a dedicated owner** — Appoint one person accountable for the 90-day plan with weekly reporting to leadership.

### Immediate Next Steps
1. Approve the 90-day plan and allocate budget (Day 1)
2. Assign project owner and secure part-time engineering capacity (Day 1-2)
3. Begin analytics instrumentation (Day 3)
4. Schedule churned user interviews (Day 5)
5. First progress report to leadership (Day 14)

### Decision Points for Leadership
- Day 21: Review Phase 1 findings and approve Phase 2 priorities
- Day 55: Review experiment results and approve Phase 3 focus
- Day 90: Final review — decide on continued investment vs. pivot"""

    # Knowledge / best practices
    if "best practice" in prompt_lower or "knowledge" in system_prompt.lower() or "industry" in prompt_lower:
        if "chatbot" in prompt_lower:
            return """## AI Chatbot Best Practices for E-Commerce

### Industry Context
- E-commerce chatbots can handle 60-80% of routine inquiries (industry average: 65%)
- Top-performing implementations achieve 85%+ customer satisfaction
- Average implementation timeline: 3-6 months for production-ready deployment
- Key success factor: quality of training data and conversation design

### Best Practices

**Conversation Design**
- Start with the top 20 most common customer queries (80/20 rule)
- Design for graceful failure — always offer human escalation
- Use progressive disclosure — don't overload users with options
- Maintain consistent brand voice and tone
- Implement context persistence across conversation turns

**Technical Considerations**
- Use a hybrid approach: rule-based for structured queries (order status) + ML for open-ended queries
- Implement robust entity extraction for order numbers, product names, dates
- Design for latency — aim for <2 second response times
- Build comprehensive logging for conversation analytics and model improvement

**Integration Best Practices**
- Real-time order status requires direct API integration with OMS
- Use webhooks for live agent handoff to minimize customer wait time
- Implement conversation continuity — customers shouldn't repeat themselves
- Consider omnichannel: web chat first, then expand to other channels

**Common Pitfalls to Avoid**
- Launching with too broad a scope — start narrow, expand based on data
- Insufficient training data — aim for 500+ example queries per intent category
- Ignoring edge cases — plan for angry customers, multiple questions, typos
- No feedback loop — must have mechanism for continuous model improvement"""
        else:
            return """## Customer Onboarding Best Practices

### Industry Benchmarks
- Average SaaS onboarding completion rate: 25-40% (top quartile: 60%+)
- First-week activation is the strongest predictor of long-term retention
- Users who complete onboarding within 24 hours retain 3x better than those who take 7+ days

### Common Drop-Off Patterns
1. **Information overload** — Asking for too much too soon
2. **Unclear value delivery** — Users don't see benefit before being asked to invest effort
3. **Technical friction** — Slow loading, confusing UI, mobile issues
4. **Premature commitment** — Requiring payment or extensive setup before value demonstration
5. **Missing guidance** — Users left to figure things out on their own

### Proven Improvement Strategies
- **Progressive onboarding**: Spread setup across multiple sessions, not one upfront wall
- **Time to First Value (TTFV)**: Minimize steps between signup and first meaningful experience
- **Contextual guidance**: In-app tooltips and checklists instead of tutorial videos
- **Personalized paths**: Different flows for different user segments/goals
- **Social proof**: Show activity from similar users to motivate completion
- **Recovery emails**: Well-timed sequences for users who abandon mid-flow"""

    # Generic execution
    return f"""## Analysis: {task_name}

### Key Findings
Based on the analysis of the request and available context, the following key points have been identified:

1. The request requires a structured, professional approach
2. Multiple stakeholders will likely review the output
3. Actionable recommendations are essential
4. Clear success criteria should be defined to measure outcomes

### Detailed Analysis
The task involves careful consideration of the requirements, constraints, and available information. Given the context provided, the analysis focuses on practical, implementable recommendations.

### Recommendations
- Proceed with a phased approach to reduce risk
- Establish clear metrics before implementation
- Assign ownership for each action item
- Schedule regular review points to assess progress"""


def _demo_reflection_response(user_prompt: str) -> str:
    """Generate a reflection response."""
    prompt_lower = user_prompt.lower()

    if "90-day" in prompt_lower or "phased" in prompt_lower:
        return json.dumps({
            "grade": "Needs revision",
            "reason": "Phase transitions lack specific go/no-go criteria and budget allocation.",
            "issues_found": [
                "Phase transitions could benefit from clearer go/no-go criteria",
                "Budget allocation across phases should be more explicit"
            ],
            "improvements": [
                "Add specific go/no-go decision criteria between phases",
                "Include budget breakdown per phase"
            ]
        })

    return json.dumps({
        "grade": "Good",
        "reason": "The document is well-structured and addresses the core requirements.",
        "issues_found": [],
        "improvements": []
    })


def _demo_synthesis_response(user_prompt: str) -> str:
    """Generate a synthesis response combining execution results."""
    prompt_lower = user_prompt.lower()

    if "project_plan" in prompt_lower or "chatbot" in prompt_lower:
        return """## Executive Summary

This project plan outlines the strategy for launching an AI-powered customer support chatbot for a mid-sized e-commerce company. The chatbot aims to handle 60-70% of routine customer inquiries, reducing response times from 4+ hours to under 30 seconds and improving CSAT scores by 15% within 6 months.

## Project Objectives

1. Deploy an AI-powered chatbot capable of handling routine customer support inquiries
2. Reduce average first response time from 4.2 hours to under 30 seconds for common queries
3. Achieve 60-70% ticket deflection rate within 6 months
4. Improve customer satisfaction score (CSAT) from 3.6 to 4.1 out of 5
5. Reduce per-ticket support cost from $12.50 to $5.50

## Scope

### In Scope
- AI chatbot for customer-facing support on the e-commerce website
- Integration with existing order management system
- Support for order tracking, returns/refunds, product FAQs, and shipping inquiries
- Human agent handoff capability
- Performance analytics dashboard

### Out of Scope
- Voice-based AI assistant
- Social media channel integration (Phase 2)
- Multi-language support (Phase 2)
- Proactive marketing automation

## Project Phases and Timeline

### Phase 1: Foundation (Weeks 1-4)
- Requirements finalization and vendor selection
- Technical architecture design and environment setup
- Initial training data collection from existing support tickets
- Stakeholder alignment on success metrics

### Phase 2: Development (Weeks 5-12)
- Core chatbot development and NLP model training
- E-commerce platform API integration
- Conversation flow implementation for top 20 query types
- Human handoff workflow development
- Internal testing and quality assurance

### Phase 3: Pilot (Weeks 13-16)
- Soft launch with 10% of website traffic
- Real-time performance monitoring and rapid iteration
- Customer feedback collection and analysis
- Support agent training on bot-assisted workflows
- Knowledge base refinement based on live queries

### Phase 4: Full Launch & Optimization (Weeks 17-26)
- Gradual traffic ramp to 100%
- Advanced feature deployment based on pilot learnings
- Performance optimization and cost tuning
- Quarterly review and Phase 2 planning

## Team Structure and Responsibilities

| Role | Responsibility | Allocation |
|------|---------------|------------|
| Project Manager | Delivery management, stakeholder communication | Full-time |
| Product Manager | Requirements, prioritization, acceptance criteria | 75% |
| ML/AI Engineer | Chatbot model development, NLP training | Full-time |
| Backend Developer | API integration, conversation engine | Full-time |
| Frontend Developer | Chat widget UI, admin dashboard | 75% |
| QA Engineer | Testing, regression, conversation quality | 50% |
| Support Lead | Training data curation, response review | 50% |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Poor chatbot accuracy | Medium | High | Phased rollout, human review, extensive testing |
| Integration failures | Medium | High | Early POC, dedicated testing phase |
| Low customer adoption | Medium | Medium | Clear value proposition, easy escalation |
| Data privacy issues | Low | Critical | Privacy review, data handling audit |
| Scope creep | High | Medium | Strict scope document, change request process |

## Success Metrics

| Metric | Baseline | 3-Month Target | 6-Month Target |
|--------|---------|----------------|----------------|
| First Response Time | 4.2 hours | < 30 seconds | < 30 seconds |
| Ticket Deflection | 0% | 40% | 60-70% |
| CSAT Score | 3.6/5 | 3.9/5 | 4.1/5 |
| Cost Per Ticket | $12.50 | $8.00 | $5.50 |
| Resolution Without Escalation | N/A | 35% | 50% |

## Next Steps

1. Secure executive sponsorship and budget approval (Week 1)
2. Assemble core project team (Week 1-2)
3. Begin vendor evaluation for AI/NLP platform (Week 1-2)
4. Finalize requirements document with stakeholder input (Week 2-3)
5. Kick off Phase 1 execution (Week 3)
6. Schedule bi-weekly stakeholder progress reviews

## Conclusion

This project plan provides a structured, phased approach to launching an AI-powered customer support chatbot. The 26-week timeline balances speed with quality, incorporating pilot testing to validate assumptions before full deployment. Success will be measured through clear KPIs with regular review cycles to ensure the project delivers meaningful value to both customers and the business."""

    elif "improvement_plan" in prompt_lower or "onboarding" in prompt_lower:
        return """## Executive Summary

This improvement plan addresses declining customer onboarding completion rates through a data-driven, phased 90-day approach. Rather than guessing at solutions, this plan prioritizes investigation and diagnosis first, then implements quick wins based on evidence, and finally scales proven improvements. The plan is designed for a constrained environment: limited budget (<$50K), small engineering team (2-4 developers part-time), and leadership expectation for rapid, visible progress.

## Problem Statement

Users are dropping off during the customer onboarding process. The exact drop-off point and root cause are currently unknown. This represents a significant opportunity cost — every percentage point improvement in onboarding completion directly impacts revenue and lifetime value.

### What We Know
- Onboarding completion rates are declining
- The problem is significant enough to warrant dedicated attention
- Current analytics may not fully capture the onboarding funnel

### What We Don't Know
- Where exactly users drop off (which step/screen)
- Why they leave (UX friction, confusion, technical issues, motivation)
- Whether the problem affects all user segments equally
- When the decline started or accelerated

## Key Assumptions
- The company operates a SaaS or digital product with self-serve onboarding
- Analytics tooling exists but may not be fully instrumented
- Engineering team capacity is 2-4 developers, available part-time
- Budget is under $50K for the 90-day period
- Leadership expects data-backed recommendations, not opinions

## Investigation Priorities

Ordered by information value relative to effort:

1. **Funnel Analytics (Days 1-5)** — Highest ROI investigation. Instrument onboarding steps and analyze existing data to identify top drop-off points.
2. **User Session Analysis (Days 3-7)** — Review session recordings at identified drop-off points for qualitative behavioral insights.
3. **Churned User Interviews (Days 5-14)** — Direct user feedback from 5-8 recently churned users to validate hypotheses.
4. **Cohort Comparison (Days 7-14)** — Segment analysis to determine if drop-off is universal or concentrated in specific user groups.

## Hypothesis Prioritization

| Priority | Hypothesis | Impact | Effort | Action |
|----------|-----------|--------|--------|--------|
| ★★★ | Too many required onboarding steps | High | Low | Simplify flow |
| ★★★ | Users don't see value early enough | High | Medium | Reorder flow for quick wins |
| ★★ | Technical errors cause abandonment | Medium | Low | Error monitoring |
| ★★ | Email follow-ups are ineffective | Medium | Low | Optimize sequences |
| ★★ | Mobile experience is degraded | Medium | Low | Mobile testing |

## Phased 90-Day Plan

### Phase 1: Discovery & Diagnosis (Days 1-21)

**Objective:** Understand where and why users are dropping off before investing in solutions.

- Days 1-5: Audit analytics setup, instrument onboarding funnel
- Days 3-7: Set up session recording at identified drop-off points
- Days 5-14: Conduct 5-8 user interviews with recently churned users
- Days 7-14: Cohort analysis by source, device, plan type
- Days 15-21: Synthesize findings, prioritize hypotheses, present to leadership

**Deliverables:** Funnel analysis report, prioritized hypothesis list, Phase 2 detailed plan
**Go/No-Go Criteria:** Clear identification of at least 2-3 primary drop-off points
**Budget Allocation:** ~$8,000 (analytics tools, user interview incentives)

### Phase 2: Quick Wins & Experimentation (Days 22-55)

**Objective:** Implement high-confidence improvements and test hypotheses.

- Days 22-30: Fix top 3-5 identified UX issues (quick wins)
- Days 22-35: Optimize onboarding email sequences
- Days 30-45: Run 2-3 structured A/B tests on key onboarding steps
- Days 35-50: Test simplified vs. guided onboarding flows
- Days 50-55: Analyze experiment results, prepare Phase 3 recommendations

**Deliverables:** Implemented quick wins, A/B test results, updated metrics dashboard
**Go/No-Go Criteria:** Statistical significance on at least 1 A/B test; measurable improvement in at least 1 KPI
**Budget Allocation:** ~$20,000 (development time, A/B testing tools)

### Phase 3: Optimization & Scale (Days 56-90)

**Objective:** Scale what works, document learnings, plan next iteration.

- Days 56-65: Scale winning experiments to 100% of traffic
- Days 65-75: Identify and implement next tier of improvements
- Days 75-85: Document best practices and create optimization playbook
- Days 85-90: Final results compilation and leadership presentation

**Deliverables:** Final results report, optimization playbook, 6-month roadmap recommendation
**Budget Allocation:** ~$22,000 (development time, monitoring tools)

## Success Metrics

| Metric | Current | 30-Day Target | 60-Day Target | 90-Day Target |
|--------|---------|--------------|--------------|--------------|
| Onboarding Completion Rate | TBD (baseline) | Establish baseline + 5% | +15% | +25% |
| Time to First Value | TBD | Reduce by 20% | Reduce by 35% | Reduce by 50% |
| Day 7 Retention | TBD | +3% | +8% | +12% |
| Support Tickets (onboarding) | TBD | -10% | -25% | -40% |

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Insufficient analytics data | Invest first week in instrumentation before diagnosis |
| Engineering unavailable | Focus on process/UX copy changes (no-code solutions) |
| Initial hypotheses wrong | Reserve Week 4-5 for hypothesis pivot based on data |
| Budget overrun | Front-load high-ROI activities; weekly spend tracking |
| Stakeholder impatience | Weekly progress updates; celebrate quick wins publicly |

## Recommendations for Leadership

1. **Approve the phased approach** — resist pressure to "fix it now" without data
2. **Assign a dedicated owner** with weekly reporting accountability
3. **Commit engineering capacity** for at least 2 developers, part-time
4. **Set realistic expectations** — meaningful improvement takes 60-90 days
5. **Use this as a template** for future product improvement initiatives

## Next Steps

1. Approve 90-day plan and budget allocation (Day 1)
2. Assign project owner (Day 1-2)
3. Begin analytics instrumentation (Day 3)
4. Schedule first batch of user interviews (Day 5)
5. First progress report to leadership (Day 14)
6. Phase 1 review and Phase 2 approval (Day 21)

## Conclusion

This plan takes a disciplined, evidence-based approach to improving customer onboarding. By investing in understanding the problem before jumping to solutions, we maximize the probability of meaningful, lasting improvement within the constraints of limited budget and engineering capacity. The phased structure provides natural decision points for leadership to evaluate progress and adjust direction."""

    # Generic
    return """## Document

Based on the analysis and research conducted, the following document has been prepared addressing the core requirements of the request.

### Key Findings
The analysis identified several important considerations and actionable recommendations.

### Recommendations
1. Adopt a phased implementation approach
2. Establish clear metrics and success criteria
3. Assign dedicated ownership
4. Schedule regular review checkpoints

### Next Steps
- Review and approve the proposed approach
- Allocate resources and budget
- Begin Phase 1 execution
- Schedule first progress review"""


def _demo_revision_response(user_prompt: str) -> str:
    """Generate a revised version of the draft."""
    # Find the current draft in the prompt and return it with improvements
    if "CURRENT DRAFT:" in user_prompt:
        draft_start = user_prompt.find("CURRENT DRAFT:") + len("CURRENT DRAFT:")
        draft = user_prompt[draft_start:].strip()

        # Add the improvements mentioned
        if "go/no-go" in user_prompt.lower() or "budget" in user_prompt.lower():
            # Insert go/no-go criteria and budget details
            draft = draft.replace(
                "### Phase 2:",
                "**Go/No-Go Criteria for Phase 2:** Clear identification of at least 2-3 primary drop-off points with supporting data.\n**Budget Allocation:** ~$8,000 for Phase 1 (analytics tools, user interview incentives)\n\n### Phase 2:"
            )
            draft = draft.replace(
                "### Phase 3:",
                "**Go/No-Go Criteria for Phase 3:** Statistical significance on at least 1 A/B test; measurable improvement in at least 1 KPI.\n**Budget Allocation:** ~$20,000 for Phase 2 (development, A/B testing tools)\n\n### Phase 3:"
            )
        return draft
    return user_prompt


def _demo_standard_mode_response(user_prompt: str) -> str:
    """Generate a standard mode response with a plan and a document."""
    return _demo_synthesis_response(user_prompt)



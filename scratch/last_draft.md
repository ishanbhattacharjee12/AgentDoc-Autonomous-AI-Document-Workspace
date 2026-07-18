# Onboarding Improvement Plan

| Priority | Risk | Investment | Timeline | Expected ROI | Confidence |
|---|---|---|---|---|---|
| Compress TTFV and lift activation via instrumented visibility, standardized playbooks, and targeted automation | Engineering throughput shortfall; unverified baseline metrics | $50K cap (uses $40K, $10K buffer) | 90 days | $1.8M ARR pipeline recovery; CAC payback 19→12 mo | Medium-High |

## Executive Summary

**Problem:** Onboarding operates as a fragmented system across self-serve, sales-assisted, and engineering-led provisioning. Median Time-to-First-Value (TTFV) is 14.2 days against a 3-day target, 7-day activation sits at 38%, and 27% of new logos churn within 30 days. The failure drives $1.8M in delayed ARR, extends self-serve CAC payback to 19 months, and consumes 22% of AE capacity on manual hand-holding.

**Approach:** Execute a 90-day, three-phase plan under a $50K budget and partial team capacity. Sequence low-cost instrumentation and enablement quick wins first, validate hypotheses via controlled experiments, then scale proven changes. Prioritize unified metrics, standardized 30/60/90 playbooks, automated access provisioning, and a centralized documentation hub.

**Business Impact:** Recovering delayed pipeline and compressing TTFV by 79% reduces revenue risk and restores sales productivity. Targeted automation and in-product guidance cut onboarding ticket share from 41% to 15%, freeing Tier-1 capacity and reducing quarterly support burden by an estimated $60K.

**Recommendation:** Launch Day-1 funnel audit and weekly leadership metric pack; deploy buddy assignment and pulse survey within week 2; centralize docs and ship 30/60/90 templates by week 5; automate HRIS–IT provisioning by week 9. Hold scope discipline against the $50K ceiling with deferral rights on non-critical build.

**Expected Outcome:** Median TTFV reduced to ≤3 days, 7-day activation lifted to 65%, Day-30 retention to 88%, and onboarding ticket share cut to 15%. Self-serve CAC payback restored to 12 months.

**Estimated Timeline:** 90 days (Quick Wins Days 1–30; Experimental Days 31–60; Scale Days 61–90).

## Key Takeaways

- Onboarding breakage is systemic: unmeasured handoffs, no product-guided value path, and unscaled human touch drive 27% early churn.
- $50K and partial capacity mandate phased delivery—instrument and enable before building.
- Five hypotheses (H1–H5) prioritized by impact/effort yield a $40K execution plan with $10K buffer.
- Weekly leadership reporting is satisfied by Day-10 via lightweight pulse and dashboard, not heavy custom engineering.
- Primary risk is engineering throughput; mitigate via no-code help layer and phased deferral in Scale phase.

## Problem Framing & Baseline Analysis

### Summary
The current onboarding motion fractures across three paths—self-serve signup, manual sales-assisted provisioning, and engineering-led workspace configuration—with no unified SLA or instrumented handoff. Internal funnel telemetry from the trailing Q3 90-day cohort shows a median TTFV of 14.2 days versus a 3-day target, a 38% 7-day activation rate, and 27% Day-0–30 churn. Support load is dominated by onboarding blockers, and sales productivity leaks to manual hand-holding.

Root causes cluster into process (ad hoc handoffs), product (no empty-state guidance or health scoring), enablement (tribal CSM knowledge), and data (blind attribution). Under a $50K cap and partial capacity, the plan must buy visibility and standardize motion before custom builds. Open questions on tier variance, automation ceiling, and CSM capacity are assigned to owners with Week-1 to Week-3 close timelines.

### Key Findings
- Median TTFV of 14.2 days drives $1.8M ARR pipeline delay across 75 logos averaging $24K deal size.
- 41% of Week-1 inbound tickets are onboarding-blockers (auth, provisioning, data import), equaling $94K quarterly Tier-1 cost.
- No end-to-end onboarding event instrumentation creates attribution blind spots and prevents SLA enforcement.
- CSMs operate on tribal knowledge with no certified milestones; 22% of AE time is spent on onboarding hand-holding.
- Baseline gaps: 7-day activation -27pp, Day-30 retention -15pp, onboarding ticket share -26pp vs targets.

### Recommendations
- Immediate: Commission Data/RevOps to close TTFV variance by tier (Week 2); Eng Lead to size provisioning automation ceiling under $50K (Week 1).
- Short-Term: Formalize unified onboarding SLA across sales, CS, and eng; stand up end-to-end event instrumentation by Day 10.
- Long-Term: Institutionalize health scoring and progressive provisioning in product roadmap beyond the 90-day window.

### Risks & Tradeoffs
**Primary Risk:** Unverified baseline metrics distort target-setting and ROI projection.
**Mitigation:** Validate via HRIS and product analytics pull by Week 1; recalibrate priority matrix if variance exceeds 15%.
**Tradeoff:** $50K cap forces deferral of custom eng builds in favor of playbook and instrumentation quick wins, slowing platform automation.

### Deliverables
- Current state diagnostic with quantified funnel deficiencies
- Business impact table (revenue, CAC payback, sales productivity, support cost)
- Root cause cluster map (process, product, enablement, data)
- Open questions register with owners and close timelines
- Baseline metrics summary table with gap analysis

### Conclusion
Onboarding fails as a system, not a feature. The baseline confirms that instrumented visibility and standardized motion are prerequisites to any funded automation under constraint.

## Hypothesis Generation & Prioritization

### Summary
Anchored to the $50K budget and partial capacity, we modeled ramp and onboarding efficiency baselines and generated five root-cause hypotheses (H1–H5) spanning fragmented artifacts, missing 30/60/90 structure, manual provisioning latency, weak feedback loops, and unassigned peer buddies. Each was scored on impact and effort to produce a prioritized execution sequence that front-loads low-effort, leadership-mandated visibility (pulse, buddy rule) and defers the highest-cost automation to a later window.

The prioritized matrix yields $40K committed with $10K buffer. Execution sequences H4/H5 in Weeks 1–2, H1/H2 in Weeks 3–5, and H3 in Weeks 6–9, with weekly dashboard reporting satisfying governance needs from Day 1.

### Key Findings
- H2 (standard 30/60/90 plan) carries top strategic leverage (impact 5, effort 2, $8K) for ramp compression.
- H3 (auto access provisioning) is highest cost ($20K) and depends on 0.5 FTE eng for 4 weeks from partial capacity.
- H4 (weekly pulse + dashboard) and H5 (buddy rule) are low-effort, low-cost, and immediately satisfy weekly leadership update mandate.
- Total prioritized spend is $40K against $50K cap, preserving $10K for license overages or contractor cleanup.
- Assumption risk on baselines requires HRIS validation by Week 1 or matrix recalibration.

### Recommendations
- Immediate: Deploy H4 pulse/dashboard and H5 buddy assignment rule in Weeks 1–2 using Sheets/PowerBI and HR automation.
- Short-Term: Ship H1 centralized doc hub (Notion, $6K) and H2 30/60/90 template plus manager training ($8K) by Week 5.
- Long-Term: Implement H3 HRIS–IT auto-provisioning via Zapier/Workato in Weeks 6–9; defer to Phase 2 if eng capacity unavailable.

### Risks & Tradeoffs
**Primary Risk:** H3 depends on 0.5 FTE engineering for 4 weeks; shortfall stalls automation.
**Mitigation:** Defer H3 to Phase 2 and protect Quick Wins and Experimental phases if FTE unavailable.
**Tradeoff:** Sequencing auto-provisioning last delays environment-readiness gains (5-day latency removal) until Week 9.

### Deliverables
- Assumption-anchored baseline metric table (TTP, NPS, retention, manager hours)
- Root cause hypothesis set H1–H5 with evidence links
- Priority matrix (impact/effort/cost/priority score) with $40K allocation
- Prioritized execution sequence mapped to weeks and budget
- Risk and constraint notes on capacity, budget, and assumptions

### Conclusion
Hypotheses are sequenced to buy visibility and standardize motion first, reserving capital-intensive automation for validated capacity—discipline that protects the $50K envelope.

## Phased 90-Day Implementation Roadmap

### Summary
The 90-day roadmap operationalizes the prioritized hypotheses into three phases—Quick Wins (Days 1–30), Experimental (Days 31–60), and Scale (Days 61–90)—under a $50K ceiling and assumed 1.5 FTE eng / 1 FTE product capacity. Quick Wins remove friction via funnel audit, inline fixes, and leadership metric pack ($12K). Experimental tests simplified creation and contextual help with event instrumentation ($23K). Scale rolls out winners, embeds help, and automates health dashboard ($15K).

Success is tracked through five KPIs (TTFV, Step-2 abandonment, D7 retention, activation, ticket volume) with daily anomaly alerts and weekly leadership packs. Governance binds Scale phase to ≥1 winning experiment by Day 55 and freezes new tooling past Day 50.

### Key Findings
- Quick Wins target ≥15% reduction in Step-2 abandonment (baseline 48%) via UX contract and product time.
- Experimental phase requires $4K/mo experiment tooling and 0.5 FTE eng ramp; exit is 2 validated hypotheses at p<0.05.
- Scale phase is contingent on experiment success; full migration and GA help widget consume remaining $15K.
- Engineering capacity shortfall is high-likelihood/high-impact; mitigated by no-code help widget and scope cut.
- Data gaps in activation events addressed by $3K contractor proxy bootstrap until Day-45 pipeline fix.

### Recommendations
- Immediate: Execute Day-1 funnel audit; deploy inline validation and rewrite 3 high-drop-off tooltips; stand up weekly leadership pack by Day 10.
- Short-Term: Launch A/B test on email-only vs full-profile creation (Day 31); pilot contextual help widget; instrument activation events.
- Long-Term: Migrate 100% of cohorts to winning flow (Day 61+); embed help in GA; automate onboarding health dashboard; train CS on metrics.

### Risks & Tradeoffs
**Primary Risk:** Engineering capacity (1.5 FTE) insufficient for Scale-phase build.
**Mitigation:** Defer non-critical instrumentation to Q2; substitute no-code widget for custom help layer at $0 scope-cut cost.
**Tradeoff:** Deferral of instrumentation reduces attribution granularity post-90-day but protects live flow delivery.

### Deliverables
- Phased 90-day roadmap table (window, objective, initiatives, cost, exit criteria)
- Success metrics framework with KPI definitions, baselines, targets, owners
- Risk/constraint register with likelihood, impact, mitigation, cost
- Execution governance model (weekly sync, budget freeze, dependency gate)

### Conclusion
The roadmap converts analysis into sequenced, gated execution with built-in deferral rights that hold the $50K envelope against throughput risk.

## Consolidated Recommendations

- Immediate: Close baseline data gaps (Week 1–2); deploy pulse, buddy rule, and leadership metric pack (Day 10); audit funnel and ship inline fixes (Day 30).
- Short-Term: Centralize docs and 30/60/90 playbooks (Week 5); run experimental A/B and help-widget pilot (Day 60); validate 2 hypotheses.
- Long-Term: Automate HRIS–IT provisioning (Week 9); scale winning flow to 100% cohorts; embed health dashboard and CS training (Day 90); carry unmet items to Q2 plan.

## Final Note
Discipline against the $50K cap and partial capacity is the controlling variable. Weekly leadership reporting via the H4 dashboard provides the feedback loop to recalibrate before Scale-phase commitments lock.
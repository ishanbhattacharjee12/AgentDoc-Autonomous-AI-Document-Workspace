# Onboarding Improvement Plan

| Priority | Description | Investment | Timeline | Expected ROI | Confidence |
|----------|-------------|------------|----------|--------------|------------|
| P1 | Activation fix (contextual walkthrough + lifecycle nudges) | $27K | Days 1–60 | ~$140K annualized ARR at 4-mo payback | Medium-High |
| P2 | Role-based branching MVP (2 roles) | $15K | Days 5–75 | +4% activation lift, deferred from P1 | Medium |
| P3 | Deferred data-import barrier removal | $6K | Post-Phase 2 if capacity remains | Incremental self-serve TTP reduction | Low-Medium |

## Executive Summary

**Problem**: New-user onboarding operates without a standardized activation pathway. 62% of accounts miss first-value action within 48 hours; median time-to-productivity is 14.2 days; self-serve trial-to-paid conversion sits at 19.4%. Friction suppresses ~$1.8M deferred ARR annually and inflates CAC payback to 14.1 months. (Full baseline detail in Problem Framing.)

**Approach**: Deploy a 90-day, three-phase plan under a $50K ceiling with partial engineering (0.6 FTE) and product (0.4 FTE) capacity. Phase 1 stabilizes instrumentation and ships quick wins; Phase 2 A/B validates prioritized hypotheses (contextual walkthrough, lifecycle email); Phase 3 scales proven variants to 100% with automated reporting.

**Business Impact**: Closing the activation gap lifts trial-to-paid by 7.6 pts (self-serve) and cuts median TTP to 8 days. Projected 20% activation lift yields ~$140K annualized recurring value and reduces onboarding ticket share from 28% to 12%.

**Recommendation**: Execute P1 solutions immediately (in-product contextual walkthrough at config step, 5-touch lifecycle email). Sequence role-based branching as P2. Automate weekly leadership KPI pack from Day 15. Hold $8K contingency against capacity slip.

**Expected Outcome**: 48h activation at 58% (self-serve) / 78% (managed); 7-day retention at 52%; activation rate at 74% by Day 90.

**Estimated Timeline**: Phase 1 (Days 1–30), Phase 2 (Days 31–60), Phase 3 (Days 61–90).

## Key Takeaways
- Onboarding defects trace to three root causes: no shared activation definition, email-series mindset vs. product-state machine, reactive CSM allocation.
- P1 interventions (walkthrough + email, $27K) capture majority of projected lift within budget and capacity.
- Weekly automated dashboard + 1-page memo satisfies leadership governance; $50K cap enforced via per-test $12K ceiling and 80% burn flag.
- Four unknown variables (activation ceiling, handoff failure, localization, build burn) are mitigated by holdout, Week-1 instrumentation, 10% ticket sample, and Phase 1 $22K cap.
- Total committed spend $47K preserves $3K vs cap; net positive at month 4 post-launch.

## Problem Framing & Baseline Analysis

### Summary
Current onboarding lacks a standardized activation pathway, producing measurable 7-day drop-off and inflated CAC payback. Internal funnel telemetry and support tagging show 62% of new accounts miss defined first-value action within 48 hours, and 41% of enterprise trials receive conflicting guidance due to fragmented sales-to-CSM-to-product handoffs. Self-serve users disproportionately fail: 73% never access in-app tutorial; median time-to-productivity is 18.7 days versus 11.3 for managed.

The defect-to-impact chain quantifies ~$1.8M deferred ARR and $142K avoidable support OpEx annually. Three structural root causes—absence of cross-GTM activation definition, instrumentation as email not state machine, reactive CSM capacity—anchor the plan. Four explicitly unknown variables are flagged and mapped to mitigations. Governance requires weekly KPI delta on five baselines, 0.6/0.4 FTE allocation, and $22K Phase 1 spend cap.

Baseline metrics (stated once; referenced by later sections):
- 48h activation: 38% self-serve / 61% managed
- Median TTP: 14.2 days all-segment (18.7 self-serve / 11.3 managed)
- Trial-to-paid: 19.4% self-serve vs 34% managed (14.6 pt gap, ~$1.8M deferred ARR)
- Onboarding ticket share: 28%
- 0–90 day logo churn: 11.2% self-serve (220 logos/yr)

Primary risk: Baseline metrics are assumed, not verified, risking invalid impact estimates. Mitigation: A/B holdout in Phase 1; recalibrate P1 impact by Week 2 if baselines invalid. Tradeoff: $22K Phase 1 cap limits build scope; defers role-based branching to Phase 2.

### Key Findings
- 62% of new accounts do not complete first-value action within 48h; self-serve 48h activation baseline is 38% vs. managed 61%.
- Fragmented handoff drives duplicate onboarding emails in 41% of enterprise trials.
- 73% of SMB self-serve signups never access in-app tutorial; exit-intent not captured.
- Trial-to-paid gap of 14.6 pts (19.4% vs 34%) equates to ~$1.8M deferred ARR on 4,200 trials/yr.
- 0–90 day logo churn concentrated in self-serve at 11.2% (220 lost logos/yr).
- Median TTP 14.2 days all-segment; CAC payback 14.1 months (+2.3 vs target).

### Recommendations
**Immediate**
- Ratify a single activation definition across GTM and Product by Day 5.
- Stand up automated weekly KPI dashboard on five baseline metrics (48h activation, TTP, trial→paid, ticket share, churn).

**Short-Term**
- Instrument handoff events Week 1 to size enterprise failure rate.
- Sample 10% non-EN tickets to scope localization need.

**Long-Term**
- Migrate onboarding from email-series to product-state machine with risk-scored CSM triggers.
- Reallocate CSM capacity from ticket-driven to proactive risk-score model.

### Deliverables
- Current state diagnostic with funnel telemetry and support tag analysis
- Business impact quantification table (ARR, support, churn, CAC)
- Root cause map and unknown factor register with mitigations
- Baseline metrics snapshot (5 KPIs, pre-intervention)
- Governance constraints memo (weekly reporting, FTE, budget caps)

## Hypothesis Generation & Prioritization

### Summary
Hypotheses derive from partial-capacity environment with $50K ceiling and weekly reporting mandate. Four baseline assumptions (62% completion, 4.3d TTFV, 38% config-step drop, no in-product guidance — see Problem Framing baselines) anchor ranking. Root-cause hypotheses H1–H4 map drop-off to missing contextual guidance, absent lifecycle nudges, one-size-fits-all flow, and premature data-import barrier.

Prioritization matrix scores solutions by impact vs effort. P1 items (contextual walkthrough $18K, lifecycle email $9K) capture +21% completion / -1.9d TTFV within 5.5 FTE-wk and $27K. P2 role-branching ($15K) and P3 deferred import ($6K) follow. Sequencing leaves $23K and partial capacity for P2 start; total Phase 1–2 commit $42K preserves $8K contingency. Capacity risk (engineering partial allocation extends P2 by 1–2 weeks) mitigated by scoping MVP to 2 roles and serial sequencing; tradeoff is delayed P3 and limited enterprise handoff rebuild.

### Key Findings
- H2 (no lifecycle nudges) holds Medium-High confidence; H1 (config cognitive overload) Medium.
- P1 walkthrough + email: +12% / +9% completion, -1.1d / -0.8d TTFV, $27K combined.
- P2 role-branching MVP (2 roles) requires 4.0 FTE-wk—capacity-heavy under partial allocation.
- If baselines invalid (see Problem Framing risk), P1 impact needs Week 2 recalibration.
- Total committed Ph1–2 spend $42K (84% of cap); $8K contingency retained.

### Recommendations
**Immediate**
- Launch P1 contextual walkthrough at account-config step (Week 1–4).
- Deploy 5-touch lifecycle email sequence in parallel.

**Short-Term**
- Begin P2 role-based branching MVP (2 roles) Week 5; cap at $15K.
- Validate baselines by Week 2; recalibrate impact models.

**Long-Term**
- Fast-follow P3 deferred data-import if capacity remains post-Phase 2.
- Institutionalize weekly metric pack on completion, TTFV, step-drop.

## Phased 90-Day Implementation Roadmap

### Summary
Execution spans three phases under $50K ceiling at 30% allocated team capacity. Phase 1 (Days 1–30) stabilizes funnel via instrumentation audit, UX micro-copy, SSO simplification, welcome checklist MVP. Phase 2 (Days 31–60) A/B tests progressive profiling, in-app guidance, SMB cohort onboarding, chatbot triage against $12K/test cap. Phase 3 (Days 61–90) rolls winning variants to 100%, automates leadership report, trains CS, embeds diagnostics.

Measurement layer extracts from Day 15: TTA (72h→48h), step-1 drop (38%→28%), 7-day retention (41%→52%), activation (54%→74%). Risk matrix enforces serial testing on capacity slip (mitigation: serial sequencing, defer non-winning variants; tradeoff: per-test $12K cap may underfund complex variants accepting lower stat power), data-contractor fallback at $6K, Day-45 kill criteria, weekly scope audit, finance flag at 80% burn. Estimated cost $47K; benefit ~$140K ARR; net positive month 4.

### Key Findings
- Phase 1 exit: instrumentation ≥95%, SSO drop ↓15%.
- Phase 2 criterion: 2 of 3 hypotheses show ≥10% activation lift at <$12K/test.
- Phase 3: winning variants at 100%, weekly report automated, activation ↑20% vs baseline.
- Total cost $47K (P1 $9K, P2 $28K, P3 $10K); $3K under cap.
- Breach of $50K or >40% capacity triggers pause-and-replan.

### Recommendations
**Immediate**
- Execute Phase 1 instrumentation audit and ship 3 micro-copy fixes by Day 10.
- Launch welcome checklist MVP and simplified SSO Day 15.

**Short-Term**
- Run Phase 2 A/B serially; apply Day-45 kill criteria to subthreshold tests.
- Contract temp data resource ($6K) if instrumentation gaps block KPI read.

**Long-Term**
- Scale chatbot to all tiers and embed self-serve diagnostics in Phase 3.
- Automate Looker leadership view; train CS on locked flows.

## Success Metrics & Measurement Framework

### KPIs & Baselines (consolidated)
- 48h activation: 38% self-serve / 61% managed (target: 58% / 78% by Day 90)
- Median TTP: 14.2 days all-segment (target: 8 days)
- Trial-to-paid: 19.4% self-serve (target: +7.6 pts)
- Onboarding ticket share: 28% (target: 12%)
- 0–90 day logo churn: 11.2% self-serve (target: reduction via activation lift)
- Secondary: step-1 drop 38%→28%; 7-day retention 41%→52%; activation 54%→74%

### Measurement Cadence
- Daily: instrumentation health and funnel event capture (Phase 1+)
- Weekly: automated KPI dashboard + 1-page leadership memo (from Day 15)
- Phase gate: Phase 1 exit Day 30, Phase 2 Day-45 kill criteria, Phase 3 Day 90 rollout audit

### Governance
- Ownership: Product (0.4 FTE) owns KPI pack; Engineering (0.6 FTE) owns tracking plan
- Budget controls: $50K cap, $22K Phase 1 cap, $12K per-test cap, 80% burn finance flag
- Reporting: Looker leadership view automated by Phase 3; weekly delta on five baselines
- Breach triggers: >$50K or >40% capacity slip forces pause-and-replan
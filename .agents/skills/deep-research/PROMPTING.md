# Deep Research Prompting Guide

Use this guide before running `scripts/research.py`. The Deep Research API is most useful when the query reads like a compact research brief, not a search box query.

## High-Signal Prompt Formula

```text
Research [topic] for [audience/decision].

Goal:
- Explain what decision this research supports.

Scope:
- Geography:
- Time period:
- Sector or sub-sector:
- Include:
- Exclude:

Source standards:
- Prioritize peer-reviewed papers, government/NGO reports, official company data, and reputable industry analyses.
- Separate academic evidence from market, policy, and opinion sources.
- Prefer sources from the last [N] years unless historical context is needed.
- Flag weak, outdated, paywalled, or conflicting evidence.

Questions to answer:
1. ...
2. ...
3. ...

Data to extract:
- Market size, CAGR, adoption rates, costs, yields, policy incentives, named players, locations, dates, and cited claims.

Output format:
- Executive summary
- Key findings with citations
- Evidence table
- Market/business implications
- Risks and open questions
- Recommended next research steps
```

## Prompting Rules

- Be explicit about the audience: investor, founder, researcher, policymaker, student, or operator.
- Ask for citations inline and a source list at the end.
- Ask it to distinguish facts, estimates, expert opinion, and inference.
- Ask for contradictions and missing evidence.
- Ask for tables when comparing markets, technologies, competitors, or policies.
- Ask for practical next steps when the research supports action.
- For follow-ups, use `--continue <interaction_id>` so the agent builds on prior context.

## Good Commands

```powershell
py scripts\research.py --query "..." --stream
```

```powershell
py scripts\research.py --query "..." --format "1. Executive Summary\n2. Evidence Table\n3. Findings\n4. Gaps\n5. Recommendations"
```

```powershell
py scripts\research.py --query "Elaborate on the policy incentives section and compare Philippines, Vietnam, and Indonesia." --continue <interaction_id>
```

## Cost Discipline

This skill can cost money per run. Before running broad or repeated tasks, narrow the scope and confirm the user is ready to spend API credits.


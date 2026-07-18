---
name: deep-research
description: "Execute autonomous multi-step research using Google Gemini Deep Research Agent. Use for: market analysis, competitive landscaping, literature reviews, technical research, due diligence. Takes 2-10 minutes but produces detailed, cited reports. Costs $2-5 per task."
license: Apache-2.0
metadata:
  author: sanjay3290
  version: "1.0"
---

# Gemini Deep Research Skill

Run autonomous research tasks that plan, search, read, and synthesize information into comprehensive reports.

## Requirements

- Python 3.8+
- httpx: `pip install -r requirements.txt`
- GEMINI_API_KEY environment variable

## Setup

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/)
2. Set the environment variable:
   ```bash
   export GEMINI_API_KEY=your-api-key-here
   ```
   Or create a `.env` file in the skill directory.

For detailed Windows installation instructions, see [WINDOWS-SETUP.md](references/WINDOWS-SETUP.md).

## Usage

## Prompting Overlay

For stronger results, do not pass vague one-line topics directly to `--query`.
First expand the user's request into a research brief with:

- Objective: the decision, report, or comparison the research should support.
- Scope: geography, time window, industry segment, and audience.
- Source standards: preferred source types, recency requirements, and what to exclude.
- Evidence tasks: questions to answer, metrics to collect, and contradictions to flag.
- Output contract: required sections, tables, citations, confidence notes, and next steps.

Use `PROMPTING.md` and the templates in `templates/` when the user asks for
research planning, literature review, market analysis, or circular agriculture
and agribusiness research. If the research may cost money, confirm before
running the API task.

### Start a research task
```bash
python3 scripts/research.py --query "Research the history of Kubernetes"
```

### With structured output format
```bash
python3 scripts/research.py --query "Compare Python web frameworks" \
  --format "1. Executive Summary\n2. Comparison Table\n3. Recommendations"
```

### Stream progress in real-time
```bash
python3 scripts/research.py --query "Analyze EV battery market" --stream
```

### Start without waiting
```bash
python3 scripts/research.py --query "Research topic" --no-wait
```

### Check status of running research
```bash
python3 scripts/research.py --status <interaction_id>
```

### Wait for completion
```bash
python3 scripts/research.py --wait <interaction_id>
```

### Continue from previous research
```bash
python3 scripts/research.py --query "Elaborate on point 2" --continue <interaction_id>
```

### List recent research
```bash
python3 scripts/research.py --list
```

## Output Formats

- **Default**: Human-readable markdown report
- **JSON** (`--json`): Structured data for programmatic use
- **Raw** (`--raw`): Unprocessed API response

## Cost & Time

| Metric | Value |
|--------|-------|
| Time | 2-10 minutes per task |
| Cost | $2-5 per task (varies by complexity) |
| Token usage | ~250k-900k input, ~60k-80k output |

## Best Use Cases

- Market analysis and competitive landscaping
- Technical literature reviews
- Due diligence research
- Historical research and timelines
- Comparative analysis (frameworks, products, technologies)

## Workflow

1. User requests research -> refine the prompt using `PROMPTING.md` and `templates/`
2. Confirm cost-sensitive runs when appropriate
3. Run `--query "..."`
4. Inform user of estimated time (2-10 minutes)
5. Monitor with `--stream` or poll with `--status`
6. Return formatted results
7. Use `--continue` for follow-up questions

## Exit Codes

- **0**: Success
- **1**: Error (API error, config issue, timeout)
- **130**: Cancelled by user (Ctrl+C)

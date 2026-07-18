---
name: circular-agribusiness-app-builder
description: "Convert circular agriculture and agribusiness research into software product strategy, MVP scope, user workflows, data models, technical architecture, prototypes, implementation plans, and validation experiments. Use when the user wants to create an application, platform, dashboard, marketplace, decision-support tool, MRV system, traceability app, logistics tool, advisory product, or startup concept based on circular agriculture research."
---

# Circular Agribusiness App Builder

## Overview

Use this skill to turn circular agriculture research into buildable software. Favor practical, testable products that solve a concrete workflow for farmers, aggregators, processors, buyers, cooperatives, NGOs, researchers, or local governments.

When the user is starting from research, first identify the single best wedge. Do not build a generic sustainability platform unless there is a specific transaction, decision, or reporting workflow to support.

## Product Workflow

1. Translate research into users and jobs:
   - Identify primary users, buyers, data providers, and beneficiaries.
   - State the painful workflow in operational terms: sourcing waste, testing inputs, matching supply and demand, proving impact, financing equipment, planning logistics, or monitoring farms.
   - Avoid generic "sustainability platform" framing unless it maps to a real transaction or decision.
   - Prefer one primary user and one primary buyer in v1.

2. Choose a product wedge:
   - Marketplace or exchange for waste streams, compost, biochar, residues, feedstock, inputs, or buyers.
   - Advisory and decision-support for circular practices, input substitution, soil amendments, or crop plans.
   - Traceability, compliance, certification, and source documentation.
   - MRV and impact accounting for emissions, waste diversion, soil carbon, and nutrient recovery.
   - Logistics and operations for collection routes, processing capacity, inventory, and quality control.
   - Financing or project evaluation for equipment, pilots, and cooperative investments.
   - Select the wedge that has the clearest repeated workflow, measurable value, and realistic data availability.

3. Scope the MVP:
   - Define the single core loop that should work first.
   - Specify input data, decision output, user action, and success metric.
   - Prefer manual or semi-manual operations behind the first version if it reduces build risk.
   - Separate demo features from production requirements.
   - Include kill criteria and the smallest evidence needed to justify building the next step.

4. Design implementation:
   - Create a lightweight domain model before coding.
   - Define roles, entities, workflows, and audit requirements.
   - Use existing repo patterns when implementing inside a codebase.
   - For new apps, start with a usable first screen, real workflows, and domain-relevant sample data.
   - If offline or low-connectivity use is likely, design for draft capture, sync later, and resilient units/data entry.

5. Validate the idea:
   - Propose interviews, mock transactions, spreadsheet pilots, landing tests, or partner pilots.
   - Define what evidence would kill, change, or accelerate the concept.
   - Validate willingness to pay, workflow fit, and operational feasibility separately.

## References

- Read `references/product-patterns.md` when selecting what kind of circular agriculture software to build.
- Read `references/domain-data-model.md` before designing schemas, APIs, dashboards, or app state.
- Read `references/mvp-blueprint.md` when preparing a roadmap, prototype plan, or first implementation.

## Output Standards

- Tie every feature to a user, data source, and measurable outcome.
- Include uncertainty and operational constraints, especially data availability and offline field realities.
- Prefer small, credible MVPs over broad platforms.
- When building UI, make it task-first, data-dense, and field-operator friendly.
- For the first version, optimize for trust, speed, and data quality before AI sophistication.

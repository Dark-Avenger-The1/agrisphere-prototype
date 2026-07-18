# Target Mapping

Use this reference when creating or updating multi-agent instruction packs. Verify current official docs when a target-specific convention affects the user's workflow.

## Default Targets

| Target | Default output | Notes |
| --- | --- | --- |
| Codex | `AGENTS.md` | `AGENTS.md` is a shared Markdown format for coding-agent instructions. Root files apply broadly; nested files can override for subprojects. |
| opencode | `AGENTS.md` | opencode reads `AGENTS.md` project rules and can also use `~/.config/opencode/AGENTS.md` globally. |
| Cursor | `.cursor/rules/project.mdc` | Cursor rules are project rule files under `.cursor/rules/`. Use MDC frontmatter and keep the body focused. |
| Devin | `.ai/devin-instructions.md` | Treat as a manual-import handoff unless the current repo or official docs reveal an auto-loaded Devin file convention. `AGENTS.md` may still be useful as shared repo context. |
| Antigravity | `.ai/antigravity-instructions.md` | Treat as a manual-import handoff unless the current repo or official docs reveal an auto-loaded Antigravity file convention. Emphasize verification artifacts and destructive-command safeguards. |

## File Selection Rules

- If the repo already has a target file, update it instead of creating a parallel duplicate.
- If multiple tools can consume `AGENTS.md`, keep it as the shortest shared source of truth.
- Use `.cursor/rules/project.mdc` for Cursor-specific rule metadata, not for long duplicate content.
- Put uncertain or UI-imported instructions under `.ai/` with clear "manual import" language.
- In monorepos, create nested `AGENTS.md` files only for genuinely different commands or conventions.

## Content Sections

Prefer these sections in `AGENTS.md`:

- Project snapshot
- Commands
- Working rules
- Verification
- Safety and boundaries
- PR or handoff expectations, if relevant

Keep target-specific files smaller than the shared profile whenever possible.

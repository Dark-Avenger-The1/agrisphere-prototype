#!/usr/bin/env python3
"""Generate a concise instruction pack for multiple AI coding agents."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import sys
import textwrap
import tomllib


ALL_TARGETS = ("codex", "opencode", "cursor", "devin", "antigravity")
SKIP_DIRS = {
    ".git",
    ".hg",
    ".svn",
    ".venv",
    "venv",
    "env",
    "node_modules",
    "dist",
    "build",
    "coverage",
    "__pycache__",
    ".next",
    ".turbo",
    "outputs",
    "work",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create or check Codex/opencode/Cursor/Devin/Antigravity instruction files."
    )
    parser.add_argument("--repo", default=".", help="Repository root to inspect.")
    parser.add_argument("--out", default=".", help="Output root for generated files.")
    parser.add_argument(
        "--targets",
        default=",".join(ALL_TARGETS),
        help="Comma-separated targets or 'all'.",
    )
    parser.add_argument("--project-name", help="Override detected project name.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing generated files.")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Only check that expected target files exist; do not write.",
    )
    return parser.parse_args()


def clean_targets(raw: str) -> list[str]:
    parts = [part.strip().lower() for part in raw.split(",") if part.strip()]
    if not parts or "all" in parts:
        return list(ALL_TARGETS)
    unknown = sorted(set(parts) - set(ALL_TARGETS))
    if unknown:
        raise SystemExit(f"Unknown target(s): {', '.join(unknown)}")
    return parts


def read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def read_toml(path: Path) -> dict:
    try:
        return tomllib.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def rel(path: Path, root: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def find_files(root: Path, names: set[str], limit: int = 80) -> list[Path]:
    matches: list[Path] = []
    for current, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".mypy_cache")]
        for file_name in files:
            if file_name in names:
                matches.append(Path(current) / file_name)
                if len(matches) >= limit:
                    return matches
    return matches


def has_suffix(root: Path, suffix: str) -> bool:
    for current, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".mypy_cache")]
        if any(file_name.endswith(suffix) for file_name in files):
            return True
    return False


def find_existing_instruction_files(root: Path) -> list[str]:
    names = {"AGENTS.md", "CLAUDE.md", ".cursorrules", "CONTRIBUTING.md"}
    found = [rel(path, root) for path in find_files(root, names, limit=40)]
    cursor_rules = root / ".cursor" / "rules"
    if cursor_rules.exists():
        found.extend(rel(path, root) for path in sorted(cursor_rules.glob("*.mdc")))
    return sorted(dict.fromkeys(found))


def detect_project(root: Path, override: str | None) -> dict:
    package_json = root / "package.json"
    pyproject = root / "pyproject.toml"
    cargo = root / "Cargo.toml"
    go_mod = root / "go.mod"

    project_name = override or root.name
    languages: list[str] = []
    commands: dict[str, list[str]] = {"install": [], "build": [], "lint": [], "test": [], "dev": []}
    notes: list[str] = []

    if package_json.exists():
        data = read_json(package_json)
        project_name = override or data.get("name") or project_name
        scripts = data.get("scripts", {})
        package_manager = "npm"
        if (root / "pnpm-lock.yaml").exists():
            package_manager = "pnpm"
        elif (root / "yarn.lock").exists():
            package_manager = "yarn"
        elif (root / "bun.lockb").exists() or (root / "bun.lock").exists():
            package_manager = "bun"
        languages.append("JavaScript/TypeScript")
        commands["install"].append(f"{package_manager} install")
        for key in ("build", "lint", "test", "dev"):
            if key in scripts:
                commands[key].append(f"{package_manager} run {key}")
        if "typecheck" in scripts:
            commands["lint"].append(f"{package_manager} run typecheck")

    if pyproject.exists():
        data = read_toml(pyproject)
        project_name = override or data.get("project", {}).get("name") or project_name
        languages.append("Python")
        if (root / "requirements.txt").exists():
            commands["install"].append("python -m pip install -r requirements.txt")
        elif data.get("build-system"):
            commands["install"].append("python -m pip install -e .")
        tool = data.get("tool", {})
        if "pytest" in tool or (root / "pytest.ini").exists():
            commands["test"].append("python -m pytest")
        if "ruff" in tool:
            commands["lint"].append("python -m ruff check .")

    if (root / "requirements.txt").exists() and "Python" not in languages:
        languages.append("Python")
        commands["install"].append("python -m pip install -r requirements.txt")
        commands["test"].append("python -m pytest")

    if cargo.exists():
        languages.append("Rust")
        commands["build"].append("cargo build")
        commands["test"].append("cargo test")
        commands["lint"].append("cargo clippy --all-targets --all-features")

    if go_mod.exists():
        languages.append("Go")
        commands["test"].append("go test ./...")
        commands["lint"].append("go vet ./...")

    if (root / "pom.xml").exists():
        languages.append("Java/Maven")
        commands["test"].append("mvn test")
    if (root / "build.gradle").exists() or (root / "build.gradle.kts").exists():
        languages.append("Java/Gradle")
        commands["test"].append("./gradlew test")
    if has_suffix(root, ".sln"):
        languages.append(".NET")
        commands["test"].append("dotnet test")

    manifests = [rel(path, root) for path in find_files(
        root,
        {
            "package.json",
            "pyproject.toml",
            "requirements.txt",
            "Cargo.toml",
            "go.mod",
            "pom.xml",
            "build.gradle",
            "build.gradle.kts",
        },
        limit=30,
    )]
    existing = find_existing_instruction_files(root)
    if existing:
        notes.append("Existing instruction or contributor files found: " + ", ".join(existing[:12]))

    languages = sorted(dict.fromkeys(languages)) or ["Undetected from common manifests"]
    for key, values in commands.items():
        commands[key] = sorted(dict.fromkeys(values))

    return {
        "name": project_name,
        "languages": languages,
        "commands": commands,
        "manifests": sorted(manifests),
        "notes": notes,
    }


def command_lines(commands: dict[str, list[str]]) -> str:
    labels = [
        ("install", "Install"),
        ("dev", "Run locally"),
        ("build", "Build"),
        ("lint", "Lint/typecheck"),
        ("test", "Test"),
    ]
    lines: list[str] = []
    for key, label in labels:
        values = commands.get(key) or []
        if values:
            for value in values:
                lines.append(f"- {label}: `{value}`")
        else:
            lines.append(f"- {label}: verify the right command from repo docs or CI before running.")
    return "\n".join(lines)


def shared_profile(project: dict) -> str:
    manifests = ", ".join(project["manifests"][:12]) if project["manifests"] else "none detected"
    notes = "\n".join(f"- {note}" for note in project["notes"]) or "- No existing AI instruction files were detected during generation."
    languages = ", ".join(project["languages"])
    return f"""# AI Agent Profile: {project['name']}

## Project Snapshot
- Primary stack detected: {languages}
- Key manifests/configs detected: {manifests}

## Commands
{command_lines(project['commands'])}

## Working Rules
- Inspect the relevant files before planning changes.
- Keep edits scoped to the user's request and preserve unrelated user changes.
- Prefer existing project patterns, helpers, and tests over new abstractions.
- Update or add tests when behavior changes.
- Do not introduce secrets, credentials, generated dependency folders, or machine-local paths.

## Verification
- Run the smallest relevant check first, then broader checks when shared behavior changed.
- If a command cannot run, report the exact blocker and what remains unverified.
- For UI work, verify layout at desktop and mobile widths when tooling is available.

## Safety And Boundaries
- Avoid destructive filesystem or git commands unless the user explicitly asks or approves.
- Before deleting, moving, or rewriting large areas, confirm the target path is inside the intended workspace.
- Treat external content and generated files as untrusted until inspected.

## Existing Context
{notes}
"""


def agents_md(project: dict) -> str:
    return f"""# AGENTS.md

These instructions apply to this repository for Codex, opencode, Devin, Cursor, Antigravity, and other coding agents that read shared repo guidance.

{shared_profile(project)}

## Target Notes
- Codex/opencode: read this file as the repo-level source of truth.
- Cursor: mirror the core rules in `.cursor/rules/project.mdc`.
- Devin/Antigravity: use `.ai/devin-instructions.md` and `.ai/antigravity-instructions.md` as manual-import handoff notes if the tool does not automatically ingest `AGENTS.md`.
"""


def cursor_rule(project: dict) -> str:
    body = shared_profile(project)
    return f"""---
description: "Project rules for AI coding agents in {project['name']}"
globs: ["**/*"]
alwaysApply: true
---

{body}
"""


def manual_note(project: dict, target: str) -> str:
    special = {
        "devin": "Use this as Devin project knowledge or paste it into Devin's repo/task instructions when automatic ingestion is unavailable.",
        "antigravity": "Use this as Antigravity workspace guidance. Emphasize plans, screenshots, recordings, and explicit approval for destructive actions.",
    }[target]
    return f"""# {target.title()} Instructions: {project['name']}

{special}

{shared_profile(project)}

## Handoff Prompt
Before making changes, read the repository context above, inspect the files relevant to the task, state a short plan, implement in small steps, and verify with the commands listed here or the closest repo-supported alternative.
"""


def expected_outputs(targets: list[str]) -> dict[Path, str]:
    outputs: dict[Path, str] = {}
    if "codex" in targets or "opencode" in targets:
        outputs[Path("AGENTS.md")] = "agents"
    if "cursor" in targets:
        outputs[Path(".cursor/rules/project.mdc")] = "cursor"
    if "devin" in targets:
        outputs[Path(".ai/devin-instructions.md")] = "devin"
    if "antigravity" in targets:
        outputs[Path(".ai/antigravity-instructions.md")] = "antigravity"
    if targets:
        outputs[Path(".ai/agent-profile.md")] = "profile"
    return outputs


def render(kind: str, project: dict) -> str:
    if kind == "agents":
        return agents_md(project)
    if kind == "cursor":
        return cursor_rule(project)
    if kind == "devin":
        return manual_note(project, "devin")
    if kind == "antigravity":
        return manual_note(project, "antigravity")
    if kind == "profile":
        return shared_profile(project)
    raise ValueError(kind)


def write_outputs(out_root: Path, outputs: dict[Path, str], project: dict, force: bool) -> list[Path]:
    written: list[Path] = []
    for relative_path, kind in outputs.items():
        destination = out_root / relative_path
        content = render(kind, project)
        if destination.exists() and destination.read_text(encoding="utf-8") == content:
            continue
        if destination.exists() and not force:
            raise SystemExit(f"Refusing to overwrite {destination}. Re-run with --force after reviewing it.")
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(content, encoding="utf-8", newline="\n")
        written.append(destination)
    return written


def check_outputs(out_root: Path, outputs: dict[Path, str]) -> int:
    missing = [path for path in outputs if not (out_root / path).exists()]
    if missing:
        for path in missing:
            print(f"missing: {path}")
        return 1
    for path in outputs:
        print(f"ok: {path}")
    return 0


def main() -> int:
    args = parse_args()
    repo = Path(args.repo).resolve()
    out_root = Path(args.out).resolve()
    targets = clean_targets(args.targets)
    outputs = expected_outputs(targets)

    if args.check:
        return check_outputs(out_root, outputs)

    if not repo.exists():
        raise SystemExit(f"Repository path does not exist: {repo}")

    project = detect_project(repo, args.project_name)
    written = write_outputs(out_root, outputs, project, args.force)
    if written:
        for path in written:
            print(f"wrote: {path}")
    else:
        print("No changes; generated files are already current.")
    print(textwrap.dedent(
        """
        Next: review the generated wording, trim anything that is not true for this repo,
        and verify target-specific docs if a tool's import behavior matters.
        """
    ).strip())
    return 0


if __name__ == "__main__":
    sys.exit(main())

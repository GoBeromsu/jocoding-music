---
name: codex
description: >
  Invoke OpenAI Codex CLI (codex-cli) to delegate coding tasks, ask questions,
  or run code reviews using OpenAI models. Also handles Codex initial setup
  and configuration. Use when: (1) user says /codex, "codex한테 물어봐",
  "codex 실행", "codex로 해줘", (2) user wants a second AI opinion on code,
  (3) user wants to delegate a task to Codex agent, (4) user wants Codex to
  review code or changes, (5) user asks to set up or configure codex
  ("codex 세팅", "codex 설정", "codex init"). Supports model selection,
  sandbox modes, web search, image input, structured output, and
  Claude ↔ Codex bridge configuration.
---

# Codex CLI Skill

Delegate tasks to OpenAI Codex CLI (`codex exec`) and capture results.
Docs: https://developers.openai.com/codex/cli

**For setup, configuration, and Claude↔Codex bridge details**: See [references/setup.md](references/setup.md).

## Pre-flight: Update & Auth Check

Before every codex invocation, run:

```bash
npm i -g @openai/codex@latest 2>&1 | tail -3 && codex login status 2>&1
```

Skip only if already checked in the current session.

## Core Commands

### Ask / Task (non-interactive)

Progress → stderr; final answer → stdout.

```bash
codex exec "<prompt>" -o /tmp/codex-out.md 2>&1
```

### Full-auto (no approval prompts, workspace-write sandbox)

```bash
codex exec --full-auto "<prompt>" -o /tmp/codex-out.md 2>&1
```

### Code review

```bash
codex review --uncommitted 2>&1          # all local changes
codex review --base main 2>&1            # diff against branch
codex review --commit <sha> 2>&1         # specific commit
```

### Working directory

```bash
codex exec -C /path/to/project "<prompt>" -o /tmp/codex-out.md 2>&1
```

## Key Flags

| Flag | Description |
|------|-------------|
| `-m, --model <name>` | Override model |
| `-o <path>` | Write final message to file |
| `-C <path>` | Set working directory |
| `-i <file,...>` | Attach PNG/JPEG images |
| `-s <mode>` | `read-only` / `workspace-write` / `danger-full-access` |
| `-a <policy>` | `untrusted` / `on-request` / `never` |
| `--full-auto` | `-a on-request -s workspace-write` |
| `--yolo` | Skip all approvals + sandbox (dangerous) |
| `--search` | Live web search (default: cached) |
| `--json` | JSONL event stream to stdout |
| `--ephemeral` | Don't persist session |
| `--output-schema <path>` | Enforce JSON Schema on output |
| `--skip-git-repo-check` | Run outside git repos |

## Models

| Model | Notes |
|-------|-------|
| `gpt-5.3-codex` | Default. Most capable |
| `gpt-5.3-codex-spark` | Near-instant (ChatGPT Pro only) |
| `gpt-5.2-codex` | Previous gen |
| `gpt-5.2` | General purpose |

Omit `-m` to use config default. If "not supported" error, retry without `-m`.

## Workflow

1. Run update + auth check (once per session).
2. Determine task type: question, code task, or review.
3. Select model if user specified; otherwise use default.
4. Run `codex exec -o /tmp/codex-out.md` or `codex review`.
5. Set Bash timeout 120000–600000ms depending on complexity.
6. Read output file and relay result to user.

## Setup Tasks

When user asks to set up or configure codex, read [references/setup.md](references/setup.md) and follow the relevant section:

| User Request | Reference Section |
|-------------|-------------------|
| "codex 설치" / "codex install" | Installation & Update |
| "codex 로그인" / "codex auth" | Authentication |
| "codex 설정" / "config 수정" | config.toml Structure |
| "CLAUDE.md 공유" / "context 연동" | Claude ↔ Codex Bridge Setup |
| "MCP 추가" / "서버 연결" | MCP Servers |
| "스킬 공유" / "skills 연동" | Codex Skills, Claude ↔ Codex Bridge |
| "프로젝트 신뢰" / "trust" | Trust & Project Config |

### Quick Bridge Setup (Claude ↔ Codex)

To share project context and skills between Claude and Codex:

```bash
# 1. Symlink CLAUDE.md → AGENTS.md (Codex reads AGENTS.md)
ln -s CLAUDE.md AGENTS.md

# 2. Symlink skills directory
mkdir -p .agents && ln -s ../.claude/skills .agents/skills

# 3. Add fallback in ~/.codex/config.toml
#    project_doc_fallback_filenames = ["CLAUDE.md"]
```

## Resume / Fork Sessions

```bash
codex exec resume --last "follow-up"     # continue last
codex exec resume <SESSION_ID> "prompt"   # specific session
codex fork --last                         # fork from last
```

## Important Notes

- Always use `codex exec` (non-interactive), never bare `codex` (launches TUI).
- Append `2>&1` to capture stderr, or `2>/dev/null` for stdout only.
- For long-running tasks, use `run_in_background: true` on the Bash tool.
- Codex reads `AGENTS.md` in project root (not `CLAUDE.md` by default).
- `CODEX_API_KEY` env var for CI/headless auth.
- `on-failure` approval policy is deprecated → use `on-request`.

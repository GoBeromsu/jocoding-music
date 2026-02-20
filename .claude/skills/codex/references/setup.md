# Codex Setup & Configuration Reference

## Table of Contents

1. [Installation & Update](#installation--update)
2. [Authentication](#authentication)
3. [config.toml Structure](#configtoml-structure)
4. [AGENTS.md (Project Instructions)](#agentsmd)
5. [Claude ↔ Codex Bridge Setup](#claude--codex-bridge-setup)
6. [MCP Servers](#mcp-servers)
7. [Codex Skills](#codex-skills)
8. [Trust & Project Config](#trust--project-config)
9. [Sample config.toml](#sample-configtoml)

---

## Installation & Update

```bash
# Install
npm i -g @openai/codex

# Update to latest
npm i -g @openai/codex@latest

# Check version
codex --version

# Check login status
codex login status
```

## Authentication

```bash
# Interactive login (browser-based, ChatGPT account)
codex login

# API key login (piped from stdin)
echo "sk-..." | codex login --with-api-key

# Device code flow (headless/SSH)
codex login --device-auth

# CI/automation (env var, exec only)
CODEX_API_KEY=sk-... codex exec "task"

# Logout
codex logout
```

Requires: ChatGPT Plus, Pro, Business, Edu, or Enterprise.

## config.toml Structure

Locations (precedence high → low):

| Scope | Path |
|-------|------|
| CLI flags | `--config key=value`, `-m model` |
| Profile | `--profile <name>` |
| Project | `.codex/config.toml` (requires trust) |
| User | `~/.codex/config.toml` |
| System | `/etc/codex/config.toml` |

### Essential Settings

```toml
# Model
model = "gpt-5.3-codex"
model_reasoning_effort = "high"    # minimal|low|medium|high|xhigh
model_reasoning_summary = "auto"   # auto|concise|detailed|none
personality = "pragmatic"          # friendly|pragmatic|none

# Review (separate model for /review)
review_model = "gpt-5.3-codex"

# Sandbox & Approval
sandbox_mode = "workspace-write"   # read-only|workspace-write|danger-full-access
approval_policy = "on-request"     # untrusted|on-request|never

# Web Search
web_search = "cached"              # disabled|cached|live

# Notifications
notify = []
```

### Profiles

```toml
[profiles.quick]
model = "gpt-5.3-codex-spark"
model_reasoning_effort = "low"

[profiles.deep]
model = "gpt-5.3-codex"
model_reasoning_effort = "xhigh"
```

Usage: `codex --profile deep "analyze this codebase"`

### Shell Environment

```toml
[shell_environment_policy]
inherit = "all"          # "all" or "none"
exclude = ["AWS_*", "SECRET_*"]
set = { PATH = "/usr/bin:/usr/local/bin" }
```

### Sandbox Fine-tuning

```toml
[sandbox_workspace_write]
writable_roots = ["/Users/YOU/.pyenv/shims"]
network_access = false
```

### Feature Flags

```toml
[features]
shell_snapshot = true
multi_agent = false
collaboration_modes = true
```

## AGENTS.md

Codex reads `AGENTS.md` files (equivalent to Claude's `CLAUDE.md`).

### Discovery Hierarchy

```
~/.codex/AGENTS.md                    # Global defaults
project-root/AGENTS.md                # Repo norms
project-root/services/api/AGENTS.md   # Subdirectory overrides
```

- Files concatenate from root downward (closer files take precedence)
- `AGENTS.override.md` takes priority over `AGENTS.md` at same level
- Max size: 32 KiB (configurable via `project_doc_max_bytes`)
- Custom fallback names: `project_doc_fallback_filenames = ["CLAUDE.md"]`

### Verify loaded instructions

```bash
codex exec --ephemeral "Summarize your current instructions and list which files were loaded" -o /tmp/codex-instructions.md 2>&1
```

## Claude ↔ Codex Bridge Setup

To share project context between Claude and Codex:

### Option A: Symlink CLAUDE.md → AGENTS.md

```bash
# In project root (where CLAUDE.md exists)
ln -s CLAUDE.md AGENTS.md
```

Now both Claude and Codex read the same project instructions.

### Option B: Configure Codex to read CLAUDE.md as fallback

In `~/.codex/config.toml`:

```toml
project_doc_fallback_filenames = ["CLAUDE.md", "CODEX.md"]
```

This tells Codex to look for `CLAUDE.md` if no `AGENTS.md` is found.

### Option C: Symlink Claude skills → Codex skills

Codex looks for skills at `.agents/skills/`. Claude uses `.claude/skills/`.

```bash
# In project root
mkdir -p .agents
ln -s ../.claude/skills .agents/skills
```

Or for user-level skills:

```bash
ln -s ~/.claude/skills ~/.agents/skills
```

**Note**: Codex skills use the same `SKILL.md` format as Claude skills.

### Option D: Full bridge setup (recommended)

```bash
# 1. Symlink project instructions
ln -s CLAUDE.md AGENTS.md

# 2. Symlink skills directory
mkdir -p .agents
ln -s ../.claude/skills .agents/skills

# 3. Set fallback in config (catches repos without symlinks)
# Add to ~/.codex/config.toml:
#   project_doc_fallback_filenames = ["CLAUDE.md"]
```

## MCP Servers

### Add via CLI

```bash
# STDIO server
codex mcp add context7 -- npx -y @upstash/context7-mcp

# With env vars
codex mcp add myserver --env API_KEY=xxx -- node server.js

# HTTP server
codex mcp add figma --url https://mcp.figma.com/mcp

# List servers
codex mcp list

# Remove
codex mcp remove context7
```

### Add via config.toml

```toml
[mcp_servers.playwright]
command = "npx"
args = ["@playwright/mcp@latest"]

[mcp_servers.docs]
command = "docs-server"
args = ["--port", "4000"]
enabled = true
required = true
startup_timeout_sec = 10.0
tool_timeout_sec = 60.0

[mcp_servers.docs.env]
API_KEY = "value"

[mcp_servers.figma]
url = "https://mcp.figma.com/mcp"
bearer_token_env_var = "FIGMA_OAUTH_TOKEN"
```

### Common Options

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | true | Toggle without deleting |
| `required` | false | Fail startup if server won't start |
| `startup_timeout_sec` | 10 | Max wait for server init |
| `tool_timeout_sec` | 60 | Max wait per tool call |
| `enabled_tools` | all | Allowlist of tools |
| `disabled_tools` | none | Denylist of tools |

## Codex Skills

Codex scans for skills at these locations:

| Scope | Path |
|-------|------|
| Folder | `.agents/skills/` (CWD) |
| Repo | `REPO_ROOT/.agents/skills/` |
| User | `~/.agents/skills/` |
| Admin | `/etc/codex/skills/` |
| System | Bundled (built-in) |

### Disable a skill

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Trust & Project Config

```toml
[projects."/path/to/project"]
trust_level = "trusted"
```

Only trusted projects load `.codex/config.toml` and project-scoped MCP servers.

## Sample config.toml

Minimal recommended setup:

```toml
model = "gpt-5.3-codex"
model_reasoning_effort = "high"
personality = "pragmatic"
approval_policy = "on-request"
sandbox_mode = "workspace-write"
web_search = "cached"
project_doc_fallback_filenames = ["CLAUDE.md"]

[projects."/Users/beomsu/Documents/GitHub/Hackerthon/jocoding"]
trust_level = "trusted"

[mcp_servers.playwright]
command = "npx"
args = ["@playwright/mcp@latest"]
```

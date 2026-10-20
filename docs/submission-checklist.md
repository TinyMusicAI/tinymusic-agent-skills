# Submission Checklist

What we submit is a **skills repository** (`TinyMusicAI/tinymusic-agent-skills`), not an MCP service. Every skill works standalone; the MCP server is an optional extra that is mentioned in the README only.

> **Verify before submitting.** The site requirements below were taken from the Discoverability notes of a comparable skills repository and have **not** been checked site by site. Always re-read each site's current submission rules before you submit. Nothing here has been submitted yet.

## Target directories

| Site | How it is listed | Typically needs |
| --- | --- | --- |
| [skills.sh](https://skills.sh/) | Installed via `npx skills add TinyMusicAI/tinymusic-agent-skills` | Public GitHub repository with `skills/<name>/SKILL.md` files; no separate form. |
| [cursor.directory](https://cursor.directory/plugins/new) | Submit the repository URL on the plugin form | Public repo URL; a plugin/marketplace manifest (`.cursor-plugin/marketplace.json`) and a clear README. |
| [agentskill.sh](https://agentskill.sh/submit) | Submit form | Public repo URL; skill name and description. |
| [claudeskills.info](https://claudeskills.info/submit/) | Submit form | Public repo URL; skill name and description. |
| [SkillsMP](https://skillsmp.com/) | Automatically indexes public `SKILL.md` files | Public GitHub repository, with a few stars (about 2 or more, per the reference notes). No form. |

Also consider the Claude Code marketplace route, which needs no approval: users run `claude plugin marketplace add TinyMusicAI/tinymusic-agent-skills`.

## Repository self-check

Run `node scripts/verify-skills.mjs` and make sure it passes. In addition, check by hand:

- [ ] Layout: every skill is `skills/<name>/SKILL.md`, and the folder name equals `name` in the frontmatter.
- [ ] Frontmatter has `name`, `description` (1024 characters or fewer, with concrete trigger phrases), `homepage`, `author`, `license`, `tags`, `version`.
- [ ] Descriptions are distinct from each other so directories do not treat the skills as duplicates.
- [ ] Every skill that uses tools has both `## Without the MCP (standalone)` and `## With the MCP connected` sections, and standalone mode never claims audio was generated.
- [ ] `.claude-plugin/marketplace.json` and `.cursor-plugin/marketplace.json` list exactly the skills in `skills/`, and each skill has `.claude-plugin/plugin.json`.
- [ ] `LICENSE` (MIT) and `README.md` are present; the README installation commands use the final GitHub path.
- [ ] No secrets anywhere: the only key-like string is the placeholder `sk_your_api_key`.
- [ ] Every tinymusic.ai URL in the repository is on the allow-list in the verify script.
- [ ] No real user data, internal hostnames, IPs or deployment scripts.
- [ ] The repository is public, has a short GitHub description and topics (for example `agent-skills`, `claude-code`, `ai-music`, `mcp`).
- [ ] Optional: run `node scripts/verify-skills.mjs --live` once the MCP server is deployed, to confirm the optional reference still matches the live tools.

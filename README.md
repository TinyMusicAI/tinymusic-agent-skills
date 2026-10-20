# TinyMusic Agent Skills

Free agent skills for writing songs, lyrics, gift songs, jingles and background music with [TinyMusic](https://tinymusic.ai). **No API key or setup is needed to get value:** the skills write the lyrics, style and a paste-ready generation pack, and you generate the audio on tinymusic.ai. Optionally, connect the TinyMusic MCP server so the agent can generate and return the song itself.

Works with Claude Code, Cursor and other agents that read `SKILL.md` skills.

## Skills

| Skill | What it does | Uses MCP tools? |
| --- | --- | --- |
| [ai-song-generator](./skills/ai-song-generator/SKILL.md) | Turn an idea or finished lyrics into a song: picks simple vs. custom mode, builds the generation pack, or generates it. | Optional |
| [lyrics-writer](./skills/lyrics-writer/SKILL.md) | Write or rework lyrics with structure, rhyme and language control. | Optional |
| [music-style-prompt-guide](./skills/music-style-prompt-guide/SKILL.md) | Write better style strings and prompts: genre, mood, BPM, instruments, vocals, production. | No (knowledge only) |
| [royalty-free-bgm](./skills/royalty-free-bgm/SKILL.md) | Instrumental background music briefs for video, podcasts, games and streams. Points to TinyMusic's Terms of Service for commercial use. | Optional |
| [personalized-song-gift](./skills/personalized-song-gift/SKILL.md) | Gift songs for birthdays, weddings, anniversaries and more, built from an interview about real details. | Optional |
| [brand-jingle-creator](./skills/brand-jingle-creator/SKILL.md) | Short jingles, sonic logos and intro/outro music from a brand brief, with three directions to choose from. | Optional |

## Two ways every skill works

**Without the MCP (default).** The agent does the creative work: lyrics, style string, a copy-paste generation pack (title / style / lyrics / notes). It tells you clearly that no audio has been generated yet and sends you to the right TinyMusic page to paste it in and generate (signed in, using your account credits):

| You have | Go to |
| --- | --- |
| A description of the song | <https://tinymusic.ai/text-to-song-generator> or <https://tinymusic.ai/ai-music-generator> |
| Finished lyrics | <https://tinymusic.ai/lyrics-to-song-generator> |
| Only a topic, want lyrics | <https://tinymusic.ai/ai-lyrics-generator> |
| An instrumental or background track | <https://tinymusic.ai/royalty-free-ai-music> |

**With the MCP connected.** The agent checks your credits, submits the song, waits for it, and hands you the audio link. See [Optional: connect the MCP server](#optional-connect-the-mcp-server).

## Install

```bash
# All skills
npx skills add TinyMusicAI/tinymusic-agent-skills

# One skill
npx skills add TinyMusicAI/tinymusic-agent-skills --skill ai-song-generator
```

Claude Code plugin marketplace:

```bash
claude plugin marketplace add TinyMusicAI/tinymusic-agent-skills
claude plugin install ai-song-generator@tinymusic-agent-skills
```

Manual:

```bash
cp -r skills/ai-song-generator ~/.claude/skills/
# or ./.cursor/skills/ for Cursor
```

## Rules the skills follow

- Original music only: no imitation of living artists' voices, no reproduction of copyrighted lyrics.
- No claim that a song exists until it was actually generated.
- No made-up license terms. The only licensing statement is TinyMusic's own: its Terms of Service say generated content may be used commercially on every plan. Read <https://tinymusic.ai/terms-of-service> for the exact wording.
- No hard-coded daily limits; the live numbers come from the account.

## Optional: connect the MCP server

You do not need this to use the skills. Connect it if you want the agent to generate songs and fetch the audio link itself.

The server has its own repository with setup, tool reference and registry metadata: [TinyMusicAI/tinymusic-mcp](https://github.com/TinyMusicAI/tinymusic-mcp).

- Endpoint: `https://tinymusic.ai/mcp` (Streamable HTTP, stateless). Server name: `tinymusic`.
- Tools: `generate_song` (6 credits), `get_song_task`, `generate_lyrics` (free, daily limit), `get_credits`. Reference: [docs/tool-contract.md](./docs/tool-contract.md).

### 1. Get an API key

1. Sign in at <https://tinymusic.ai>.
2. Create a key at <https://tinymusic.ai/settings/apikeys>. Keys look like `sk_...`. That page also shows copy-paste configuration for Claude Code and Cursor.

Free accounts can use the server. Calls spend credits from your own account (credits granted at sign-up or purchased). When the balance runs out, top up at <https://tinymusic.ai/pricing>. Keep your key private and never commit it to a repository.

### 2. Authentication

Send the key as a bearer token on every request:

```
Authorization: Bearer sk_your_api_key
```

`initialize` and `tools/list` work without a key, so clients can discover the tools. `tools/call` requires a valid key; without one the server answers HTTP 401.

### Claude Code

```bash
claude mcp add --transport http tinymusic https://tinymusic.ai/mcp --header "Authorization: Bearer sk_your_api_key"
```

### Cursor

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "tinymusic": {
      "url": "https://tinymusic.ai/mcp",
      "headers": {
        "Authorization": "Bearer sk_your_api_key"
      }
    }
  }
}
```

This file contains your key. Do not commit it.

### Any Streamable HTTP client

Point the client at the endpoint and add the header:

```json
{
  "type": "streamable-http",
  "url": "https://tinymusic.ai/mcp",
  "headers": {
    "Authorization": "Bearer sk_your_api_key"
  }
}
```

Exact field names vary slightly between clients (`type` may be `http` or `streamableHttp`). Check your client's MCP documentation.

### Quick check

```bash
curl -s https://tinymusic.ai/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

You should see the four tools listed above (no key needed for this call).

### Usage notes (MCP)

- A song costs 6 credits. Lyrics are free but limited per day.
- Daily limits (songs and lyrics) differ between free and paid accounts: paid accounts get a higher limit. Call `get_credits` for your current limits, usage and `limits_reset_at` (counters reset at 00:00 UTC). One `generate_song` call counts as one use, however many songs the task returns. Calls that are rejected or fail to start, and idempotent replays, do not use up allowance; a task that was created and fails later still counts as one use (its credits are refunded).
- Song generation is asynchronous. After `generate_song`, poll `get_song_task` at the interval in `poll_after_seconds` until the status is `success` or `failed`. Failed tasks refund their credits automatically. `canceled` is reserved and not produced today; if you ever see it, treat it as a failure and do not assume a refund.
- To retry a submission safely, reuse the same `idempotency_key`. The server then returns the existing task (`created: false`) instead of charging again. The key is released once a task ends as `failed` or `canceled`.
- Audio and cover URLs are not guaranteed to stay valid forever. Save the files you want to keep. Your songs are also stored in your library at <https://tinymusic.ai/songs> (sign-in required).

### Errors

Tool failures return `isError: true` with `{"error":{"code","message",...}}`. Codes: `unauthorized`, `email_not_verified`, `invalid_params`, `insufficient_credits`, `daily_limit_reached`, `not_found`, `provider_unavailable`, `provider_error`, `internal_error`. Transport-level problems use HTTP status codes (401 missing or invalid key on `tools/call`, 403 origin not allowed, 413 body over 256 KB, 429 more than 60 calls per minute per key, 405 for `GET`/`DELETE`). See the [reference](./docs/tool-contract.md#errors) for details and the recommended handling of each.

## Development

```bash
node scripts/verify-skills.mjs          # offline checks (frontmatter, dual-mode sections, tool names, URLs, marketplaces, secrets)
node scripts/verify-skills.mjs --live   # optional: compare the live MCP tools/list with docs/tool-contract.md and check that tools/call without a key returns 401
node scripts/verify-skills.mjs --live --url <your-mcp-endpoint>
```

Needs Node 18 or newer, no dependencies. Publishing notes: [docs/submission-checklist.md](./docs/submission-checklist.md).

## License

MIT, see [LICENSE](./LICENSE).

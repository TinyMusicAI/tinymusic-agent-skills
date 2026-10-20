# TinyMusic MCP Tool Reference (optional)

**Optional reference.** This repository is a set of agent skills that work without any setup. This document describes the tools of the optional TinyMusic MCP server, which the skills use when it is connected. It is the single source of truth for those tool names and behavior: the skills and `scripts/verify-skills.mjs` are checked against it.

- **Server name:** `tinymusic`
- **Endpoint:** `https://tinymusic.ai/mcp` (Streamable HTTP, stateless: `POST` only, no SSE stream, no sessions)
- **Tool count:** 4

> Parsing note: each tool below is declared with a level-3 heading of the exact form ``### `tool_name` ``. `scripts/verify-skills.mjs` reads the set of tool names from these headings. Do not change the heading format or add other level-3 headings in that form.

## Authentication

- Create an API key at <https://tinymusic.ai/settings/apikeys> (sign in first). The page shows copy-paste configuration for Claude Code and Cursor. Keys look like `sk_...`.
- Send it on every request: `Authorization: Bearer sk_your_api_key`.
- `initialize` and `tools/list` do **not** require a key. `tools/call` **does**.
- Free accounts can use the server. Calls are charged to the credits of the account that owns the key (credits granted at sign-up or purchased). Top up at <https://tinymusic.ai/pricing>.
- `plan` (see `get_credits`) is `paid` when the account has an active subscription or has ever had a paid order; otherwise `free`. Paid accounts have a higher daily limit than free accounts. Read the actual numbers from `get_credits`; never hard-code them.

---

### `generate_song`

Submit a song generation task. Asynchronous: it returns a `task_id` immediately; poll `get_song_task` for the result. Costs **6 credits** and uses **1** of the daily song allowance.

**Modes**

- **Simple mode** (`custom_mode: false`, default): describe the song in `prompt`. `prompt` is required.
- **Custom mode** (`custom_mode: true`): you provide `title`, `style` and `lyrics`; all three are required. `prompt` is optional extra direction. `instrumental` is ignored in custom mode.
- **Instrumental (no vocals)** is only possible in simple mode with `instrumental: true`.

**Input**

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `prompt` | string | simple mode: yes. custom mode: no | max 5000 chars | Song description (simple mode) or supplementary direction (custom mode). Missing in simple mode returns `invalid_params`: "prompt is required unless custom_mode is true". |
| `custom_mode` | boolean | no | default `false` | Selects custom mode. |
| `title` | string | custom mode: yes | max 200 chars | Song title. |
| `style` | string | custom mode: yes | max 1000 chars | Style / genre / tempo / mood, e.g. `"lo-fi hip hop, mellow, 80 bpm"`. |
| `lyrics` | string | custom mode: yes | max 5000 chars | Full lyrics. |
| `instrumental` | boolean | no | simple mode only; ignored in custom mode | `true` = no vocals. |
| `vocal_gender` | enum | no | `"m"` or `"f"` | Preferred vocal gender. |
| `idempotency_key` | string | no | max 80 chars, `[A-Za-z0-9._-]` only | See "Idempotency" below. If omitted, the server generates one and returns it. |

**Output**

| Field | Type | Description |
| --- | --- | --- |
| `task_id` | string | Task identifier for `get_song_task`. |
| `status` | string | Current stored status of the task (same value set as `get_song_task`). |
| `created` | boolean | `false` means an existing task with the same `idempotency_key` was returned (idempotent replay). |
| `estimated_credits` | number | `6`. |
| `idempotency_key` | string | The key in effect (yours, or server-generated). |
| `poll_after_seconds` | number | `10`. Present only when `status` is not terminal. A replay that lands on a finished task does not include it. |
| `songs_remaining_today` | number | Remaining daily song allowance after this call. |

**Daily allowance**

- One successful `generate_song` call (one task) counts as 1, regardless of how many songs the task returns.
- A call that is rejected or fails to start (invalid arguments, not enough credits, provider error) and an idempotent replay do not use allowance (the server gives it back). A task that was created and fails later still counts as one use; its credits are refunded.
- The counter resets at 00:00 UTC. `get_credits` returns `limits_reset_at`.

**Idempotency**

- Keys are scoped per user.
- A key stays bound to its task while the task is alive (`pending`, `processing`, `success`). When the task ends as `failed` or `canceled`, the key is released and can be reused.
- A replay (same key) returns the existing task with `created: false` and its current stored `status`. The request parameters in the replay are ignored and no credits are charged.

### `get_song_task`

Query the status and result of a song task. Only music tasks created by `generate_song` (by the same account) are accepted; any other or unknown `task_id` returns `not_found`.

**Input**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `task_id` | string | yes | The `task_id` returned by `generate_song`. |

**Output**

| Field | Type | Description |
| --- | --- | --- |
| `task_id` | string | Task identifier. |
| `status` | enum | One of `pending`, `processing`, `success`, `failed`, `canceled`. `success`, `failed` and `canceled` are terminal. |
| `songs` | array | Present only when `status` is `success`. One task may return more than one song. Each item may contain `id`, `title`, `audio_url`, `image_url`, `duration_seconds`, `style`, `lyrics`. Missing fields are omitted, so do not assume every field is present. |
| `error` | object | Present only when `status` is `failed`: `{ code, message }`. Credits are refunded automatically on failure. |
| `poll_after_seconds` | number | Present only for non-terminal statuses. Wait at least this long before polling again. |

**Notes**

- `canceled` is a reserved status. No API path currently produces it. If it ever appears, treat it as a terminal failure and do not assume credits were refunded automatically (only `failed` is refunded automatically).
- `audio_url` and `image_url` are not guaranteed to stay valid forever. Save the files promptly. Songs are also kept in the account's library at <https://tinymusic.ai/songs> (sign-in required).

### `generate_lyrics`

Write song lyrics with AI. Synchronous. Costs **0 credits**, but is subject to a daily usage limit (see `get_credits`).

**Input**

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `prompt` | string | yes | max 500 chars | What the song is about. |
| `style` | string | no | max 100 chars | Musical style the lyrics should fit. |
| `mood` | string | no | max 100 chars | Emotional tone. |
| `language` | string | no | max 50 chars | Lyric language, e.g. `"English"`, `"Chinese"`. |
| `sections` | string[] | no | | Desired structure, e.g. `["Verse","Chorus","Verse","Chorus","Bridge","Chorus"]`. |

**Output**

| Field | Type | Description |
| --- | --- | --- |
| `title` | string | Suggested title. |
| `style` | string | Suggested style. |
| `mood` | string | Mood of the lyrics. |
| `lyrics` | string | Complete lyrics text. Can be passed directly as `lyrics` to `generate_song`. |
| `sections` | array | `{ label, lyrics }` per section. |
| `suggestions` | string[] | Follow-up suggestions. |
| `lyrics_remaining_today` | number | Remaining daily lyrics generations. |

### `get_credits`

Report the account's credit balance and daily allowances. No input.

**Output**

| Field | Type | Description |
| --- | --- | --- |
| `balance` | number | Current credit balance. |
| `plan` | enum | `"free"` or `"paid"` (see Authentication). |
| `costs` | object | `{ "generate_song": 6, "generate_lyrics": 0 }`. |
| `daily_song_limit` | number | Daily limit of `generate_song` calls for this account. |
| `songs_used_today` | number | Calls used today. |
| `songs_remaining_today` | number | Calls remaining today. |
| `daily_lyrics_limit` | number | Daily limit of `generate_lyrics` calls. |
| `lyrics_used_today` | number | Lyrics calls used today. |
| `lyrics_remaining_today` | number | Lyrics calls remaining today. |
| `limits_reset_at` | string | ISO 8601 time when the daily counters reset (00:00 UTC). |
| `top_up_url` | string | `https://tinymusic.ai/pricing`. |

---

## Errors

### Tool errors

A failed tool call returns a normal `tools/call` result with `isError: true`. The payload is in `structuredContent` and is also serialized as JSON in `content[0].text`:

```json
{ "error": { "code": "daily_limit_reached", "message": "...", "limit": 0, "resets_at": "..." } }
```

`code` is exactly one of:

| Code | Meaning | Extra fields | What a client or skill should do |
| --- | --- | --- | --- |
| `unauthorized` | Key is missing or not valid for this call. | | Send the user to the README to configure a key. |
| `email_not_verified` | The account's email must be verified first. Only occurs if the site has email verification enabled. | | Ask the user to verify their email on tinymusic.ai. |
| `invalid_params` | A value failed validation (for example a missing required field for the chosen mode). | | Fix the arguments using `message` and retry. |
| `insufficient_credits` | Not enough credits. | `balance`, `required`, `top_up_url` | Report balance and required credits and give `top_up_url`. |
| `daily_limit_reached` | Daily allowance used up. | `limit`, `resets_at` | Tell the user and give `resets_at`. Do not retry. |
| `not_found` | Unknown `task_id`, or a task that belongs to someone else, or is not a music task. | | Check the `task_id`. |
| `provider_unavailable` | Service temporarily unavailable. | | Try again later; no need to change parameters. |
| `provider_error` | Generation could not be started. Credits are refunded automatically. | | Retrying once with the same `idempotency_key` is safe. |
| `internal_error` | Unexpected server error. | | Report it; retry later. |

### Transport-level errors

These are HTTP / JSON-RPC errors, not tool errors:

| Condition | Response |
| --- | --- |
| `tools/call` with a missing or invalid key | HTTP 401 with `WWW-Authenticate: Bearer realm="tinymusic"`; JSON-RPC error code `-32001` |
| `Origin` not allowed | HTTP 403 |
| Request body larger than 256 KB | HTTP 413 |
| Body is not valid JSON | HTTP 400, JSON-RPC error `-32700` |
| More than 60 calls per minute per key (burst protection) | HTTP 429 with `Retry-After` |
| `GET` or `DELETE` on `/mcp` | HTTP 405 (the server is stateless and offers no SSE stream) |
| Argument has the wrong type or format (for example `prompt` is a number) | JSON-RPC error `-32602` from the MCP layer, not an `isError` result |

---

## Behavior rules

1. Check `get_credits` before spending credits, at least for batch work or when the balance is unknown. Tell the user a song costs 6 credits.
2. The daily limits differ between free and paid accounts. Never hard-code a number; read it from `get_credits`.
3. Do not retry `generate_song` without reusing the same `idempotency_key`. After a failure or an ambiguous response, call `get_song_task` before submitting again.
4. Poll at the interval given by `poll_after_seconds`. Do not poll every second. Do not promise a generation time.
5. Do not assume the URLs in `songs` stay valid forever; tell the user to save the files.
6. Original content only. Do not imitate the voice of a living artist or reproduce lyrics of copyrighted songs.

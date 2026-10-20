---
name: ai-song-generator
description: "Turn an idea or finished lyrics into a complete song. Use when the user says things like 'write me a song about...', 'make a song from these lyrics', 'turn this poem into a song', 'generate a song', or in Chinese '帮我写一首歌', '生成歌曲', '把这段歌词做成歌'. Without the TinyMusic MCP it prepares a paste-ready generation pack (title, style, lyrics) for the TinyMusic web generator; with the MCP connected it generates the song and returns the audio link."
homepage: https://tinymusic.ai
author: TinyMusic
license: MIT
tags: [music, song-generation, ai-music, lyrics, text-to-song]
version: 1.0.0
---

# AI Song Generator

Turn a song idea or finished lyrics into a song with TinyMusic. This skill works in two ways: standalone (you prepare everything and the user generates the audio on the website) and connected (you generate it yourself through the `tinymusic` MCP server). Decide which one applies by checking whether the tinymusic tools (`generate_song` and friends) are visible to you.

Tools: `get_credits`, `generate_song`, `get_song_task`

## Rules for both modes

- Original music only. Do not imitate the voice of a living artist and do not reproduce lyrics of existing copyrighted songs. Offer an original song in a similar mood or genre instead.
- **Never claim a song was generated unless a `generate_song` call succeeded and `get_song_task` returned `success`.** In standalone mode no audio exists yet, and you must say so.
- Choose the route by input:

| Situation | Route |
| --- | --- |
| User has an idea or description ("a sad piano ballad about moving away") | Simple mode (connected) / text-to-song page (standalone) |
| User wants no vocals | Simple mode with `instrumental: true` / royalty-free-ai-music page |
| User supplies lyrics, or wants control over title and style | Custom mode (`custom_mode: true`, `title`, `style` and `lyrics` all required) / lyrics-to-song page |

## Without the MCP (standalone)

You do the creative work; the user generates the audio on TinyMusic.

1. **Collect the brief** (ask at most two questions, assume the rest): topic or story, language, genre and mood, vocals (male, female, none), and whether the user already has lyrics.
2. **Write the lyrics** if the user has none (see the `lyrics-writer` skill for craft), and write a **style string**: genre, mood, tempo, 2 to 3 instruments, vocal description, production feel (see `music-style-prompt-guide`).
3. **Deliver a generation pack** in one code block the user can copy:

````
TinyMusic generation pack
Title: <title>
Style: <genre, mood, tempo, instruments, vocals, production>
Language: <lyric language>
Vocals: <male | female | no preference | instrumental>
Lyrics:
[Verse 1]
...
[Chorus]
...
````

   For a description-only (no lyrics) request, the pack is a single well-written song description instead of Title/Style/Lyrics.
4. **Tell the user where to generate it**, and be explicit that nothing has been generated yet:
   - From a description: https://tinymusic.ai/text-to-song-generator or https://tinymusic.ai/ai-music-generator
   - From finished lyrics: https://tinymusic.ai/lyrics-to-song-generator
   - Instrumental only: https://tinymusic.ai/royalty-free-ai-music
   - Paste the pack into the generator's text box; if the page offers separate style or lyrics options, put each part there. Do not claim the page fills anything in automatically. The user signs in and generation uses their account credits.
5. Offer a variation (different style, shorter lyrics, another language) once they have listened.

## With the MCP connected

1. **Check credits.** Tool: `get_credits`. Tell the user a song costs 6 credits and show the balance. Check at least before batch work or when the balance is unknown.
   - If the balance is below 6 or `songs_remaining_today` is 0, stop. For credits give `top_up_url`; for the daily limit give `limits_reset_at`. Do not state limit numbers from memory.
2. **Confirm the plan** in one or two lines (mode, style, language, vocals) unless the user already specified everything or asked you to just go.
3. **Submit.** Tool: `generate_song`.
   - Simple mode: `prompt` required; optionally `instrumental: true` or `vocal_gender`.
   - Custom mode: `custom_mode: true` with `title`, `style` and `lyrics` (all required); `prompt` optional; `instrumental` is ignored here.
   - Always send an `idempotency_key` you create (for example `song-<short-slug>-<n>`, only `A-Za-z0-9._-`, max 80 chars) and keep it for any retry of the same request. Save the returned `task_id`. `created: false` means an existing task with that key was returned and you were not charged again.
4. **Poll.** Tool: `get_song_task`. Wait at least `poll_after_seconds` between calls. Do not poll every second and do not promise how long it will take.
   - `pending` / `processing`: keep waiting.
   - `success`: continue to step 5.
   - `failed`: report `error.message`; credits are refunded automatically. Offer to adjust and retry (use a fresh `idempotency_key` for a changed request).
   - `canceled`: treat it as a terminal failure. Do not tell the user they were refunded; check `get_credits` if they ask.
5. **Deliver.** A task may return more than one song. For each item in `songs` give the title and `audio_url`, plus `duration_seconds` and `image_url` when present (fields can be missing). Tell the user to save the files soon because links are not guaranteed to last; songs are also kept in their library at https://tinymusic.ai/songs (sign-in required). Keep the summary short: what was made, the style used, one next step.

### Handling errors

A failed tool call comes back with `isError: true` and `{"error":{"code","message",...}}`. Act on `code`:

| Code | Do this |
| --- | --- |
| `daily_limit_reached` | Tell the user and give `resets_at`. Do not retry. In the meantime offer the standalone route. |
| `insufficient_credits` | Report `balance` and `required`, and give `top_up_url`. |
| `provider_error` | Credits were refunded. Retry once with the same `idempotency_key`. |
| `provider_unavailable` | Service is temporarily down. Try again later; no need to change parameters. |
| `unauthorized` | The API key is missing or invalid. Ask the user to create one at https://tinymusic.ai/settings/apikeys and set it up as described in the README. |
| `email_not_verified` | Ask the user to verify their email on https://tinymusic.ai. |
| `invalid_params` | Read `message`, fix the arguments, and resubmit. |
| `not_found` | Check the `task_id` (it must come from `generate_song` on the same account). |
| `internal_error` | Report it and try again later. |

### Retry rules

- Never call `generate_song` again for the same request without the same `idempotency_key`.
- After a timeout, network error or unclear response, call `get_song_task` with the `task_id` (or re-send with the same `idempotency_key`) before creating anything new.
- A new creative variation is a new request: use a new `idempotency_key`.

### Output format

```
Song: <title>
Listen: <audio_url>
Style: <style> | Length: <m:ss>   (only the parts that are present)
Credits used: 6
Note: save the file soon; also in https://tinymusic.ai/songs
Next: <one suggestion>
```

Want the agent to generate songs directly? Set up the optional MCP server following the "Optional: connect the MCP server" section of the README.

---
name: lyrics-writer
description: "Write, rewrite or polish song lyrics: verses, choruses, bridges and hooks, in any language. Use when the user says 'write lyrics about...', 'help me with a chorus', 'make these lyrics rhyme', 'improve my lyrics', or in Chinese '写歌词', '帮我改歌词', '作词'. Works standalone and returns a paste-ready package for the TinyMusic generator; with the tinymusic MCP connected it can also call the AI lyrics tool and hand off to song generation."
homepage: https://tinymusic.ai
author: TinyMusic
license: MIT
tags: [lyrics, songwriting, music, ai-music, writing]
version: 1.0.0
---

# Lyrics Writer

Write or rework original song lyrics. This works on its own with no setup; if the `tinymusic` MCP tools are visible to you, you can also use the AI lyrics tool.

Tools: `generate_lyrics`, `get_credits`

## Rules for both modes

- Original lyrics only. Do not reproduce lyrics from existing copyrighted songs, and do not write in a way that is meant to pass as a specific living artist.
- Do not say lyrics came from TinyMusic unless a `generate_lyrics` call succeeded.

## Without the MCP (standalone)

You write the lyrics yourself.

1. **Collect the brief.** Topic, perspective (first person, story, address to "you"), mood, style or genre, language, structure. Ask at most one or two questions; make reasonable choices for the rest.
2. **Write.** Follow the craft notes below. Label sections in square brackets (`[Verse 1]`, `[Chorus]`, `[Bridge]`).
3. **Self-review** before showing: memorable chorus that carries the title idea, one consistent point of view, natural rhyme (slant rhyme is fine), singable line lengths, no filler.
4. **Present** the title, the lyrics, and a suggested style string (genre, mood, tempo, instruments, vocals).
5. **Hand off.** Offer a generation pack the user can paste into TinyMusic: Title, Style, Lyrics in one code block. Say plainly that no audio has been made. Send them to https://tinymusic.ai/lyrics-to-song-generator to turn the lyrics into a song. If they would rather let the site write lyrics for them, https://tinymusic.ai/ai-lyrics-generator is the lyrics page. Do not claim the page pre-fills anything.

## With the MCP connected

1. **Collect the brief** as above.
2. **Generate.** Tool: `generate_lyrics`.
   - `prompt` (required, max 500 chars): the topic and any key images, names or phrases that must appear.
   - `style` (max 100), `mood` (max 100), `language` (max 50, for example `"English"`, `"Chinese"`).
   - `sections`: an ordered list such as `["Verse","Chorus","Verse","Chorus","Bridge","Chorus"]`. Use a shorter list for jingles or hooks.
   - Lyrics are free (0 credits) but limited per day. Check `lyrics_remaining_today` in the result; for the limit or reset time use `get_credits` (`daily_lyrics_limit`, `lyrics_used_today`, `limits_reset_at`). Never quote numbers from memory.
   - Errors come back as `isError: true` with `{"error":{"code","message"}}`. `daily_limit_reached`: tell the user and give `resets_at`; do not retry; offer to write the lyrics yourself instead. `unauthorized`: ask the user to create a key at https://tinymusic.ai/settings/apikeys and configure it as in the README. `invalid_params`: fix the arguments (for example `prompt` must be 500 characters or fewer). `provider_unavailable` / `internal_error`: try again later.
3. **Review and refine.** Check the result against the brief. If it misses, call `generate_lyrics` again with a sharper `prompt`, or make small edits yourself and say so.
4. **Present** `title`, the lyrics grouped by section label, and offer adjustments (more emotional, simpler words, other language, shorter).
5. **Hand off (optional).** If the user wants the song itself, continue with the `ai-song-generator` skill in custom mode: `title`, `style` and `lyrics` are all required, and the `lyrics` returned by `generate_lyrics` can be used as-is. A song costs 6 credits.

## Craft notes

- Structure: Verse tells the story, Chorus states the main idea, Bridge changes angle or emotion. Pre-Chorus is optional.
- Keep chorus lines short and rhythmically similar; verses can be longer.
- Prefer concrete images over abstract statements.
- For non-English lyrics, state the language and do not mix languages unless asked.
- Rhyme should serve meaning; never bend a sentence into nonsense for a rhyme.

## Output

Return the title, then the lyrics with section labels, then one line suggesting a style and next step (for example: "Want me to package this for TinyMusic?").

Want the agent to call the AI lyrics tool and generate songs directly? Set up the optional MCP server following the "Optional: connect the MCP server" section of the README.

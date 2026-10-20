---
name: royalty-free-bgm
description: "Create background music (BGM) for videos, podcasts, games, streams and presentations: instrumental briefs with the right mood, energy arc and loop feel. Use when the user says 'I need background music for my video', 'chill lofi for my stream', 'intro music for my podcast', 'game menu music', or in Chinese '背景音乐', '配乐', '视频BGM'. Standalone it writes a paste-ready instrumental brief for the TinyMusic web generator; with the tinymusic MCP connected it generates the track. For commercial use it points to TinyMusic's Terms of Service."
homepage: https://tinymusic.ai
author: TinyMusic
license: MIT
tags: [bgm, background-music, instrumental, video, podcast, game-audio]
version: 1.0.0
---

# Background Music (BGM)

Design original instrumental background music for a project, and generate it when the `tinymusic` MCP tools are visible to you.

Tools: `get_credits`, `generate_song`, `get_song_task`

## Rules for both modes

- Original music only. Do not ask for "a track that sounds like" a specific existing song or a living artist's recording.
- Never claim a track was generated unless a `generate_song` call succeeded and `get_song_task` returned `success`.

## Licensing: state facts only

The only licensing statement you may make is what TinyMusic's own Terms of Service say: generated content may be used for personal and commercial purposes on every plan, including the free plan, with monetized videos, advertisements, podcasts, games and client work given as examples. Attribute it ("TinyMusic's Terms of Service state ...") and link https://tinymusic.ai/terms-of-service so the user can read the exact wording and conditions. Do not add guarantees beyond it, invent terms, or answer legal questions (client contracts, content-ID or library registration, uploaded audio); say you cannot give legal advice and point to the Terms.

## Without the MCP (standalone)

You write the brief; the user generates the track on the website.

1. **Understand the use.** Medium (video, podcast, game, stream, presentation), mood, energy over time, rough length wanted, whether it must loop, and a "no" list (no drums, nothing busy under speech).
2. **Write the instrumental brief** from the recipes below: genre, mood, tempo, instruments, energy arc, loop feel, and the words "instrumental, no vocals".
3. **Deliver a paste-ready pack** in one code block, and offer 2 alternate takes (for example calmer / more upbeat):

````
TinyMusic generation pack (instrumental)
Description: <one paragraph: genre, mood, tempo, instruments, energy arc, loop feel, no vocals>
Use: <video | podcast | game | stream | presentation>
````

4. **Say clearly that no audio has been made.** Send the user to https://tinymusic.ai/royalty-free-ai-music to generate it, signed in, using their account credits. Paste the description into the generator's text box. Do not claim the page pre-fills anything. Length is not something the prompt can guarantee, so suggest trimming or looping in their own editor if needed.
5. For commercial use, remind them that TinyMusic's Terms of Service cover it and link https://tinymusic.ai/terms-of-service (see above).

## With the MCP connected

1. **Check credits.** Tool: `get_credits`. A track costs 6 credits; tell the user. If the balance is below 6 or `songs_remaining_today` is 0, stop: give `top_up_url` for credits or `limits_reset_at` for the daily limit, and fall back to the standalone route. Do not state limit numbers from memory.
2. **Submit (simple mode).** Tool: `generate_song` with `instrumental: true` and `custom_mode: false` (instrumental only works in simple mode). Put the brief in `prompt`. Send your own `idempotency_key` and reuse it for any retry of the same request.
3. **Poll.** Tool: `get_song_task`, waiting at least `poll_after_seconds` between calls. On `failed` (credits are refunded automatically) offer an adjusted retry with a new `idempotency_key`. Treat `canceled` as a terminal failure and do not assume a refund.
4. **Deliver.** Give each song's `audio_url` and, when present, `duration_seconds` (fields can be missing). Tell the user to download and save the files soon, since links are not guaranteed to last; tracks are also in their library at https://tinymusic.ai/songs (sign-in required). Add one tip for using it.

### Handling errors

A failed call returns `isError: true` with `{"error":{"code","message"}}`. `daily_limit_reached`: tell the user and give `resets_at`, do not retry. `insufficient_credits`: report `balance` and `required`, give `top_up_url`. `provider_error`: credits were refunded; retry once with the same `idempotency_key`. `provider_unavailable`: try again later. `unauthorized`: ask the user to create a key at https://tinymusic.ai/settings/apikeys and configure it as in the README. `not_found`: check the `task_id`. `invalid_params`: fix the arguments.

## Prompt recipes

Describe the track so it sits under other content:

| Use | Description pattern |
| --- | --- |
| Talking-head video / podcast bed | "Soft instrumental underscore, 85 bpm, warm electric piano and light pads, minimal percussion, steady and unobtrusive, no melodic lead that competes with speech" |
| YouTube / vlog | "Upbeat acoustic pop instrumental, 110 bpm, clapping and ukulele, bright and friendly, clear intro" |
| Game menu / ambient | "Atmospheric ambient instrumental, slow evolving pads, subtle chimes, calm and mysterious, loops smoothly" |
| Game combat | "Driving electronic instrumental, 140 bpm, aggressive bass and percussion, tense and intense, sustained energy" |
| Live stream / chill | "Lo-fi hip hop instrumental, 75 bpm, mellow keys and vinyl crackle, relaxed, steady groove, no big changes" |
| Corporate / presentation | "Inspiring corporate instrumental, 100 bpm, light piano, clean guitar, gentle build, optimistic" |
| Trailer / intro sting | "Cinematic build, orchestral hits, rising tension, big final impact" |

Tips:
- **Loop feel:** ask for "steady", "consistent energy", "no dramatic build or ending" for loops; "slow build and a clear ending" for intros and outros.
- **Under speech:** sparse arrangement, mid-range instruments, no prominent lead.
- **Mood vocabulary:** calm, hopeful, playful, suspenseful, epic, nostalgic, dark, energetic.
- For stronger style control see the `music-style-prompt-guide` skill.
- Offer variations by changing one thing at a time (tempo, lead instrument, energy).

Want the agent to generate tracks directly? Set up the optional MCP server following the "Optional: connect the MCP server" section of the README.

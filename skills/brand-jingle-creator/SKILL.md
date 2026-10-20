---
name: brand-jingle-creator
description: "Design short brand jingles, sonic logos and intro/outro music for shops, products, podcasts, YouTube and short videos. Use when the user says 'make a jingle for my coffee shop', 'podcast intro music', 'a catchy sound for my brand', 'ad jingle for TikTok', or in Chinese '品牌广告歌', '店铺jingle', '片头音乐', '短视频开场音乐'. It turns a short brief into a few distinct directions, then a paste-ready pack, or generates the track if the tinymusic MCP is connected."
homepage: https://tinymusic.ai
author: TinyMusic
license: MIT
tags: [jingle, brand-audio, sonic-logo, intro, outro, advertising, podcast]
version: 1.0.0
---

# Brand Jingle Creator

Turn a brand brief into a short, distinct audio idea: a sonic logo, a sung jingle, or an intro/outro bed. The craft here is in the short structure and in choosing between a few clearly different directions.

Tools: `get_credits`, `generate_song`, `get_song_task`

## Rules for both modes

- Original music only. No imitating a living artist's voice and no echoing an existing famous jingle or slogan melody.
- Never claim a track was generated unless a `generate_song` call succeeded and `get_song_task` returned `success`.
- **Licensing: attribute, do not invent.** TinyMusic's Terms of Service state that generated content may be used commercially on every plan; link https://tinymusic.ai/terms-of-service for the exact wording. For advertising or paid campaigns, tell the user to read it themselves. Do not add guarantees beyond it or give legal advice (for example on trademark clearance of a brand name).
- **Brand names are not guaranteed to be sung correctly.** Models can mispronounce or smear a brand name. Tell the user to listen carefully. If the name comes out wrong, offer: a phonetic spelling in the lyrics (for example "Kuh-VEE-tah"), a spoken tagline over an instrumental, or an instrumental-only jingle.

## The brief

Ask in one compact message:

1. **Brand name and how to say it** (pronunciation, language).
2. **One-sentence core promise** ("fresh bread, baked before sunrise").
3. **Where it plays:** ad, video intro/outro, promo, podcast opener, on-hold, in-store, short-video hook.
4. **Duration idea:** a sonic logo is a few seconds, a hook-style jingle is short, a full spot bed is longer. Treat length as a design goal; the generator may not hit an exact length, so tell the user they can trim or loop in their editor. Never promise a specific generation length.
5. **Vocals:** sung brand name and tagline, spoken tagline over music, or instrumental only.
6. **Mood and instruments:** warm, premium, playful, techy; acoustic, synth, brass, handclaps.
7. **Avoid:** sounds or clichés the brand does not want.

## Short-form structure ideas

| Format | Structure |
| --- | --- |
| Sonic logo | One memorable motif (3 to 5 notes) with a clear ending; usually no lyrics or just the brand name |
| Hook jingle | Brand name + promise in a 4-line hook, repeated once; end on the brand name |
| Spot bed | Short intro, a body that stays out of the way of the voiceover, a clean button ending |
| Intro/outro | Intro: energy and a quick identity statement. Outro: gentler and resolving |

Keep lyrics to a few short lines: the brand name, the promise, and a call to action at most. Repeat the brand name rather than adding more words.

## Offer three directions

Give the user three clearly different options to pick from, for example:

- **A: Warm and acoustic.** Handclaps, ukulele or guitar, friendly voice, mid-tempo.
- **B: Modern and punchy.** Synth bass, tight drums, confident vocal, higher energy.
- **C: Minimal sonic logo.** Piano or mallets, a single motif, instrumental.

For each: a one-line description, a style string, and the (short) lyrics if sung. Let the user choose, mix, or ask for new directions before producing anything.

## Without the MCP (standalone)

1. Run the brief, present the three directions, and refine the chosen one.
2. Deliver a pack in one code block:

````
TinyMusic generation pack (jingle)
Title: <brand> jingle
Style: <genre, mood, tempo, instruments, vocals, production>
Lyrics:
<short hook lines with brand name, phonetic spelling if needed>
(or) Description: <instrumental brief, no vocals>
Pronunciation notes: <how to say the brand name>
````

3. Say plainly that **no audio has been generated yet**. For a sung jingle with lyrics go to https://tinymusic.ai/lyrics-to-song-generator; for an instrumental or sonic-logo bed use https://tinymusic.ai/royalty-free-ai-music. Paste the pack into the generator's text box and do not claim the page pre-fills anything. Remind the user to listen to how the brand name sounds.

## With the MCP connected

1. Tool: `get_credits`. Each attempt costs 6 credits; tell the user, since jingles often take a few tries. If the balance is below 6 or `songs_remaining_today` is 0, stop and give `top_up_url` or `limits_reset_at`; do not quote limit numbers from memory; offer the standalone pack.
2. Tool: `generate_song`.
   - Sung jingle: custom mode, `custom_mode: true` with `title`, `style` and `lyrics` (all required).
   - Instrumental or sonic logo: simple mode with `instrumental: true` and the description in `prompt`.
   - Send an `idempotency_key` per direction and reuse it for retries of the same request.
3. Tool: `get_song_task`, waiting at least `poll_after_seconds`, until `success`, `failed` or `canceled`. `failed`: credits are refunded automatically. `canceled`: terminal failure, no assumed refund.
4. Deliver `audio_url` (and `duration_seconds` when present), advise saving the file soon since links are not guaranteed to last (also in https://tinymusic.ai/songs, sign-in required), and ask the user to check the brand-name pronunciation. Offer the fallback options above if it is off. A changed request needs a new `idempotency_key`.

Error codes: `daily_limit_reached` (give `resets_at`, do not retry), `insufficient_credits` (report `balance` and `required`, give `top_up_url`), `provider_error` (refunded; retry once with the same key), `provider_unavailable` (try later), `unauthorized` (create a key at https://tinymusic.ai/settings/apikeys and configure it as in the README), `invalid_params` (fix arguments), `not_found` (check `task_id`).

Want the agent to generate the jingle directly? Set up the optional MCP server following the "Optional: connect the MCP server" section of the README.

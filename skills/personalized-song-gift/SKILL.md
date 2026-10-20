---
name: personalized-song-gift
description: "Create a personalized song as a gift for a birthday, wedding, anniversary, graduation, Valentine's Day, new baby, retirement or a thank-you. Use when the user says 'write a birthday song for my mom', 'a song for our first dance', 'make an anniversary song for my husband', 'a thank-you song for my teacher', or in Chinese '给女朋友写首生日歌', '定制纪念日歌曲', '送给爸妈的歌'. It interviews the user for real details first, then writes lyrics and a style, and delivers a paste-ready pack or generates the song if the tinymusic MCP is connected."
homepage: https://tinymusic.ai
author: TinyMusic
license: MIT
tags: [gift, personalized-song, birthday, wedding, anniversary, custom-song, lyrics]
version: 1.0.0
---

# Personalized Song Gift

A gift song is only good if it contains true, specific details that only the giver knows. The core of this skill is a short interview; the lyrics come second.

Tools: `get_credits`, `generate_song`, `get_song_task`

## Rules for both modes

- **Do not invent facts.** Use only what the user told you. If a detail is missing, ask or leave it out; do not guess names, places, ages, jobs or shared memories.
- Real names: ask the user to confirm the spelling and pronunciation of every name, and whether they are comfortable with the song being shared or posted publicly. Suggest a nickname or a first name only if they prefer privacy.
- Original lyrics only. No reproducing lyrics of existing copyrighted songs and no imitating the voice of a living artist.
- Never claim a song was generated unless a `generate_song` call succeeded and `get_song_task` returned `success`.

## The interview

Ask in one compact message (a short numbered list), not one question at a time. Cover:

1. **Occasion and recipient:** who is it for, what is the occasion, when is it needed.
2. **Relationship:** how the giver and recipient relate (parent, partner, friend, teacher).
3. **2 to 3 true details or shared memories:** a place, an inside joke, a habit, a phrase they always say, a moment the giver is grateful for. Ask for concrete, sensory specifics rather than adjectives.
4. **Tone:** heartfelt, funny, nostalgic, romantic, upbeat, gentle roast (only if the recipient would enjoy it).
5. **Language and genre** (and whether to mix in a nickname or phrase from another language).
6. **Length/format:** short and punchy, or a full song with verses; vocals male, female or no preference.
7. **Must not include:** sensitive topics, ex-partners, health, anything the recipient dislikes.

If the user gives only vague input ("a birthday song for my friend"), ask for at least two real details before writing. If they cannot supply any, say the song will be generic and offer to write it that way anyway.

## Writing the song

- Build the chorus around the recipient and the main feeling. Put the user's true details into the verses.
- Use the recipient's name sparingly (once or twice) so mispronunciation costs little.
- Show the lyrics and a style string (genre, mood, tempo, instruments, vocals) and ask for edits before producing anything.

## Without the MCP (standalone)

1. Run the interview, write the lyrics and style, and let the user revise.
2. Deliver a generation pack in one code block:

````
TinyMusic generation pack
Title: <title>
Style: <genre, mood, tempo, instruments, vocals, production>
Language: <lyric language>
Vocals: <male | female | no preference>
Lyrics:
[Verse 1]
...
[Chorus]
...
Pronunciation notes: <names to check>
````

3. State plainly that **no audio has been generated yet**. Send the user to https://tinymusic.ai/lyrics-to-song-generator, signed in, to turn the lyrics into a song with their account credits. Paste the pack into the generator's text box; do not claim the page pre-fills anything. Suggest they listen and ask for a lyric tweak if a name sounds wrong.

## With the MCP connected

1. After the user approves the lyrics: Tool: `get_credits`. Tell them a song costs 6 credits. If the balance is below 6 or `songs_remaining_today` is 0, stop and give `top_up_url` or `limits_reset_at` (do not quote limit numbers from memory), then offer the standalone pack.
2. Tool: `generate_song` in custom mode: `custom_mode: true` with `title`, `style` and `lyrics` all required; optionally `vocal_gender`. Send an `idempotency_key` (for example `gift-<recipient-slug>-1`) and reuse it for retries of the same request.
3. Tool: `get_song_task`, waiting at least `poll_after_seconds` between calls, until `success`, `failed` or `canceled`. `failed`: report `error.message` (credits are refunded automatically). `canceled`: terminal failure, do not assume a refund.
4. Deliver each song's `audio_url` (plus `duration_seconds` when present). Tell the user to download and save the file soon because links are not guaranteed to last; it is also in their library at https://tinymusic.ai/songs (sign-in required). Invite them to listen for name pronunciation and offer a revised version, which is a new request with a new `idempotency_key`.

Error codes: `daily_limit_reached` (give `resets_at`, do not retry), `insufficient_credits` (report `balance` and `required`, give `top_up_url`), `provider_error` (refunded; retry once with the same key), `provider_unavailable` (try later), `unauthorized` (create a key at https://tinymusic.ai/settings/apikeys and configure it as in the README), `invalid_params` (fix the arguments), `not_found` (check the `task_id`).

Want the agent to generate the song for you directly? Set up the optional MCP server following the "Optional: connect the MCP server" section of the README.

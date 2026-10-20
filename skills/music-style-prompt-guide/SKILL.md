---
name: music-style-prompt-guide
description: "Explain how to write effective AI music prompts and style strings: genre, mood, tempo/BPM, instruments, vocals and production feel, with good vs. weak examples and fill-in templates. Use when the user asks 'how do I prompt AI music', 'what do I put in the style box', 'make my music prompt better', or in Chinese '音乐风格怎么写', '提示词怎么写'. Knowledge only; no tools or setup needed."
homepage: https://tinymusic.ai
author: TinyMusic
license: MIT
tags: [prompt-engineering, music, style, ai-music, guide]
version: 1.0.0
---

# Music Style Prompt Guide

A reference for turning a vague musical idea into a precise description that AI music models respond well to. This skill is knowledge only and needs no tools or setup. When the user is ready to create the song, suggest the `ai-song-generator` skill.

## The six ingredients

Cover as many as are relevant, in roughly this order of importance:

1. **Genre / sub-genre**: "indie folk", "synthwave", "lo-fi hip hop", "trap", "bossa nova". A sub-genre beats a broad genre.
2. **Mood / emotion**: "nostalgic", "triumphant", "melancholic but hopeful", "tense".
3. **Tempo**: a number is clearer than a word. "80 bpm" or "slow, laid-back". Rough guide: 60-80 ballad / lo-fi, 90-110 mid-tempo pop, 120-130 dance / house, 140+ drum and bass, punk, fast trap hi-hats.
4. **Instrumentation**: lead and texture instruments. "fingerpicked acoustic guitar, soft upright bass, brushed drums", "warm analog synth pads, punchy 808".
5. **Vocals**: gender, delivery, density. "airy female vocal, intimate, close mic", "male baritone, gritty", "no vocals". Use the `vocal_gender` field for m/f; use `instrumental` for no vocals in simple mode.
6. **Production feel**: "lo-fi tape warmth", "polished radio-ready pop", "live room recording", "wide cinematic reverb", "dry and punchy".

Optional extras: era ("90s", "2000s"), region or scene ("Nordic", "Tokyo city pop"), structure hints ("slow build, big final chorus"), and what to avoid ("no autotune", "no drop").

## Good vs. weak

| Weak | Why | Better |
| --- | --- | --- |
| "a nice song" | No genre, mood or sound | "dreamy indie pop, wistful, 100 bpm, shimmering guitars, soft female vocal" |
| "rock" | Too broad | "gritty garage rock, raw energy, 150 bpm, distorted guitars, shouted male vocal" |
| "sad music" | Emotion only | "slow piano ballad, heartbreak, 62 bpm, felt piano, light strings, breathy male vocal" |
| "like [famous artist]" | Imitation of a living artist is not supported and gives unreliable results | Describe the sound itself: genre, instruments, vocal tone, era |
| 15 stacked genres | Contradictory, muddy | Pick one main genre and at most one flavor |

Rules of thumb:
- 3 to 8 descriptors is usually enough. More is rarely better.
- Do not mix contradicting tempo or energy words (for example "chill" and "aggressive").
- Put the most important thing first.
- Style terms in English are the safest default, even when the lyrics are in another language; state the lyric language explicitly in the lyrics or prompt.

## Templates

**Style string (custom mode, `style` field, up to 1000 chars):**

```
<sub-genre>, <mood>, <tempo> bpm, <2-3 key instruments>, <vocal description>, <production feel>
```

Example: `synthwave, nostalgic and driving, 118 bpm, analog arpeggios, gated reverb snare, warm male vocal, glossy 80s production`

**Simple-mode description (`prompt` field):**

```
A <mood> <genre> song about <topic/story>, <tempo/energy>, featuring <instruments>, with <vocal description>.
```

Example: `An uplifting folk-pop song about driving home after a long year away, mid-tempo, featuring acoustic guitar and handclaps, with a warm female vocal and a sing-along chorus.`

**Instrumental:** `<genre> instrumental, <mood>, <tempo> bpm, <instruments>, <structure or loop feel>, no vocals`

## Genre quick-picks

| Goal | Starting point |
| --- | --- |
| Study / focus | lo-fi hip hop, mellow, 70-85 bpm, soft keys, vinyl crackle |
| Workout | high-energy electro pop or trap, 125-145 bpm, heavy bass, anthemic hook |
| Cinematic | orchestral, slow build, strings and brass, wide reverb |
| Cozy / acoustic | indie folk, warm, 90-105 bpm, fingerpicked guitar, soft vocal |
| Retro | synthwave or city pop, 100-120 bpm, analog synths, gated drums |

## Next step

Offer to assemble the final style string or prompt for the user. To turn it into audio, paste it into the TinyMusic generator: https://tinymusic.ai/text-to-song-generator for a description, https://tinymusic.ai/lyrics-to-song-generator if you also have lyrics, or https://tinymusic.ai/royalty-free-ai-music for instrumentals. With the tinymusic MCP connected, the `ai-song-generator` skill can generate it directly (6 credits per song). Do not claim the website pre-fills anything.

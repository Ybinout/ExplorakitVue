# Combat audio, version 1

Build-time packs contain 1,432 mono MP3 samples (32 kHz, 64 kbit/s): 623
dedicated move samples and 809 species cries. Browsers request individual files
only; the full catalogue is never downloaded or decoded at combat startup.

The supplied Scarlet/Violet archives provide the `PV=INDEX` cry for 427 species.
This is an emotional variant label, not a sex identifier. The remaining 382
species use the [PokeAPI cries collection](https://github.com/PokeAPI/cries),
whose sources are documented in that repository. The supplied Sun/Moon archive
provides move samples; numbered one-hit versions cover multi-hit moves.
`Vice Grip`, `Judgement` and `Celebrate` map to the engine's canonical names.
English names and French labels have separate indexes: French “Charge” means
Tackle, whereas canonical English “Charge” means Chargeur.

Seventeen moves use the same short synthesized fallback. See the complete list
in the parent repository's `docs/ATTACK_AUDIO_GENERIC.txt`. The supplied
`Assist.mp3` cannot be decoded and is explicitly included in that list.

Rebuild with `python3 scripts/importCombatAudio.py --resources DIR --ffmpeg PATH`
from the parent repository. Input archive hashes and source names are recorded
in `manifest.json`; no original archive is required to build or run the client.
`scripts/unpackCombatAudio.cjs` checks pack and per-file checksums, validates
paths/headers and restores the ignored `public/audio/combat/v1` directory.
Regeneration is offline except for the explicitly recorded missing cries.

Normalization trims boundary silence, targets RMS 0.112 and caps the pre-encode
peak at 0.72; MP3 output is validated in Chromium and WebKit. Maximum decoded
sample duration is below ten seconds. The runtime keeps at most 12 MiB of
decoded samples, cancels on shutdown and uses one move and one cry channel in
the existing AudioContext. Cries are scheduled on the AudioContext clock with the same 340 ms delay as the Ball bloom; a reduced-motion entrance plays immediately. CSS event delivery never determines when the audio starts. Impacts duck the move channel. Muting, reduced
motion and autoplay restrictions keep their existing semantics; failed loads
never produce a late sound, and a missing move sample uses the common fallback.

Keep this URL version immutable; use a new version when changing sample bytes.

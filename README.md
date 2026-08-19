# Maru Batsu — kana practice

A tiny drill game for learning to read Japanese kana. A character appears on
manuscript paper, you pick the sound it makes, and a red teacher's stamp lands
on the page: **○ maru** for right, **✕ batsu** for wrong. Your device's Japanese
voice reads the character you tapped out loud, right or wrong, so every answer
is a pronunciation lesson.

One HTML file. No backend, no build step, no dependencies, no accounts, no
tracking. Everything is stored in `localStorage` on your device, so it works
fully offline once the page has loaded.

## Play

- **Character → sound** — see あ, pick `a`
- **Sound → character** — see `a`, pick あ
- **Mix both**

Character sets: hiragana, katakana, or both. Optional dakuten/handakuten
(が, ぱ) and combo sounds (きゃ, しゅ).

### The ladder

You don't face the whole alphabet on day one. Practice opens with **two
characters**. Answer each of them correctly **10 times** and a third character
joins. Every count then resets to zero, so the new character is drilled
*alongside* the old ones rather than instead of them — you clear all three at 10
each to earn a fourth, and so on in gojūon order until the whole set is in play.

The bar across the top is the ladder, not the round: it fills as you bank
correct answers on the characters currently unlocked, and the label tells you
exactly how many are left before the next one appears. Unlocking is celebrated,
and the new character is spoken aloud so you hear it before you have to
recognize it.

### Unlock order

Two orders, switchable in Settings, each with its own separate ladder:

- **Gojūon** (default) — dictionary order, あいうえお / かきくけこ. This is Japan's
  alphabetical order: dictionaries, indexes, and phone lists collate by it, and
  verb conjugation walks across its rows (書か / 書き / 書く / 書け / 書こ). Learning
  in this order keeps your mental index aligned with every other Japanese
  resource you'll touch.
- **Most common first** — い ん か う た の は し に を く て… Frequency-ranked, so
  the characters you'll actually meet in text arrive first and you can start
  decoding sooner.
- **Course order (phrases)** — す し と お ちゃ く だ さ… A vocabulary-first path of
  71 characters, ordered so that the words come first and the characters arrive
  as the words need them. It mixes hiragana, katakana, dakuten and combos from
  the start (ちゃ is the fifth character you learn, ラーメン arrives around 35),
  so the character-set and extras toggles don't apply while it's selected. The
  sequence is derived from the vocabulary progression of the first ten beginner
  sections of a widely used Japanese course; every sentence shown in the app is
  our own, written from that vocabulary. っ and ー are omitted from the ladder
  on purpose — they're written marks rather than sounds you have to learn.

The frequency ranking comes from a count of every kana in the readings of the
5,000 sentences in Tono, Yamazaki & Maekawa's *A Frequency Dictionary of
Japanese* (2013), tabulated at
[gist.github.com/fasiha](https://gist.github.com/fasiha/0f8a49868bbd0c532614).
Two honest caveats: ranks are computed on hiragana and katakana inherits its
partner's rank, but katakana in real text skews toward loanword sounds
(ン, ス, ト, ル), so the katakana ordering is an approximation. And ranking is
applied *within* each category rather than globally — が is more frequent than
お, but が is か plus a diacritic, so all 46 base characters come before dakuten
and combos regardless of count.

### Words you can read

Every unlock screen shows up to five real Japanese words spellable with exactly
the characters you've earned — tap any of them to hear it read aloud. Three
characters into the frequency ladder you're already reading いか (squid); by
five, うた (song) and たかい (tall).

Words using the newest character come first, and multi-kana words are preferred
over single-character nouns so the list stays interesting. Katakana learners get
animal, plant, and food names (イカ, サクラ, キツネ) alongside the loanwords,
because Japanese conventionally writes those in katakana and the loanwords are
too long to be readable early. No word contains a small っ, so everything shown
is spelled with exactly the characters on your ladder; the katakana length mark
ー is treated as free, since it isn't a character you have to learn.

Your level is saved per character set — hiragana alone, katakana alone, and
each combination with dakuten or combos keep their own ladders, so switching
sets never costs you progress. Everything survives closing the app.

Because counts reset, questions are spread roughly evenly across everything
unlocked — at level 10 each character takes 8–13% of the questions, with a mild
lean toward the newcomer you've never seen. The flip side is that levels get
longer as they grow: level 3 takes about 35 questions, level 20 about 270, and
clearing all 46 runs to roughly 13,000 answers at 85% accuracy. That's a
months-long ladder by design.

The answer buttons are always filled to four even when only two characters
are unlocked, with the extras drawn from characters you haven't reached yet. A
level-1 question is still a one-in-four choice, never a coin flip.

Prefer the old behavior? **Settings → Difficulty → Practice everything** puts
all characters in play at once. Your ladder position is kept and waiting.
**Restart this ladder** drops back to two characters and clears the rep counts,
while leaving your lifetime accuracy history intact.

### Everything else

Rounds are 12 questions. Characters you get wrong come back more often — the
picker weights each character by your own accuracy on it. Wrong answers are
drawn from genuinely confusable characters (シ/ツ/ソ/ン, ぬ/め/ね/わ) rather
than at random, so a guess is a real guess. In sound → character questions, no
two buttons ever share a sound or mix scripts, so there is never more than one
right answer.

Tap 📊 for how many characters you've unlocked, your accuracy, and every character you've answered, sorted worst-first.

Keyboard: `1`–`4` answer, `Esc` closes a panel.

## Sound

Two independent switches in ⚙ Settings:

- **Japanese voice** — the browser's built-in `speechSynthesis`, `ja-JP`. Two
  modes: **read the character I tap** (the default) speaks the sound of whatever
  button you pressed, right or wrong — miss it and you hear your pick followed
  by the correct one, so a mistake still teaches you two sounds. **はい / ざんねん**
  is the reaction mode instead, if you'd rather be cheered at than corrected.
  If you hear nothing, your device has no Japanese voice installed. On iOS:
  Settings → Accessibility → Spoken Content → Voices → Japanese. On Android,
  install Japanese for Google Text-to-Speech.
- **Beeps** — synthesized with the Web Audio API, always available.

Browsers block audio until you interact with the page, so the first tap is what
turns sound on.

## Publish it on GitHub Pages

1. Create a public repo (e.g. `maru-batsu`) and push `index.html`, `README.md`,
   and `LICENSE` to the default branch.
2. Repo → **Settings** → **Pages** → Source: *Deploy from a branch*, branch
   `main`, folder `/ (root)`. Save.
3. A minute later it's live at `https://<your-username>.github.io/maru-batsu/`.

```bash
git init
git add index.html README.md LICENSE
git commit -m "Maru Batsu: kana practice game"
git branch -M main
git remote add origin git@github.com:<your-username>/maru-batsu.git
git push -u origin main
```

To run it locally, open `index.html` in a browser — that's the whole thing.

## Add to your home screen

**iOS Safari:** Share → Add to Home Screen. **Android Chrome:** ⋮ → Add to Home
screen. It opens full-screen with its own icon and keeps your progress.

## Your data

Everything lives in a single `localStorage` key, `maru-batsu.v1`, on the device
you played on. Nothing is sent anywhere. Progress does not sync between devices,
and clearing your browser data or using private browsing will erase it.
**Erase all progress** in 📊 wipes the key immediately.

## Design notes

The prompt sits in a 原稿用紙 (*genkō yōshi*) cell — the squared manuscript paper
Japanese students use to practice handwriting, complete with its dotted cross
guides. Feedback uses the marking convention teachers actually use: a hand-drawn
maru or batsu in correction-ink vermilion, stamped down over the character.
Status is never carried by color alone — ○/✕ appear on the stamp, on the chosen
button, and in the text line beneath.

The big character is set in a mincho (serif) face so the strokes match printed
Japanese; the interface uses a rounded gothic. Both come from system font
stacks, because a web font download would break the offline promise.

## License

MIT — see [LICENSE](LICENSE).

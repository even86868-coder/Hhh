# Rise of the Runelords · Pixel Adventure

A cute pixel-art phone game retelling **Chapter 1 (Burnt Offerings)** of the *Rise of the Runelords* Adventure Path, played with **Pathfinder 1st Edition** combat rules.

- **You make one hero** with full character creation: 7 races, 8 classes, 20-point buy, two equipment kits per class, feats, trained skills and pixel appearance (skin, hair, style, outfit, beard).
- **3 AI companions** fill the party roles you didn't take (Brannoc the fighter, Tamsin the cleric, Quillan the wizard, Pip the rogue).
- **A branching story**: 89 story nodes, 15 battle maps and 26 skill checks rolled with your real skill bonuses. Choices change routes, allies, the battles you fight and the ending.
- **Tactical grid combat following the PF1 rules**: initiative; standard, move, swift, full-round and 5-ft step actions; attacks of opportunity; flanking; critical threats and confirmation; sneak attack; touch AC and flat-footed AC; cover; firing into melee; range increments; casting defensively; the 5/10 diagonal rule; difficult terrain; dying and stabilizing; damage reduction; saves; spell slots; channel energy; rage; smite evil; lay on hands; Power Attack; Cleave; Rapid Shot; and more.
- **Watch mode**: tap 🤖 at any time and the AI plays for you. It makes story choices in character (based on your hero's personality and best skills), levels up, and fights every battle. Tap 🤖 again to take back control. **Watch AI Play** on the title screen starts a game with a random AI hero.
- **Party dialogue and voices**:
  - The party talks in story scenes, at campfires and mid-battle (speech bubbles over the pixel characters).
  - Each companion has their own personality, and your hero speaks in the personality you pick: Heroic, Cheerful, Grim or Snarky.
  - Goblins and bosses taunt you.
  - Every character speaks with their own voice through your device's built-in speech synthesis (free, offline). A narrator (the Game Master) reads the story aloud.
- **Optional live AI banter**: enter your own Anthropic API key in Settings → Live AI banter, and Claude writes fresh dialogue for each story scene as you play. The key stays on your device; if anything fails, the game falls back to its written lines.
- Works offline as an installable PWA. Everything (art, music, sound effects) is generated procedurally. No build step, no dependencies.

## Play on your phone

1. Push to `main` and enable **Settings → Pages → Source: GitHub Actions**. The included workflow publishes the game.
2. Open the Pages URL on your phone, then use **Add to Home Screen** (Safari share menu, or the Chrome menu). It runs full-screen and offline like a native app.

Want an App Store or Play Store build? The game is static HTML/JS, so it can be wrapped as-is with [Capacitor](https://capacitorjs.com/) (`npx cap init`, set `webDir` to this folder, `npx cap add ios` / `android`).

## Recorded voice pack

Every fixed line in the game (combat reactions, party conversations, campfire talks, Game Master lines, story narration) can be recorded as an audio file with an AI voice service, so characters sound like voice actors instead of text-to-speech. The game plays a recording when one exists and uses the device's built-in voices for everything else (for example, lines that say your hero's name, live AI banter, and skill-check numbers).

Each character's voice and acting direction is set in `voices/cast.json`.

**Generate it on GitHub with ElevenLabs (no setup on your computer):**
1. Create an ElevenLabs account and copy your API key (Profile → API Keys).
2. In the repo: **Settings → Secrets and variables → Actions → New repository secret**, named `ELEVENLABS_API_KEY`.
3. **Actions → Generate voice pack → Run workflow** with **cast only**. It picks a voice from your ElevenLabs account for every character and saves the choices in `voices/cast.json` (you can edit any of them to a voice name you like).
4. Run it again with **record a sample (20 lines)** and listen to the clips in `voices/clips/`.
5. Run it with **record everything missing**. If your monthly credits run out, it stops and keeps everything recorded so far; run it again next month to finish.

**Or locally:** `ELEVENLABS_API_KEY=... node tools/cast-voices.mjs` casts the voices, `node tools/generate-voices.mjs --dry-run` shows how many lines and characters will be recorded (and your remaining credits), and `ELEVENLABS_API_KEY=... node tools/generate-voices.mjs` records them. OpenAI also works: set `"provider": "openai"` in `voices/cast.json` and use `OPENAI_API_KEY`.

**Models and acting:** character lines are recorded with **Eleven v4** and story narration with **Eleven v4 Turbo** (half the credits). The whole game is about 86,000 credits (Eleven v4 bills about half a credit per character, v4 Turbo about a quarter). Eleven v4 acts out audio tags, so lines get one automatically based on the moment: critical hits sound `[excited]`, a fallen ally gets `[shouting]`, goblins `[cackling]`, and so on. Tags only change the performance, never the text on screen. Edit or turn them off under `elevenlabs.tags` in `voices/cast.json`. If your account doesn't have Eleven v4 yet, the recorder switches to Multilingual v2 / Flash on its own (and leaves the tags out) and tells you in the log.

When new story content adds lines, run it again: it only records what's new.

## Play on your PC

Every push to `main` builds the PC versions automatically and publishes them on the repo's **Releases** page (https://github.com/even86868-coder/Hhh/releases/latest):

| File | What it is |
| --- | --- |
| `Runelords-Setup-x.y.z.exe` | Windows installer (Start menu + desktop shortcut) |
| `Runelords-Portable-x.y.z.exe` | Windows, no install: just double-click |
| `Runelords-x.y.z-mac.dmg` | macOS app |
| `Runelords-x.y.z.AppImage` | Linux app |
| `Runelords.html` | The whole game in one file: double-click to play in any browser |

The apps aren't code-signed, so Windows may say "Windows protected your PC" (click **More info → Run anyway**). On a Mac, right-click the app and choose **Open** the first time.

**Desktop controls:** mouse plus keyboard. Number keys `1`-`9` pick story choices and battle actions, `Esc` cancels, `E` ends your turn, `Enter` confirms dialogs, and `F11` toggles fullscreen in the app. On wide screens the battle map sits beside the controls and the full battle log.

Build it yourself (needs Node.js 22):

```sh
npm install
npm start                # run the desktop app
npm run dist:win         # build Windows installer + portable exe into release/
npm run standalone       # build dist/Runelords.html
```

## Run locally

```sh
npx http-server -c-1 .     # then open http://localhost:8080
node tests/sim.mjs 20      # headless balance test: AI plays every battle with every class
```

## Code map

| File | What it does |
| --- | --- |
| `js/rules.js` | PF1 races, classes, feats, skills, equipment, progression, derived stats, companions |
| `js/combat.js` | Grid combat engine (pure logic, no DOM) |
| `js/ai.js` | Tactics for companion bots and monsters |
| `js/spells.js`, `js/monsters.js` | Spell and monster definitions |
| `js/story.js`, `js/maps.js` | The branching story graph and battle maps |
| `js/sprites.js`, `js/render.js` | Procedural pixel art and the combat renderer |
| `js/ui.js`, `js/game.js` | Screens, character creation, saves, story effects |
| `js/dialogue.js` | Written dialogue: combat barks, scene banter, campfire talks, personalities |
| `js/talk.js`, `js/voice.js` | Who says what and when; character voices via speech synthesis |
| `js/aibanter.js` | Optional live banter through the Claude API (official SDK, bundled in `js/vendor/`, rebuilt with `node tools/build-vendor.mjs`) |
| `desktop/main.cjs` | Electron wrapper for the PC app |
| `tools/build-standalone.mjs` | Builds the single-file HTML version |

To add Chapter 2, extend `STORY` with new nodes and `ENCOUNTERS` with new maps; the engine is data-driven.

## Simplifications

These are the honest deviations from tabletop PF1:
- Prepared casters cast any known spell from their daily slots (no preparation step).
- Clerics get Selective Channeling for free.
- Companions who die are revived after the battle. If your own hero dies, it's game over and you retry the battle.

---

*Unofficial fan game.* Pathfinder and Rise of the Runelords are trademarks of Paizo Inc. This game uses trademarks and/or copyrights owned by Paizo Inc., used under Paizo's Community Use Policy (paizo.com/communityuse). It is not published, endorsed or specifically approved by Paizo. All story text, art and music here are original.

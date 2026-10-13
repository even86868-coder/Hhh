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
  - Every character speaks with their own voice through your device's built-in speech synthesis (free, offline). The narrator voice is optional.
- **Optional live AI banter**: enter your own Anthropic API key in Settings → Live AI banter, and Claude writes fresh dialogue for each story scene as you play. The key stays on your device; if anything fails, the game falls back to its written lines.
- Works offline as an installable PWA. Everything (art, music, sound effects) is generated procedurally. No build step, no dependencies.

## Play on your phone

1. Push to `main` and enable **Settings → Pages → Source: GitHub Actions**. The included workflow publishes the game.
2. Open the Pages URL on your phone, then use **Add to Home Screen** (Safari share menu, or the Chrome menu). It runs full-screen and offline like a native app.

Want an App Store or Play Store build? The game is static HTML/JS, so it can be wrapped as-is with [Capacitor](https://capacitorjs.com/) (`npx cap init`, set `webDir` to this folder, `npx cap add ios` / `android`).

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

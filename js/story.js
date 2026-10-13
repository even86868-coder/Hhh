// Chapter 1: Burnt Offerings. A branching, choice-driven retelling.
// Text tokens: {name} player, {tank} {healer} {arcane} {skirm} companions by role (with fallback), {c0} {c1} {c2}.
// Checks: { skill, dc, who: 'player' | 'party', bonus?(state) }

import * as SANDPOINT from './story_sandpoint.js';
import * as COMPANIONS from './story_companions.js';
import * as THISTLETOP from './story_thistletop.js';

const has = (f) => (s) => !!s.flags[f];
const not = (f) => (s) => !s.flags[f];

export const START = 'arrive';

export const STORY = {
  // ------------------------------------------------------------ Prologue
  arrive: {
    scene: 'sandpoint', chapter: 'Prologue',
    text: `The salt wind smells of fried fish and fresh paint. Below the cliffs, the little town of Sandpoint is dressed in ribbons for the Swallowtail Festival, held to bless its brand-new cathedral. Five years ago a terrible fire took the old chapel and its priest, Father Tobyn. Today the town is finally ready to smile again.\n\nYou crest the hill road with dust on your boots. What brought you here, {name}?`,
    choices: [
      { t: 'Faith. I came to see the new cathedral consecrated.', go: 'meet', fx: [{ trait: 'faith' }] },
      { t: 'Ruins. Everyone says the Old Light is Thassilonian.', go: 'meet', fx: [{ trait: 'lore' }] },
      { t: 'Home. I grew up on these streets.', go: 'meet', fx: [{ trait: 'home' }] },
      { t: 'Coin. The mayor is paying extra guards for the festival.', go: 'meet', fx: [{ trait: 'coin' }, { potions: 1 }] },
    ],
  },
  meet: {
    scene: 'inn', chapter: 'Prologue',
    text: `The night before the festival, the Rusty Dragon inn is packed. Its owner, Ameiko Kaijitsu, a sharp-eyed former adventurer, seats you at a table with three other travelers, "since you all look like trouble of the useful kind."\n\n{tank} grunts a greeting over a tankard. {healer} offers a warm smile and a sun-shaped amulet. {arcane} is already sketching the inn's carved dragon in a notebook. Somebody keeps stealing your fries and you can't figure out who.\n\nBy the third round, the four of you have agreed to look out for one another tomorrow.`,
    choices: [
      { t: 'Raise a toast: "To new friends and quiet festivals!"', go: 'festival', fx: [{ set: { toast: true } }] },
      { t: 'Ask Ameiko about the town.', go: 'meet_ameiko' },
    ],
  },
  meet_ameiko: {
    scene: 'inn', npc: 'ameiko',
    text: `Ameiko leans on the bar. "Sandpoint's quiet. Mostly. Goblins in the hills, the odd smuggler. My father runs the Glassworks and my half-brother Tsuto... well. We don't talk." She pours you a drink on the house. "Enjoy the festival. Tomorrow nothing interesting happens, I promise."\n\n{skirm} snorts into a mug. "Famous last words."`,
    choices: [{ t: 'Turn in for the night.', go: 'festival', fx: [{ set: { ameikoFriend: true } }] }],
  },

  // ------------------------------------------------------------ Swallowtail Festival
  festival: {
    scene: 'festival', chapter: 'The Swallowtail Festival',
    text: `The festival is glorious. Mayor Kendra Deverin gives a speech that goes on a little long. Father Zantus releases a cloud of swallowtail butterflies over the cathedral steps. There are pies, a fishing contest and a knife-throwing booth run by a man who has clearly lost a few fingers.\n\nYou have time for one diversion before the final ceremony.`,
    choices: [
      { t: 'Try the knife-throwing booth.', check: { skill: 'dex', dc: 14, who: 'player' }, pass: 'fest_knife_win', fail: 'fest_knife_lose' },
      { t: 'Arm-wrestle the champion fisherman.', check: { skill: 'str', dc: 15, who: 'player' }, pass: 'fest_arm_win', fail: 'fest_arm_lose' },
      { t: 'Help Father Zantus with the blessing.', check: { skill: 'religion', dc: 10, who: 'player', untrained: true }, pass: 'fest_zantus_win', fail: 'fest_zantus_lose' },
      { t: 'Charm the crowd with a story.', check: { skill: 'diplomacy', dc: 13, who: 'player' }, pass: 'fest_charm_win', fail: 'fest_charm_lose' },
    ],
  },
  fest_knife_win: { scene: 'festival', text: `Thunk. Thunk. Thunk! Three blades in the bullseye. The booth owner swears colorfully and hands over the prize: a potion of cure light wounds in a dusty bottle.`, on: [{ potions: 1 }], choices: [{ t: 'Head to the ceremony.', go: 'raid' }] },
  fest_knife_lose: { scene: 'festival', text: `Your first knife hits the target. Your second hits the booth. Your third disappears into the crowd, and somebody yelps. You hurry away before anyone asks questions.`, choices: [{ t: 'Head to the ceremony.', go: 'raid' }] },
  fest_arm_win: { scene: 'festival', text: `The fisherman's face turns the color of a boiled lobster, and then his knuckles hit the table. The crowd roars. For the rest of the day strangers buy you meat pies.`, on: [{ set: { townHero: true } }], choices: [{ t: 'Head to the ceremony.', go: 'raid' }] },
  fest_arm_lose: { scene: 'festival', text: `It's like arm-wrestling an anchor. The fisherman wins, then kindly helps you pop your shoulder back in.`, choices: [{ t: 'Head to the ceremony.', go: 'raid' }] },
  fest_zantus_win: { scene: 'cathedral', npc: 'zantus', text: `You recite the old blessing of Desna without stumbling. Father Zantus beams. "If you ever need anything, my friend, the cathedral's doors are open to you."`, on: [{ set: { zantusFriend: true } }], choices: [{ t: 'Head to the ceremony.', go: 'raid' }] },
  fest_zantus_lose: { scene: 'cathedral', npc: 'zantus', text: `You mix up Desna's blessing with a sailor's drinking song. Father Zantus pats your shoulder. "The goddess appreciates enthusiasm."`, choices: [{ t: 'Head to the ceremony.', go: 'raid' }] },
  fest_charm_win: { scene: 'festival', text: `Your tale of a heroic (mostly true) adventure draws a crowd. Children follow you around for an hour. Sheriff Belor Hemlock nods at you approvingly from across the square.`, on: [{ set: { townHero: true } }], choices: [{ t: 'Head to the ceremony.', go: 'raid' }] },
  fest_charm_lose: { scene: 'festival', text: `You lose the thread halfway through and end the story with "...and then it was over." A child boos.`, choices: [{ t: 'Head to the ceremony.', go: 'raid' }] },

  raid: {
    scene: 'raid', chapter: 'The Swallowtail Festival',
    text: `As the sun sets and Father Zantus begins the final prayer, a scream rings out. Then a terrible, cheerful song carries over the rooftops:\n\n"Goblins chew and goblins bite,\ngoblins cut and goblins fight!"\n\nGoblins pour into the square, small and green with huge heads, waving rusty dogslicers and lit torches. A pie cart goes up in flames. {tank} draws steel. "Well. So much for quiet."`,
    choices: [{ t: 'Fight!', go: 'raid_fight' }],
  },
  raid_fight: { combat: 'festival', win: 'raid_after' },
  raid_after: {
    scene: 'raid',
    text: `The last goblin falls, still singing. All around the square, townsfolk are battling smaller packs. Then two cries rise at once.\n\nTo the east, a well-dressed nobleman is backed against a wall by a snarling, mangy goblin dog and its riders. To the north, goblins with torches are running toward the cathedral boneyard, cackling about "burning the long-shanks' dead."`,
    choices: [
      { t: 'Save the nobleman!', go: 'aldern_fight', set: { aldernSaved: true } },
      { t: 'Protect the cathedral boneyard!', go: 'cathedral_fight', set: { boneyardSaved: true } },
    ],
  },
  aldern_fight: { combat: 'aldern', win: 'aldern_after' },
  aldern_after: {
    scene: 'night', npc: 'aldern',
    text: `The nobleman straightens his ruined velvet coat with shaking hands. "Aldern Foxglove, of Magnimar. I— you saved my life!" He grabs your hand and won't let go for an awkwardly long time. "I shan't forget this, {name}. Not ever."\n\n{skirm} whispers, "I think he's in love with you."`,
    choices: [{ t: 'Rejoin the defense of the town.', go: 'raid_end' }],
  },
  cathedral_fight: { combat: 'cathedral', win: 'cathedral_after' },
  cathedral_after: {
    scene: 'boneyard', npc: 'zantus',
    text: `You stamp out the last torch among the gravestones. Father Zantus arrives, breathless. "Thank the goddess. Those creatures were trying to dig, not just burn. Why would goblins want our dead?"\n\nIt's a good question. One of the graves looks disturbed, but in the dark it's hard to tell.`,
    on: [{ set: { zantusFriend: true } }],
    choices: [{ t: 'Rejoin the defense of the town.', go: 'raid_end' }],
  },
  raid_end: {
    scene: 'night', npc: 'hemlock', chapter: 'Aftermath',
    text: `By midnight the goblins have fled into the hills. Sheriff Belor Hemlock, a tall Shoanti man with a voice like gravel, finds you among the wreckage.\n\n"Goblins are cowards. They don't raid towns this size. Somebody organized this." He rubs his face. "You four fought well. Ameiko's put you up at the Rusty Dragon, free of charge. Get some rest. I may need you."`,
    levelUp: 2, rest: true,
    choices: [{ t: 'Sleep like the dead.', go: 'day2' }],
  },

  // ------------------------------------------------------------ Investigation hub
  day2: {
    scene: 'sandpoint', chapter: 'Local Heroes',
    text: (s) => `Morning. Sandpoint is sweeping up ash and broken pottery. Word of your heroics has spread, and people wave as you pass.${s.flags.visitedAny ? '\n\nThere is still time to look into things before evening.' : '\n\nThere are several leads worth following.'}`,
    choices: [
      { t: 'Visit Father Zantus at the cathedral.', go: 'zantus', if: not('v_zantus'), set: { v_zantus: true, visitedAny: true } },
      { t: 'Find Shalelu, the elven ranger who hunts goblins.', go: 'shalelu', if: not('v_shalelu'), set: { v_shalelu: true, visitedAny: true } },
      { t: 'Accept Aldern Foxglove\'s invitation to a boar hunt.', go: 'boar_intro', if: (s) => s.flags.aldernSaved && !s.flags.v_boar, set: { v_boar: true, visitedAny: true } },
      { t: 'Ask old scholar Brodert Quink about the Old Light.', go: 'quink', if: not('v_quink'), set: { v_quink: true, visitedAny: true } },
      { t: 'Head back to the Rusty Dragon.', go: 'ameiko_missing', if: has('visitedAny') },
    ],
  },
  zantus: {
    scene: 'boneyard', npc: 'zantus',
    text: (s) => `Father Zantus leads you to the boneyard, pale-faced. "Last night, during the raid, someone dug up Father Tobyn's grave. His remains are gone. Stolen!"${s.flags.boneyardSaved ? '\n\n"If you hadn\'t driven the goblins off, they\'d have taken more."' : ''}\n\nThe dig marks are strange: careful, not the frantic scrabbling of goblins.`,
    choices: [
      { t: 'Examine the grave.', check: { skill: 'perception', dc: 15, who: 'party' }, pass: 'zantus_clue', fail: 'zantus_noclue' },
      { t: 'Ask about Father Tobyn.', go: 'zantus_tobyn' },
    ],
  },
  zantus_clue: {
    scene: 'boneyard', npc: 'zantus',
    text: `{who} spots it: small boot prints, but also the prints of someone taller, who stood watch while the goblins dug. And on the headstone, burned into the stone, a symbol: a jackal-headed woman. Lamashtu, the Mother of Monsters.\n\nFather Zantus goes white. "Demon-worship. In Sandpoint."`,
    on: [{ set: { lamashtuClue: true } }],
    choices: [{ t: 'Ask about Father Tobyn.', go: 'zantus_tobyn' }],
  },
  zantus_noclue: { scene: 'boneyard', npc: 'zantus', text: `Whatever tracks there were have been trampled by worried townsfolk. You find nothing but mud.`, choices: [{ t: 'Ask about Father Tobyn.', go: 'zantus_tobyn' }] },
  zantus_tobyn: {
    scene: 'cathedral', npc: 'zantus',
    text: `"Tobyn was a good man. He raised a foundling girl named Nualia. Strange child. Silver hair and pale eyes, and the town called her 'Tobyn's angel' and treated her like a lucky charm. She hated it." He sighs. "She died in the fire, along with him. Or so we thought. Her body was never found."\n\nHe presses something into your hands. "Take these. The goddess wants you to keep your skin on."`,
    on: [{ potions: 1 }, { set: { nualiaHint: true } }],
    choices: [{ t: 'Thank him and go.', go: 'day2' }],
  },
  shalelu: {
    scene: 'forest', npc: 'shalelu',
    text: `You find Shalelu Andosana fletching arrows behind the Rusty Dragon. The elven ranger regards you coolly, then relents. "The goblin tribes have been fighting each other for years. Now five of them raid together. Something's uniting them."`,
    choices: [
      { t: 'Ask her to share what she knows.', check: { skill: 'diplomacy', dc: 14, who: 'player' }, pass: 'shalelu_win', fail: 'shalelu_lose' },
      { t: '"Point me at the goblins and I\'ll do the rest."', go: 'shalelu_lose' },
    ],
  },
  shalelu_win: {
    scene: 'forest', npc: 'shalelu',
    text: `Shalelu softens. "The Thistletop tribe. Their chief, Ripnugget, sits in a fort of thorns on an island off the coast. If you ever go there, go through the Nettlewood. I'll mark the hidden trails on your map." She hands it over. "Don't get killed. I'm short on people I like."`,
    on: [{ set: { shaleluInfo: true } }],
    choices: [{ t: 'Head back to town.', go: 'day2' }],
  },
  shalelu_lose: { scene: 'forest', npc: 'shalelu', text: `"Bravado gets people killed." She turns back to her arrows. "Thistletop. That's all I'll say. Don't go alone."`, choices: [{ t: 'Head back to town.', go: 'day2' }] },
  boar_intro: {
    scene: 'forest', npc: 'aldern',
    text: `Aldern Foxglove has hired a carriage, servants and far too many spears. "To thank my savior! A boar hunt in the Tickwood!" He talks the whole ride about Magnimar, his estate, and how brave you were. {healer} has to elbow {arcane} awake twice.\n\nThen the underbrush explodes. Two huge boars, tusks gleaming, charge the hunting party. Aldern squeaks and hides behind the carriage.`,
    choices: [{ t: 'Hunt them!', go: 'boar_fight' }],
  },
  boar_fight: { combat: 'boar', win: 'boar_after' },
  boar_after: {
    scene: 'forest', npc: 'aldern',
    text: `Aldern emerges, dabbing his brow. "Magnificent! You must visit me in Magnimar someday. I insist!" He presses a pouch of gold and two healing potions on you, gazing at you with a strange, intense admiration.`,
    on: [{ potions: 2 }, { gold: 100 }, { set: { aldernHunt: true } }],
    choices: [{ t: 'Return to Sandpoint.', go: 'day2' }],
  },
  quink: {
    scene: 'sandpoint',
    text: `Brodert Quink is a wild-haired old scholar who lives among stacks of crumbling books. "The Old Light! Not a lighthouse, I keep telling them. Thassilonian! Ten thousand years old! The empire of the Runelords, wizard-kings who ruled through seven sins." He shoves a rubbing of strange glyphs at you.`,
    choices: [
      { t: 'Study the glyphs with him.', check: { skill: 'arcana', dc: 12, who: 'party' }, pass: 'quink_win', fail: 'quink_lose' },
      { t: 'Politely escape.', go: 'day2' },
    ],
  },
  quink_win: {
    scene: 'sandpoint',
    text: `{who} recognizes the seven-pointed star, the Sihedron, symbol of Thassilon's seven schools of sin magic. "Yes! Yes!" Quink hops in delight. "Wrath, greed, lust, gluttony, envy, pride, sloth. They say the Runelords didn't die. They're only sleeping." He laughs. You don't.`,
    on: [{ set: { thassilonLore: true } }],
    choices: [{ t: 'Return to town.', go: 'day2' }],
  },
  quink_lose: { scene: 'sandpoint', text: `The glyphs swim before your eyes. Quink talks for two hours about pottery. You leave with a headache.`, choices: [{ t: 'Return to town.', go: 'day2' }] },

  // ------------------------------------------------------------ The Glassworks
  ameiko_missing: {
    scene: 'inn', chapter: 'The Glassworks',
    text: (s) => `The Rusty Dragon is in an uproar. "Ameiko went to the Glassworks this morning to check on her father," says the cook, wringing her apron. "She hasn't come back. And the furnace smoke stopped hours ago."${s.flags.ameikoFriend ? '\n\nYou remember Ameiko\'s free drink and her tired smile.' : ''}\n\nSheriff Hemlock is busy with the burials. It's up to you.`,
    choices: [{ t: 'Go to the Glassworks. Now.', go: 'glass_approach' }],
  },
  glass_approach: {
    scene: 'glassworks',
    text: `The Glassworks squats by the shore, silent. The front doors are locked. Through a grimy window you glimpse small figures dancing in the orange glow of the furnace. And someone is singing.\n\nThere's a loading dock in back and a side door with a sturdy lock.`,
    choices: [
      { t: 'Kick in the front door.', check: { skill: 'str', dc: 13, who: 'party' }, pass: 'glass_fight', fail: 'glass_fight_loud' },
      { t: 'Sneak in through the loading dock.', check: { skill: 'stealth', dc: 13, who: 'player' }, pass: 'glass_sneak', fail: 'glass_fight_loud' },
      { t: 'Pick the side door\'s lock.', check: { skill: 'disable', dc: 15, who: 'party' }, pass: 'glass_sneak', fail: 'glass_fight_loud', if: (s) => s.party.some((c) => c.skills.includes('disable')) },
    ],
  },
  glass_sneak: { scene: 'glassworks', text: `{who} slips the latch without a sound. Inside, goblins are playing with molten glass, giggling, completely unaware of you.`, choices: [{ t: 'Strike first!', go: 'glass_fight_surprise' }] },
  glass_fight_loud: { scene: 'glassworks', text: `CRASH! Every goblin head in the room turns your way. "LONGSHANKS! GET 'EM!"`, choices: [{ t: 'Here they come!', go: 'glass_fight' }] },
  glass_fight: { combat: 'glassworks', win: 'glass_after' },
  glass_fight_surprise: { combat: 'glassworks', surprise: 'party', win: 'glass_after' },
  glass_after: {
    scene: 'glassworks',
    text: `Among the goblin bodies you find a horrible sight: Lukas Kaijitsu, Ameiko's father, encased in cooling glass by the furnace. In a storeroom, Ameiko herself lies bound and gagged, bruised but alive.\n\n"Tsuto," she gasps as you cut her free. "My brother. He did this. He's in the office, with more of them. He's working with someone, a woman he calls his 'angel.'"`,
    on: [{ set: { ameikoSaved: true } }],
    choices: [
      { t: 'Burst into the office.', go: 'tsuto_confront' },
      { t: 'First, tend Ameiko\'s wounds.', check: { skill: 'heal', dc: 12, who: 'party' }, pass: 'tsuto_heal_win', fail: 'tsuto_confront' },
    ],
  },
  tsuto_heal_win: { scene: 'glassworks', npc: 'ameiko', text: `{who} binds Ameiko's wounds. She grips your arm. "He's fast. Fights with his fists like a monk. Don't let him get behind you." She gives you her own healing potion.`, on: [{ potions: 1 }], choices: [{ t: 'Burst into the office.', go: 'tsuto_confront' }] },
  tsuto_confront: {
    scene: 'glassworks', npc: 'tsuto',
    text: (s) => `Tsuto Kaijitsu is lean and handsome, with his sister's eyes and none of her warmth. Two goblins flank him. "You've ruined everything! Do you know what she promised me? What we'll do to this miserable town?"${s.flags.ameikoFriend ? '\n\nBehind you, Ameiko whispers: "Tsuto... please."' : ''}`,
    choices: [
      { t: '"It\'s over, Tsuto. Surrender."', check: { skill: 'intimidate', dc: 20, who: 'player' }, pass: 'tsuto_surrender', fail: 'tsuto_fight' },
      { t: '"Your sister is alive. You don\'t have to do this."', check: { skill: 'diplomacy', dc: 22, who: 'player', bonus: (s) => (s.flags.ameikoFriend ? 4 : 0) }, pass: 'tsuto_surrender', fail: 'tsuto_fight' },
      { t: 'Attack!', go: 'tsuto_fight' },
    ],
  },
  tsuto_surrender: {
    scene: 'glassworks', npc: 'tsuto',
    text: `Something cracks in Tsuto's face. He drops his hands, and the goblins flee squealing out a window. "She'll kill me anyway," he mutters as you bind him. "Nualia always gets what she wants."`,
    on: [{ set: { tsutoCaptured: true } }],
    choices: [{ t: 'Search the office.', go: 'tsuto_journal' }],
  },
  tsuto_fight: { combat: 'tsuto', win: 'tsuto_journal' },
  tsuto_journal: {
    scene: 'glassworks', chapter: 'The Glassworks',
    text: (s) => `${s.flags.tsutoCaptured ? 'Tsuto glares in silence as you search.' : 'Tsuto lies bloodied but breathing. You tie him up for the sheriff.'} In his desk you find a journal, and it's horrifying.\n\nThe goblin raid was a distraction so goblins could steal Father Tobyn's bones. Tsuto writes rapturously about Nualia, ${s.flags.nualiaHint ? 'Tobyn\'s foundling, very much alive,' : 'a silver-haired woman,'} now risen in the service of Lamashtu. She means to burn Sandpoint to the ground as an offering, and to wake "what sleeps beneath Thistletop."\n\nThe journal mentions a tunnel under the Glassworks, leading to "the catacombs of wrath."`,
    on: [{ set: { journal: true } }, { gold: 150 }, { gear: { key: 'resistance', val: 1 } }],
    levelUp: 3, rest: true,
    choices: [{ t: 'Rest for the night.', go: 'evening' }],
  },

  evening: {
    scene: 'night', chapter: 'The Glassworks',
    text: (s) => `Night settles over Sandpoint. ${s.flags.tsutoCaptured ? 'Tsuto sits in Sheriff Hemlock\'s jail, refusing to speak.' : 'Tsuto lies in the sheriff\'s jail, bandaged and silent.'} The tunnel beneath the Glassworks waits, but there are still a few hours before you need to sleep.`,
    choices: [{ t: 'Sleep, then descend into the tunnel at dawn.', go: 'catacombs' }],
  },

  // ------------------------------------------------------------ Catacombs of Wrath
  catacombs: {
    scene: 'catacombs', chapter: 'Catacombs of Wrath',
    text: (s) => `The smugglers' tunnel gives way to ancient stonework, black and seamless. Carvings line the walls: furious faces, raised weapons, and everywhere the seven-pointed star.${s.flags.thassilonLore ? '\n\n{arcane} traces a glyph. "Wrath. This is a shrine to Wrath. Quink was right!"' : ''}\n\nSomething scuttles in the darkness ahead.`,
    choices: [
      { t: 'Study the carvings first.', check: { skill: 'arcana', dc: 15, who: 'party', bonus: (s) => (s.flags.thassilonLore ? 5 : 0) }, pass: 'cata_lore', fail: 'cata_fight' },
      { t: 'Press forward, weapons ready.', go: 'cata_fight' },
    ],
  },
  cata_lore: {
    scene: 'catacombs',
    text: `{who} deciphers it: this was a temple to Alaznist, the Runelord of Wrath. The creatures born here are sinspawn, spawned from the essence of sin. Pale, wiry things with a second mouth in their chest. You warn the others: their bite fills you with sickening rage.`,
    on: [{ set: { runeLore: true } }],
    choices: [{ t: 'Advance carefully.', go: 'cata_fight_ready' }],
  },
  cata_fight: { combat: 'sinspawn', win: 'runewell' },
  cata_fight_ready: { combat: 'sinspawn', surprise: 'party', win: 'runewell' },
  runewell: {
    scene: 'runewell',
    text: `The tunnel opens onto a round chamber. In its center a well brims with glowing red liquid, and from its depths a low, angry hum. Perched on its rim is a tiny red demon with bat wings and a toad's grin.\n\n"Ooh, visitors!" it shrieks. "Erylium welcomes you! Erylium will make you into lovely new sinspawn for the Mistress!"`,
    choices: [
      { t: 'Bluff: "The Mistress sent us. Where is she?"', check: { skill: 'bluff', dc: 15, who: 'player' }, pass: 'runewell_bluff', fail: 'runewell_fight' },
      { t: 'Charge the little monster!', go: 'runewell_fight' },
    ],
  },
  runewell_bluff: {
    scene: 'runewell',
    text: `"Oh! Oh! The Mistress! She's at Thistletop with the goblins, digging for the Big Dog under the old stones, the one that sleeps!" Erylium freezes. "...wait. She didn't send anyone. LIARS!"\n\nBut you're already moving.`,
    on: [{ set: { eryliumIntel: true } }],
    choices: [{ t: 'Attack!', go: 'runewell_fight_surprise' }],
  },
  runewell_fight: { combat: 'erylium', win: 'runewell_after' },
  runewell_fight_surprise: { combat: 'erylium', surprise: 'party', win: 'runewell_after' },
  runewell_after: {
    scene: 'runewell',
    text: `Erylium dissolves into foul smoke with a final squeal. The runewell pulses, angry. {arcane} eyes it nervously. "That's what makes the sinspawn. If we leave it, more will come."`,
    choices: [
      { t: 'Disrupt the runewell\'s magic.', check: { skill: 'arcana', dc: 15, who: 'party', bonus: (s) => (s.flags.runeLore ? 4 : 0) }, pass: 'runewell_destroyed', fail: 'runewell_backfire' },
      { t: 'Smash the rim with brute force.', check: { skill: 'str', dc: 16, who: 'party' }, pass: 'runewell_destroyed', fail: 'runewell_backfire' },
      { t: 'Leave it. Thistletop matters more.', go: 'hemlock' },
    ],
  },
  runewell_destroyed: { scene: 'runewell', text: `With a sound like a dying scream, the red light gutters out. The well is just a well now, dark and empty. Somewhere far to the north, someone feels it.`, on: [{ set: { runewellDestroyed: true } }], choices: [{ t: 'Return to the surface.', go: 'hemlock' }] },
  runewell_backfire: { scene: 'runewell', text: `The well erupts with a pulse of furious red energy! You're thrown across the chamber, singed and bruised. The well keeps humming, mocking you.`, on: [{ damage: { who: 'party', dice: '1d6' } }], choices: [{ t: 'Limp back to the surface.', go: 'hemlock' }] },

  // ------------------------------------------------------------ To Thistletop
  hemlock: {
    scene: 'sandpoint', npc: 'hemlock', chapter: 'To Thistletop',
    text: (s) => `Sheriff Hemlock reads Tsuto's journal twice, jaw tight. "Nualia. Gods. And Thistletop." He looks at you. "I can't spare the watch. Not with half the town still burned. But you four..."\n\n"Bring her in or put her down. Sandpoint will owe you."${s.flags.zantusFriend ? '\n\nFather Zantus arrives with a satchel. "From the cathedral. Go with the goddess."' : ''}`,
    on: [{ potions: (s) => (s.flags.zantusFriend ? 2 : 1) }, { gear: { key: 'weaponEnh', val: 1 } }],
    levelUp: 4, rest: true,
    choices: [{ t: 'Set out for Thistletop.', go: 'nettlewood' }],
  },
  nettlewood: {
    scene: 'nettlewood',
    text: (s) => `The Nettlewood is a maze of thorns and hanging moss. Goblin warrens riddle the ground, and crude totems of dog skulls mark the paths.${s.flags.shaleluInfo ? '\n\nYou unroll Shalelu\'s map.' : ''}`,
    choices: [
      { t: 'Find a hidden path.', check: { skill: 'survival', dc: 15, who: 'party', bonus: (s) => (s.flags.shaleluInfo ? 6 : 0) }, pass: 'nettle_safe', fail: 'nettle_ambush' },
      { t: 'Move quietly and hope for the best.', check: { skill: 'stealth', dc: 14, who: 'player' }, pass: 'nettle_safe', fail: 'nettle_ambush' },
    ],
  },
  nettle_safe: { scene: 'nettlewood', text: `{who} leads you along a deer track that winds past a goblin camp. You hear them squabbling over a stolen chicken. They never see you.`, choices: [{ t: 'Continue to the coast.', go: 'thistletop' }] },
  nettle_ambush: { scene: 'nettlewood', text: `A twig snaps under your foot. The bushes erupt with goblins! "AMBUSH! WE AMBUSHING!"`, choices: [{ t: 'Defend yourselves!', go: 'nettle_fight' }] },
  nettle_fight: { combat: 'nettlewood', surprise: 'enemy', win: 'thistletop' },
  thistletop: {
    scene: 'thistletop', chapter: 'Thistletop',
    text: `The Nettlewood ends at a sea cliff. Across a gap of churning waves, a tangle of thorns crowns a rocky island: Thistletop. A rickety rope bridge sways between the cliffs. Goblin archers lounge at the far end.`,
    choices: [
      { t: 'Storm the bridge!', go: 'bridge_fight' },
      { t: 'Climb down the cliff and scale the island.', check: { skill: 'climb', dc: 15, who: 'player', bonus: (s) => (s.flags.sp_tsutoIntel ? 4 : 0) }, pass: 'climb_win', fail: 'climb_fail' },
      { t: 'Bluff: "We\'re mercenaries! The Mistress hired us!"', check: { skill: 'bluff', dc: 18, who: 'player', bonus: (s) => (s.flags.journal ? 2 : 0) }, pass: 'bluff_bridge', fail: 'bridge_fight' },
    ],
  },
  bridge_fight: { combat: 'bridge', win: 'courtyard' },
  climb_win: { scene: 'thistletop', text: `Hand over hand you scale the slick rocks, then haul the others up with a rope. You slip over the palisade unseen.`, choices: [{ t: 'Into the fort.', go: 'courtyard' }] },
  climb_fail: { scene: 'thistletop', text: `Halfway up, the rock crumbles! You fall into the shallows, bruised and soaked. The goblins on the bridge howl with laughter and nock their arrows.`, on: [{ damage: { who: 'player', dice: '2d6' } }], choices: [{ t: 'Fight your way up the bridge!', go: 'bridge_fight' }] },
  bluff_bridge: { scene: 'thistletop', text: `"Mercenaries? For the pretty lady?" The goblins confer, then wave you across. "Go! Go! Chief in the big room! Don't touch the dogs!"`, choices: [{ t: 'Stroll into the fort.', go: 'courtyard' }] },
  courtyard: {
    scene: 'fort',
    text: `Inside the thorny walls, a muddy courtyard stinks of dog. A watchtower looms overhead, and something big moves on it.`,
    choices: [
      { t: 'Scan the tower.', check: { skill: 'perception', dc: 16, who: 'party' }, pass: 'bruthazmus_spot', fail: 'bruthazmus_ambush' },
    ],
  },
  bruthazmus_spot: { scene: 'fort', text: `{who} spots him: a hulking, hairy bugbear with a longbow, grinning. "Bruthazmus sees you too, little elf-friends!" He leaps down, roaring for his pets.`, choices: [{ t: 'Fight!', go: 'bruthazmus_fight' }] },
  bruthazmus_ambush: { scene: 'fort', text: `Thwip! An arrow thuds into the mud at your feet. A hulking bugbear on the tower laughs. "Bruthazmus hunts!"`, choices: [{ t: 'Fight!', go: 'bruthazmus_ambush_fight' }] },
  bruthazmus_fight: { combat: 'bruthazmus', win: 'throne' },
  bruthazmus_ambush_fight: { combat: 'bruthazmus', surprise: 'enemy', win: 'throne' },
  throne: {
    scene: 'fort',
    text: `The throne room is a stinking hall of stolen junk. On a throne made from a broken wagon sits a goblin in a too-big crown, riding a scarred goblin dog. "RIPNUGGET THE MIGHTY!" he shrieks. "Nobody gets to the Mistress except through Ripnugget!"`,
    choices: [
      { t: 'Attack the chieftain and his guards!', go: 'throne_fight' },
      { t: 'Challenge Ripnugget to single combat!', check: { skill: 'intimidate', dc: 15, who: 'player' }, pass: 'duel_intro', fail: 'throne_fight_mock' },
    ],
  },
  throne_fight_mock: { scene: 'fort', text: `Ripnugget laughs so hard he almost falls off his dog. "Single combat? Ripnugget is not STUPID! GET THEM!"`, choices: [{ t: 'Fight!', go: 'throne_fight' }] },
  duel_intro: { scene: 'fort', text: `The goblins gasp. A challenge! Ripnugget can't refuse in front of his tribe. He spurs his dog forward, sneering. "Ripnugget will wear your skin as a hat!"\n\nYour friends step back, hands on weapons. This fight is yours alone.`, choices: [{ t: 'Face him!', go: 'duel_fight' }] },
  duel_fight: { combat: 'duel', win: 'duel_win', solo: true },
  duel_win: { scene: 'fort', text: `Ripnugget topples from his mount. Silence. Then every goblin in the room drops its weapon and flees screaming. "THE CHIEF IS DEAD! THE LONGSHANK IS CHIEF NOW!"\n\nYou are, briefly, the king of the goblins.`, on: [{ set: { goblinKing: true } }, { gear: { key: 'ringProt', val: 1 } }], choices: [{ t: 'Search the throne room.', go: 'throne_after' }] },
  throne_fight: { combat: 'ripnugget', win: 'throne_after' },
  throne_after: {
    scene: 'fort',
    text: `Behind the throne a trapdoor leads down into old stone. Thassilonian, like the catacombs. Cold air breathes up from below.\n\n{healer} looks at everyone's wounds. "We could barricade a storeroom and rest before going down. But if we wait, she'll be ready for us."`,
    on: [{ gear: { key: 'ringProt', val: 1 } }],
    choices: [
      { t: 'Rest first. We need our strength.', go: 'rest_fort', set: { restedInFort: true } },
      { t: 'Go now, before she can prepare.', go: 'lower' },
    ],
  },
  rest_fort: { scene: 'fort', text: `You barricade a storeroom full of stolen cheese and sleep in shifts. Below, you hear chanting. Something is being prepared for you.`, rest: true, choices: [{ t: 'Descend.', go: 'lower' }] },
  lower: {
    scene: 'catacombs', npc: 'orik',
    text: `The stairs end in a long hall. A broad-shouldered mercenary in good armor blocks the way, longsword drawn. Behind him, a pale woman in scholar's robes looks up from her notes, irritated.\n\n"Orik Vancaskerkin," the mercenary says. "I'm paid to stop you. Nothing personal." The scholar sighs. "Lyrie Akenja. Please die quietly; I'm working."`,
    choices: [
      { t: '"Nualia\'s finished. Whatever she pays you, it isn\'t enough."', check: { skill: 'diplomacy', dc: 17, who: 'player', bonus: (s) => (s.flags.goblinKing ? 3 : 0) }, pass: 'orik_spared', fail: 'orik_fight' },
      { t: '"Stand aside or join Ripnugget."', check: { skill: 'intimidate', dc: 19, who: 'player', bonus: (s) => (s.flags.goblinKing ? 3 : 0) }, pass: 'orik_spared', fail: 'orik_fight' },
      { t: 'Attack!', go: 'orik_fight' },
    ],
  },
  orik_spared: {
    scene: 'catacombs', npc: 'orik',
    text: `Orik looks at you, at the blood on your weapons, and lowers his sword. "...Fair point. I'm out." He steps aside. Lyrie shrieks in fury, whistles up a sinspawn from the shadows and begins to cast.`,
    on: [{ set: { orikSpared: true } }],
    choices: [{ t: 'Deal with the wizard!', go: 'orik_fight' }],
  },
  orik_fight: { combat: 'orikLyrie', win: 'nualia_door' },
  nualia_door: {
    scene: 'shrine', chapter: 'The Mistress of Thistletop',
    text: (s) => `${s.flags.orikSpared ? 'Orik, true to his word, has gone. ' : ''}Beyond a door carved with a jackal-headed woman lies a shrine. Candles drip red wax onto an altar of black stone, and before it kneels a woman with silver-white hair. One of her arms ends in a swollen, demonic claw.\n\nNualia rises. Beside her a winged hound with eyes like coals bares its teeth.\n\n"Sandpoint's heroes," she says softly. "The town loved its little angel so much. Its lucky charm. Its pet. Let me show you what their love made me."`,
    choices: [
      { t: 'Speak of Father Tobyn, who truly loved her.', if: has('nualiaHint'), check: { skill: 'diplomacy', dc: 22, who: 'player', bonus: (s) => (s.flags.lamashtuClue ? 2 : 0) + (s.flags.boneyardSaved ? 2 : 0) }, pass: 'nualia_falter', fail: 'nualia_fight' },
      { t: '"This ends now, Nualia."', go: 'nualia_fight' },
    ],
  },
  nualia_falter: {
    scene: 'shrine', npc: 'nualia',
    text: `"He... he did love me." For a heartbeat, the madness in her eyes clears, and you see a lonely girl who never asked to be anyone's miracle. Then the claw twitches and her face twists. "NO! Lamashtu loves me! Lamashtu made me STRONG!"\n\nBut she's shaken, and it shows.`,
    on: [{ set: { nualiaFalter: true } }],
    choices: [{ t: 'Fight, and try to save her.', go: 'nualia_fight' }],
  },
  nualia_fight: { combat: 'nualia', win: 'nualia_after' },
  nualia_after: {
    scene: 'shrine', npc: 'nualia',
    text: (s) => `Nualia falls to her knees, her blade clattering across the stones. The demonic claw withers like a dead branch. ${s.flags.nualiaFalter ? 'She looks up at you, and she is crying. "I\'m sorry. I\'m so sorry, Father."' : 'She glares up at you with hatred, breathing hard.'}`,
    choices: [
      { t: 'Spare her. Sandpoint can judge her.', go: 'ending', set: { nualiaSpared: true } },
      { t: 'End her threat forever.', go: 'ending', set: { nualiaSlain: true } },
    ],
  },
  ending: {
    scene: 'shrine',
    text: (s) => `${s.flags.nualiaSpared ? 'You bind Nualia\'s hands. She doesn\'t resist.' : 'It is done. The shrine falls silent.'} Searching the altar, you find a letter sealed with the seven-pointed star. The handwriting is elegant and ancient:\n\n"Your work in Sandpoint is a pleasing distraction, child. But remember who woke you. The Lord of Greed stirs in Xin-Shalast, and soon all of Varisia will kneel."\n\n{arcane} reads it twice, very pale. "Karzoug. The Runelord of Greed. If he's waking up..."`,
    choices: [{ t: 'Return to Sandpoint.', go: 'epilogue' }],
  },
  epilogue: {
    scene: 'victory', chapter: 'Epilogue',
    text: (s) => {
      const lines = ['Sandpoint throws you a second festival, a better one, with no goblins at all. The mayor gives a speech that goes on far too long. You don\'t mind.'];
      if (s.flags.nualiaSpared) lines.push('Nualia sits in Father Zantus\'s care, silent and watched, praying to no one at all. Whether she can be redeemed is a story for another day.');
      else lines.push('Nualia\'s threat is ended. Father Zantus lays Father Tobyn\'s recovered bones back to rest beside an empty grave marked only "Our Angel."');
      if (s.flags.runewellDestroyed) lines.push('With the runewell destroyed, no more sinspawn crawl up from the dark beneath the Glassworks.');
      else lines.push('Beneath the Glassworks, the runewell still hums. Some nights, the dockworkers swear they hear it.');
      if (s.flags.orikSpared) lines.push('Orik Vancaskerkin turns up at the sheriff\'s office, asking for honest work. Hemlock, to everyone\'s surprise, hires him.');
      if (s.flags.goblinKing) lines.push('The Thistletop goblins now refer to you as "Big Chief Longshanks" and leave dead fish on the town walls as tribute.');
      if (s.flags.tt_goblinChief) lines.push(s.flags.tt_nibsyChief ? 'Out in the Nettlewood, Chief Nibsy rules the Thistletop goblins with a firm hand and a very large hat, and Chuffwhistle serves proudly as Royal Counter of Things. Not one goblin has set a fire since.' : 'Chief Chuffwhistle keeps the pact you made in the pit: no more burning longshanks towns. Mostly. There was one small incident with a haystack.');
      else if (s.flags.tt_goblinFriend) lines.push('Every few weeks, a little bundle appears on your doorstep: a shiny button, a dead fish, a drawing of you looking heroic. Nibsy remembers.');
      if (s.flags.tt_pitFreed && !s.flags.tt_goblinChief) lines.push('The goblins you freed from the pit scattered into the Nettlewood. Some of them, you suspect, are still running.');
      if (s.flags.tt_sealed) lines.push('Beneath Thistletop, the vault you sealed stays silent. Whatever waits there, it will keep waiting.');
      else if (s.flags.tt_sealCracked) lines.push('Some nights, fishermen near Thistletop swear they hear something huge padding through the dark under the island, and a growling voice that whispers a single word: "Soon."');
      else if (s.flags.tt_vaultLeft) lines.push('No one has gone back to the sealed vault beneath Thistletop. No one wants to.');
      if (s.flags.sp_sczarniEnemy && s.flags.sp_sczarniBroken) lines.push('With the Sczarni gang broken, the docks are quieter. Sheriff Hemlock buys you an ale and pretends it\'s an accident.');
      else if (s.flags.sp_sczarniFavor || s.flags.sp_sczarniFooled) lines.push('The Sczarni still tip their hats to you on the docks. You\'re not sure if that\'s good.');
      if (s.flags.sp_hagfishChampion) lines.push('Your name is carved above the Hagfish tank, next to a crude drawing of you looking slightly green.');
      if (s.flags.sp_ameikoBond) lines.push('Ameiko keeps a table by the fire reserved for you. It has a little sign. It says "Family."');
      const loyal = ['Brannoc', 'Tamsin', 'Quillan', 'Pip'].filter((n) => s.flags[`loyal_${n}`]);
      const rift = ['Brannoc', 'Tamsin', 'Quillan', 'Pip'].filter((n) => s.flags[`rift_${n}`]);
      if (loyal.length) lines.push(`${loyal.join(' and ').replace(/ and (?=.* and )/g, ', ')} ${loyal.length > 1 ? 'have' : 'has'} become more than companions. Whatever comes next, ${loyal.length > 1 ? 'they' : 'that friend'} will be at your side.`);
      if (rift.length) lines.push(`Things are still strained with ${rift.join(' and ')}. Some wounds take longer than a chapter to heal.`);
      if (s.flags.aldernSaved) lines.push('A letter arrives from Magnimar, scented and pressed with a wax seal: Aldern Foxglove begs you to visit his family estate. The letter is very long. It mentions you by name eleven times.');
      lines.push('Ameiko raises a glass at the Rusty Dragon. "To the heroes of Sandpoint!" The room roars.\n\nBut far to the north, in the frozen peaks, something ancient opens its eyes.\n\nCHAPTER 1 COMPLETE\nThe adventure continues in Chapter 2: The Skinsaw Murders.');
      return lines.join('\n\n');
    },
    end: true,
    choices: [{ t: 'Return to title', go: '__title' }],
  },
};

// ------------------------------------------------------------ expansion modules
// Merge extra nodes, then attach hook choices to their host nodes (before the host's last choice).
for (const mod of [SANDPOINT, COMPANIONS, THISTLETOP]) {
  for (const [id, node] of Object.entries(mod.NODES || {})) {
    if (STORY[id]) console.warn('Story node id clash:', id);
    else STORY[id] = node;
  }
  for (const [host, extra] of Object.entries(mod.HOOKS || {})) {
    const node = STORY[host];
    if (!node) { console.warn('Hook host missing:', host); continue; }
    const list = node.choices || (node.choices = []);
    list.splice(Math.max(0, list.length - 1), 0, ...extra);
  }
}
export const EXTRA_SCENES = Object.assign({}, SANDPOINT.SCENES, COMPANIONS.SCENES, THISTLETOP.SCENES);
export const EXTRA_CAMP = [...(SANDPOINT.CAMP || []), ...(COMPANIONS.CAMP || []), ...(THISTLETOP.CAMP || [])];

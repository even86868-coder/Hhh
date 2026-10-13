// Sandpoint side quests: day-two errands around town and evening scenes after the Glassworks.
// Contract: NODES (story nodes), HOOKS (hostNodeId -> extra choices), SCENES (banter by node id), CAMP (campfire talks).
// All node ids are prefixed sp_. Day-2 quests end with go: 'day2'; evening quests with go: 'evening'.

const H = (heroic, cheerful, grim, snarky) => ({ heroic, cheerful, grim, snarky });
const f = (s, k) => !!s.flags[k];
const sczarniFriendly = (s) => f(s, 'sp_sczarniFavor') || f(s, 'sp_sczarniFooled');

const TOWN = [{ t: 'Head back into town.', go: 'day2' }];
const NIGHT = [{ t: 'Walk back to the Rusty Dragon.', go: 'evening' }];

// Shared choices for the walking barrel on the night patrol (hidden while a Sczarni ambush is pending).
const noAmbush = (s) => !f(s, 'sp_sczarniEnemy') || f(s, 'sp_ambushDone');
const BARREL_CHOICES = [
  { t: 'Watch out! Footsteps behind you...', go: 'sp_np_ambush', if: (s) => f(s, 'sp_sczarniEnemy') && !f(s, 'sp_ambushDone'), set: { sp_ambushDone: true } },
  { t: 'Coax whatever is inside out with a pickled herring.', check: { skill: 'cha', dc: 12, who: 'party' }, pass: 'sp_np_talk', fail: 'sp_np_bolt', if: noAmbush },
  { t: 'Hammer the lid shut and roll it to the jail.', go: 'sp_np_jail', if: noAmbush },
];

export const NODES = {
  // ============================================================ 1. The Hagfish challenge
  sp_hag: {
    scene: 'inn', chapter: 'Local Heroes',
    text: `The Hagfish is the kind of tavern where the floor is sticky on purpose. Behind the bar sits its pride and joy: a huge glass tank holding a slimy, eel-like hagfish that looks like a sock that learned to hate. Above it, a jar of coins clinks with every bet ever lost.\n\nBarkeep Jargie Quinn taps the rules board. "One mug of tank water. Down it, keep it down, win the jar. Nobody's managed in two years."\n\nThe hagfish oozes a little extra slime, just for you.`,
    choices: [
      { t: 'Pinch your nose and drink it yourself.', check: { skill: 'con', dc: 15, who: 'player' }, pass: 'sp_hag_win', fail: 'sp_hag_lose' },
      { t: 'Try to swap the mug for clean water when Jargie blinks.', check: { skill: 'bluff', dc: 14, who: 'player' }, pass: 'sp_hag_trick', fail: 'sp_hag_caught' },
      { t: 'Just watch the other fools and place a bet.', go: 'sp_hag_watch' },
    ],
  },
  sp_hag_win: {
    scene: 'inn',
    text: `It tastes like a shipwreck's armpit. Your eyes water. Your stomach files a formal complaint, then a second one, louder. The whole tavern leans in, holding its breath.\n\nYou set the mug down. You swallow. You smile.\n\nThe Hagfish erupts. Sailors pound the tables, someone bursts into song, and Jargie solemnly carves your name into the champion's beam above the bar, right next to a lot of empty space. The coin jar is yours. {tank} slaps your back so hard you almost lose the prize after all.`,
    on: [{ gold: 60 }, { set: { sp_hagfishChampion: true, townHero: true } }],
    choices: TOWN,
  },
  sp_hag_lose: {
    scene: 'inn',
    text: `You get two heroic gulps down before your body overrules you. What follows is loud, sudden and, thankfully, mostly into the bucket Jargie keeps for exactly this purpose.\n\nThe regulars cheer anyway. "Got further than the last fellow!" Jargie adds your coin to the jar and hands you a mint leaf the size of a playing card.\n\nFor the rest of the day, you can taste the hagfish whenever you burp. {healer} offers a soothing prayer. It helps a little. The hagfish looks smug.`,
    on: [{ damage: { who: 'player', dice: '1d3' } }, { set: { sp_hagfishTried: true } }],
    choices: TOWN,
  },
  sp_hag_trick: {
    scene: 'inn',
    text: `{skirm} "accidentally" knocks over a stack of tankards. In the clatter you swap the slimy mug for a clean one from the rinse tub, then gulp it down with a theatrical shudder.\n\nThe crowd goes wild. Jargie squints at you for a very long moment, then shrugs and pays out half the jar. "Something smells fishy, and for once it ain't the tank." The other half, she says, is the "suspicion tax."\n\nYou leave quickly, still pretending to look green.`,
    on: [{ gold: 30 }, { set: { sp_hagfishTrickster: true } }],
    choices: TOWN,
  },
  sp_hag_caught: {
    scene: 'inn',
    text: `You reach for the rinse tub just as Jargie turns back around. Your hand is in the clean water. Your face is doing something guilty.\n\n"Cheater!" bellows a sailor. Jargie points at the door without a word, and the whole tavern boos you out onto the street. A fish head sails after you and bounces off {arcane}'s hat.\n\nThere is now a new rule chalked on the board: NO SWAPPING. And underneath it, unflatteringly, a drawing of your face.`,
    on: [{ set: { sp_hagfishBanned: true } }],
    choices: TOWN,
  },
  sp_hag_watch: {
    scene: 'inn',
    text: `You put a few coppers on a huge Varisian dockhand named Big Tolly, who announces he has "a stomach like a cast-iron pot."\n\nBig Tolly gets one sip down, turns the color of old cheese, and faints into the arms of the crowd. You lose your bet. But a sharp-eyed old woman at your table bet against him, and in her delight she buys your whole party lunch and tells you which fishmonger cheats on his scales.\n\nSometimes the best way to win the Hagfish is not to play.`,
    on: [{ potions: 1 }, { set: { sp_hagfishWatched: true } }],
    choices: TOWN,
  },

  // ============================================================ 2. The Old Light expedition
  sp_ol: {
    scene: 'sandpoint', chapter: 'Local Heroes',
    text: (s) => `The Old Light looms on the cliffs above town: a broken stump of ancient stone, taller than any tower a living mason could build. Fishermen say goblins have been seen picking through its rubble since the raid.\n\nBrodert Quink is already outside his door with a satchel, three pencils behind each ear and a determined expression. ${f(s, 'thassilonLore') ? '"My star pupils! You understand the importance. Take me with you!"' : '"Goblins, scratching at a ten-thousand-year-old wonder! Someone must protect it! I mean, you must. With me watching. Please."'}`,
    choices: [
      { t: 'Bring Quink along. Carefully.', go: 'sp_ol_ruins', set: { sp_quinkEscort: true } },
      { t: 'Promise to bring him rubbings, and go without him.', go: 'sp_ol_ruins' },
    ],
  },
  sp_ol_ruins: {
    scene: 'forest',
    text: (s) => `The climb ends among tumbled blocks the size of wagons. The surviving wall is carved with faded figures and a seven-pointed star.\n\nYou are not alone. Down in a hollow, a pack of goblins is prying at the stones with spoons and singing a song about "shiny old rocks for the Mistress." A goblin dog gnaws on something best left unexamined.${f(s, 'sp_quinkEscort') ? '\n\nQuink hisses, "They are using SPOONS on Thassilonian masonry!" {tank} gently covers his mouth.' : ''}`,
    choices: [
      { t: 'Creep closer for a surprise attack.', check: { skill: 'stealth', dc: 13, who: 'party' }, pass: 'sp_ol_sneak', fail: 'sp_ol_spotted' },
      { t: 'Charge in before they wreck anything else.', go: 'sp_ol_fight' },
    ],
  },
  sp_ol_sneak: {
    scene: 'forest',
    text: `{who} leads the way, rock to rock, shadow to shadow. You get close enough to hear the goblins arguing about whether the carved star is "a pointy flower or a squished bug."\n\nThe goblin dog lifts its head and sniffs. Too late.`,
    choices: [{ t: 'Strike first!', go: 'sp_ol_fight_surprise' }],
  },
  sp_ol_spotted: {
    scene: 'forest',
    text: `A loose pebble clatters down the slope, bounces off a goblin's head, and lands in its spoon. The goblin looks at the pebble. Then it looks up at you.\n\n"LONGSHANKS! Longshanks want our shiny rocks!" The warchanter starts a brand-new song, and it is about you, and it is rude.`,
    choices: [{ t: 'Fight!', go: 'sp_ol_fight' }],
  },
  sp_ol_fight: { combat: 'oldlight', win: 'sp_ol_after' },
  sp_ol_fight_surprise: { combat: 'oldlight', surprise: 'party', win: 'sp_ol_after' },
  sp_ol_after: {
    scene: 'forest',
    text: (s) => `The last goblin flees down the cliff, still clutching a spoon. In their hollow you find what they were digging for: a palm-sized chunk of dark stone, carved with a perfect seven-pointed star. It is cold to the touch and oddly heavy, like it remembers being part of something much bigger.${f(s, 'sp_quinkEscort') ? '\n\nQuink makes a noise like a teakettle. "A Sihedron fragment! Intact! In situ! Well, formerly in situ!"' : ''}\n\nWhy would goblins want an old rock? Unless someone told them to.`,
    on: [{ set: { sp_sihedronShard: true } }, { gold: 25 }],
    choices: [
      { t: 'Study the carvings around the dig.', check: { skill: 'arcana', dc: 14, who: 'party', bonus: (s) => (f(s, 'thassilonLore') ? 3 : 0) + (f(s, 'sp_quinkEscort') ? 2 : 0) }, pass: 'sp_ol_lore', fail: 'sp_ol_nolore' },
      { t: 'Pocket the fragment and get off this windy cliff.', go: 'day2' },
    ],
  },
  sp_ol_lore: {
    scene: 'forest',
    text: (s) => `{who} brushes grit from the wall and the pattern clicks into place. The Old Light was never a lighthouse. Its carvings describe a great fire that burned at its crown, a weapon of the Runelord of Wrath, aimed out to sea at her enemies.\n\nAnd the stone beneath the cliffs is riddled with older passages, all leading inland, toward the very spot where the Glassworks now stands.${f(s, 'sp_quinkEscort') ? '\n\nQuink is weeping happily into his notebook. "I knew it. I KNEW it."' : ''}`,
    on: [{ set: { sp_oldlightLore: true } }],
    choices: [{ t: 'Head back to town, minds buzzing.', go: 'day2' }],
  },
  sp_ol_nolore: {
    scene: 'forest',
    text: `You squint at the carvings until they blur. There are angry faces, a lot of fire, and something that might be a giant or might be a very tall bird. {arcane} insists one glyph means "doom" and another means either "harbor" or "lunch."\n\nYou make careful rubbings anyway. Someone wiser can make sense of them later. Down below, the sea grinds at the cliff, patient as ever.`,
    choices: [{ t: 'Head back to town.', go: 'day2' }],
  },

  // ============================================================ 3. Sczarni trouble
  sp_sz: {
    scene: 'sandpoint', chapter: 'Local Heroes',
    text: `Down on the docks, an old fisherman named Wenzel is clutching a basket of mackerel while three men in bright scarves loom over him. Their leader wears a gold tooth and a grin to match.\n\n"Rebuilding after a goblin raid is expensive, grandpa," he purrs. "Protection is cheap. Ten silver a week, and nothing bad happens to your boat."\n\nThese are Sczarni, Varisian swindlers who run little rackets up and down the coast. Wenzel spots you and his eyes plead silently.`,
    choices: [
      { t: '"Walk away. Now." (Intimidate)', check: { skill: 'intimidate', dc: 15, who: 'party' }, pass: 'sp_sz_scared', fail: 'sp_sz_brawl' },
      { t: '"Easy, cousin. Old Wenzel is under the boss\'s protection already." (Bluff)', check: { skill: 'bluff', dc: 14, who: 'player' }, pass: 'sp_sz_bluff', fail: 'sp_sz_brawl' },
      { t: 'Pay Wenzel\'s "fee" yourself to settle it quietly.', go: 'sp_sz_paid' },
      { t: 'Draw steel.', go: 'sp_sz_fight' },
    ],
  },
  sp_sz_scared: {
    scene: 'sandpoint',
    text: `{who} steps forward and simply looks at them. It is the look of someone who fought a goblin horde yesterday and would honestly enjoy a second helping.\n\nThe gold-toothed man's grin wobbles. "Heroes. Right. No trouble here." The three of them back off the pier and melt into the alleys, but not before their leader spits on the boards and mutters, "Sandpoint's a small town, friends. We'll be seeing you."\n\nWenzel presses two fat mackerel into your arms and a potion he swears his late wife brewed.`,
    on: [{ potions: 1 }, { set: { sp_sczarniEnemy: true, sp_wenzelSaved: true } }],
    choices: TOWN,
  },
  sp_sz_bluff: {
    scene: 'sandpoint',
    text: `You lean in and drop a name you half-remember from a Magnimar tavern, then add a secret-sounding hand sign that is actually how you tell {tank} you need the salt.\n\nThe thugs go pale. "We didn't know he was under protection! Honest!" Their leader bows and backs away, babbling apologies. "Tell the boss we were polite! We were polite, right?"\n\nWenzel stares at you in awe. "Are you really..." You wink. He decides not to ask. The Sczarni now believe you are somebody important. That could be handy. Or very awkward.`,
    on: [{ set: { sp_sczarniFooled: true, sp_wenzelSaved: true } }],
    choices: TOWN,
  },
  sp_sz_paid: {
    scene: 'sandpoint',
    text: `You count out a handful of silver into the leader's palm. He raises an eyebrow, impressed. "Generous. Most heroes just want to hit things."\n\nHe tucks the coins away and tips his cap. "Name's Rosto. The family remembers people who are sensible. If you ever need something found, or someone lost, ask for me at the Fatman's Feedbag." The three of them stroll off whistling.\n\nWenzel thanks you with damp eyes. You are lighter in the purse, but the docks feel a little friendlier.`,
    on: [{ set: { sp_sczarniFavor: true, sp_wenzelSaved: true } }],
    choices: TOWN,
  },
  sp_sz_brawl: {
    scene: 'sandpoint',
    text: `It does not go as planned. The gold-toothed man laughs in your face. "Cute. Boys, this one wants a lesson."\n\nHe whistles, and the three of them shove Wenzel aside and back toward an open warehouse, waving you in with knives and wicked grins. Inside, there are crates to hide behind and nobody on the street to see what happens.\n\n{tank} cracks their knuckles. "Fine by me."`,
    choices: [{ t: 'Follow them in.', go: 'sp_sz_fight' }],
  },
  sp_sz_fight: { combat: 'sczarni', win: 'sp_sz_after' },
  sp_sz_after: {
    scene: 'sandpoint',
    text: `The warehouse is a mess of broken crates and groaning thugs. Their gold-toothed leader sits against a barrel of salted cod, nursing a split lip. "All right! All right. You win. We'll leave the old man alone."\n\nAmong the crates you find a stash of stolen festival goods: candlesticks, a lute, three wheels of cheese and a purse of coins.\n\nWenzel peeks in from the doorway. "What, er, what happens to him now?"`,
    on: [{ gold: 40 }, { set: { sp_wenzelSaved: true } }],
    choices: [
      { t: 'Haul them to Sheriff Hemlock and return the stolen goods.', go: 'sp_sz_jail' },
      { t: 'Let them go, with a message for their friends.', go: 'sp_sz_release' },
    ],
  },
  sp_sz_jail: {
    scene: 'sandpoint', npc: 'hemlock',
    text: `Sheriff Hemlock looks at the three dazed thugs, then at you, then at the cheese. "I've been trying to pin something on that lot for a year." It might be the closest thing to a smile his face can do.\n\nThe stolen goods go back to their owners, and by evening half the market knows who caught the Sczarni. The other half, unfortunately, are Sczarni. You catch a few cold stares from scarf-wearing folk as you walk past the fish stalls.`,
    on: [{ set: { sp_sczarniEnemy: true, townHero: true, sp_hemlockTrust: true } }],
    choices: TOWN,
  },
  sp_sz_release: {
    scene: 'sandpoint',
    text: `You haul the leader to his feet and dust off his scarf. "Tell your people Sandpoint has new friends. Stay off the docks, and we'll stay off your backs."\n\nHe studies you for a long moment, then nods slowly. "Fair. That's fair." He limps out with his crew, and from the doorway he calls back: "The name's Rosto. I owe you one, hero. The family pays its debts."\n\n{healer} raises an eyebrow. "Was that wise?" Time will tell.`,
    on: [{ set: { sp_sczarniFavor: true } }],
    choices: TOWN,
  },

  // ============================================================ 4. Aldern's gift
  sp_al: {
    scene: 'inn', npc: 'aldern', chapter: 'Local Heroes',
    text: (s) => `A servant in Foxglove livery is waiting at the Rusty Dragon with a parcel wrapped in green silk. Inside: a silver hand mirror engraved with your name, a box of sugared violets, a purse of "travel money," and a small painted portrait of you. A good likeness. Remarkably good, for a man who met you during a goblin attack${f(s, 'aldernHunt') ? ' and spent one afternoon with you in the Tickwood' : ''}.\n\nThe letter is four pages long, in looping violet ink. It thanks you, praises you, and invites you to dine at his family's manor near Magnimar, "whenever fate allows, and I do so hope it allows soon."`,
    on: [{ gold: 50 }],
    choices: [
      { t: 'Read the letter again, slowly. (Sense Motive)', check: { skill: 'sense', dc: 14, who: 'player' }, pass: 'sp_al_suspicious', fail: 'sp_al_charmed' },
      { t: 'Eat a sugared violet and enjoy being admired.', go: 'sp_al_charmed' },
    ],
  },
  sp_al_suspicious: {
    scene: 'inn', npc: 'aldern',
    text: `The second time through, small things snag. The handwriting is neat for three pages, then cramped and hurried, as if written much later, by lamplight. The ink is blotted where the pen pressed too hard.\n\nAnd one line sits oddly among the flattery: "I have not slept well since the festival. When I close my eyes I see your face, and some nights I see it even when they are open."\n\nIt is probably just a lonely nobleman being dramatic. Probably. You fold the letter and tuck it away, and you notice that you would rather not look into the silver mirror.`,
    on: [{ set: { sp_aldernSuspicious: true } }],
    choices: [
      { t: 'Write back warmly. He is only grateful.', go: 'sp_al_warm' },
      { t: 'Write back politely, and keep it short.', go: 'sp_al_cool' },
    ],
  },
  sp_al_charmed: {
    scene: 'inn', npc: 'aldern',
    text: `The violets are delicious. The mirror is lovely. The portrait is honestly flattering, and {skirm} insists on holding it up next to your face for comparison, then announces that the painter "was very generous with the chin."\n\nAldern Foxglove clearly has more money than friends, and right now he seems to have decided you are both. There are worse things to be than adored by a rich nobleman.\n\nThe servant waits patiently, holding a pen and a sheet of fine paper for your reply.`,
    choices: [
      { t: 'Write back warmly.', go: 'sp_al_warm' },
      { t: 'Write back politely, and keep it short.', go: 'sp_al_cool' },
    ],
  },
  sp_al_warm: {
    scene: 'inn',
    text: (s) => `You write a kind letter, thanking him for the gifts and promising to visit Magnimar someday. The servant bows so low his nose nearly brushes the floor, and hurries off as if the reply were made of glass.\n\n${f(s, 'sp_aldernSuspicious') ? 'As he goes, you catch him glancing back at the inn with an odd, anxious look, like a man who dreads going home.' : 'Ameiko\'s cook, watching from the kitchen, mutters, "That one will write you every week now, mark me."'}\n\nThe portrait ends up propped on the mantel. Its painted eyes seem to follow you around the room.`,
    on: [{ set: { sp_aldernReply: 'warm' } }],
    choices: TOWN,
  },
  sp_al_cool: {
    scene: 'inn',
    text: (s) => `You write three polite lines: thank you, very kind, perhaps one day. The servant reads the length of it at a glance and his face falls, though he bows all the same.\n\n${f(s, 'sp_aldernSuspicious') ? '"My master will be... disappointed," he says quietly. "He does not take disappointment well, these days." Then he seems to realize he has said too much, and leaves in a hurry.' : '"My master will treasure it," he says, sounding unsure.'}\n\nYou keep the gold and the violets. The portrait goes face-down in the bottom of your pack.`,
    on: [{ set: { sp_aldernReply: 'cool' } }],
    choices: TOWN,
  },

  // ============================================================ 5. The garrison training yard
  sp_yard: {
    scene: 'sandpoint', chapter: 'Local Heroes',
    text: `Behind the Sandpoint Garrison, a dozen young guards are practicing spear drills with the enthusiasm of soggy bread. Last night shook them badly. Several are bandaged, and one jumps every time a gull screams.\n\nSergeant Ilsa Brand, a broad woman with a voice like a ship's bell, waves you over. "You lot! The heroes of the square! My recruits think goblins are unstoppable now. Show them otherwise, would you?"\n\nA freckled recruit named Dobbs steps up with a wooden practice sword, trembling but game.`,
    choices: [
      { t: 'Spar with Dobbs, and make it a good show.', check: { skill: 'str', dc: 14, who: 'player' }, pass: 'sp_yard_win', fail: 'sp_yard_lose' },
      { t: 'Teach the recruits how goblins fight instead.', check: { skill: 'diplomacy', dc: 13, who: 'party' }, pass: 'sp_yard_teach', fail: 'sp_yard_teach_fail' },
    ],
  },
  sp_yard_win: {
    scene: 'sandpoint',
    text: `You let Dobbs take a few swings to find his feet, then step in, turn his blade, and tap him lightly on the helmet. Then you show him how you did it. Then you let him do it to you.\n\nBy the third round, the whole yard is cheering him on. Dobbs lands one clean hit and nearly cries with joy. Sergeant Brand nods slowly. "That's the first time they've smiled since the raid." She hands you a pair of healing draughts from the garrison stores. "On the house. Don't tell the quartermaster."`,
    on: [{ potions: 1 }, { set: { sp_guardRespect: true } }],
    choices: TOWN,
  },
  sp_yard_lose: {
    scene: 'sandpoint',
    text: `Dobbs swings wildly, eyes squeezed shut, and by pure luck catches you right on the knuckles. You drop your sword. You step on a rake. The rake handle swings up and thwacks you on the forehead with a sound like a dropped melon.\n\nThe yard is silent. Then Dobbs raises his practice sword over his head and roars. The recruits mob him like he just slew a dragon.\n\nSergeant Brand helps you up, biting back a grin. "Honestly? Best morale boost I've had all year. Thank you for your sacrifice."`,
    on: [{ damage: { who: 'player', dice: '1d3' } }, { set: { sp_dobbsLegend: true } }],
    choices: TOWN,
  },
  sp_yard_teach: {
    scene: 'sandpoint',
    text: `You gather the recruits in a circle and explain what you learned last night. Goblins are fast, but fear horses and dogs. They hate being outnumbered. They will chase anything shiny, and they cannot resist a good insult song, which makes them easy to bait.\n\n{arcane} draws diagrams in the dirt. {tank} shows them how to brace a spear. By noon the recruits are drilling in tight pairs, chanting a rude counter-song about goblin smells.\n\nSergeant Brand shakes your hand. "If they come back, we'll be ready. Thanks to you."`,
    on: [{ set: { sp_guardsTrained: true, sp_guardRespect: true } }],
    choices: TOWN,
  },
  sp_yard_teach_fail: {
    scene: 'sandpoint',
    text: `You start with a vivid description of the goblin who tried to bite your ear off. The recruits go pale. You continue with the one who set a dog on fire, and the dog kept fighting. One of them quietly sits down on the ground.\n\n"Maybe," Sergeant Brand suggests, "a little less horror and a little more hope?"\n\nYou try. It sort of works. At least they are now very motivated never to let a goblin near them, and that is something.`,
    choices: TOWN,
  },

  // ============================================================ 6. Ameiko's grief
  sp_am: {
    scene: 'inn', npc: 'ameiko', chapter: 'The Glassworks',
    text: `The Rusty Dragon is quiet tonight. Regulars talk in murmurs and leave their coins on the bar without being asked. Ameiko is behind it, polishing the same mug she was polishing an hour ago.\n\nHer knuckles are bruised. Her eyes are dry, which somehow is worse. Her father is dead, encased in his own glass. Her brother is in a cell for it.\n\nWhen she sees you, she straightens and puts on her innkeeper's smile. "Heroes! What can I get you?" It does not reach her eyes at all.`,
    choices: [
      { t: 'Gently ask how she is really doing.', check: { skill: 'diplomacy', dc: 13, who: 'player', bonus: (s) => (f(s, 'ameikoFriend') ? 2 : 0) + (f(s, 'ameikoSaved') ? 2 : 0) }, pass: 'sp_am_open', fail: 'sp_am_closed' },
      { t: 'Say nothing. Pull up a stool and simply keep her company.', go: 'sp_am_quiet' },
    ],
  },
  sp_am_open: {
    scene: 'inn', npc: 'ameiko',
    text: `For a moment she keeps polishing. Then she sets the mug down very carefully, like it might break.\n\n"We fought. Every time we spoke, we fought. He wanted a proper daughter, and I ran off to be an adventurer instead." She laughs, a cracked little sound. "I always thought there'd be time to fix it. That's the trouble with time."\n\nShe talks for a long while: about the Glassworks, about her mother, about Tsuto as a lonely boy. When she finishes she reaches under the bar and presses a small, cherry-red bottle into your hand. "My old adventuring stash. Use it well. And thank you."`,
    on: [{ potions: 1 }, { set: { sp_ameikoBond: true } }],
    choices: NIGHT,
  },
  sp_am_closed: {
    scene: 'inn', npc: 'ameiko',
    text: `"I'm fine," she says, a little too quickly. "Really. There's an inn to run. Someone has to keep the ale flowing for the heroes, right?"\n\nShe busies herself restocking a shelf that is already full. You have pushed at a door she is not ready to open. {healer} touches your sleeve and shakes their head gently: not tonight, not like this.\n\nStill, Ameiko glances back at you as you turn to go, and something in her face asks you not to leave just yet.`,
    choices: [
      { t: 'Stay anyway, and just sit with her.', go: 'sp_am_quiet' },
      { t: 'Give her space. Walk back out into the night.', go: 'evening' },
    ],
  },
  sp_am_quiet: {
    scene: 'inn', npc: 'ameiko',
    text: `You pull up a stool. You do not say anything. After a while, Ameiko pours two cups of tea she clearly does not want and slides one across to you.\n\nThe fire crackles. The last customers drift home. Somewhere around midnight, she takes down the old samisen hanging above the hearth and plays a slow, sad tune her father used to hum while he worked. Her voice wavers on the last verse, but she finishes it.\n\n"Thanks," she says at last, very softly. "For not trying to fix it." It is the most real thing anyone has said all day.`,
    on: [{ set: { sp_ameikoBond: true } }],
    choices: NIGHT,
  },

  // ============================================================ 7. Questioning Tsuto
  sp_ts: {
    scene: 'night', npc: 'hemlock', chapter: 'The Glassworks',
    text: `The Sandpoint jail smells of damp stone and lamp oil. Sheriff Hemlock unlocks the inner door. "He hasn't said a word since we brought him in. Not to me, not to the priest. You beat him. Maybe he'll talk to you."\n\nTsuto sits on his cot with his back to the wall, arms wrapped around his knees. Without his swagger he looks younger, and very tired. He watches you with Ameiko's eyes.\n\n"Come to gloat?" he asks the ceiling.`,
    choices: [
      { t: '"Tell us about Thistletop. Now." (Intimidate)', check: { skill: 'intimidate', dc: 16, who: 'player' }, pass: 'sp_ts_break', fail: 'sp_ts_silent' },
      { t: '"Your sister is grieving. Help us end this." (Diplomacy)', check: { skill: 'diplomacy', dc: 16, who: 'player', bonus: (s) => (f(s, 'sp_ameikoBond') ? 4 : 0) + (f(s, 'tsutoCaptured') ? 2 : 0) }, pass: 'sp_ts_talk', fail: 'sp_ts_silent' },
      { t: 'Say nothing. Watch him closely. (Sense Motive)', check: { skill: 'sense', dc: 14, who: 'party' }, pass: 'sp_ts_read', fail: 'sp_ts_silent' },
    ],
  },
  sp_ts_break: {
    scene: 'night', npc: 'tsuto',
    text: `You lean in close, and keep leaning, until Tsuto's back hits the stone. His bravado lasts four heartbeats.\n\n"Fine! Fine. You want Thistletop? There is one bridge to the island, a rope bridge, and the archers on the far side shoot anything that walks across it. But the goblins are lazy. They never watch the cliff path on the landward side, below the bramble wall." He swallows. "And the chief, Ripnugget, is a coward. Break his bodyguards and he will grovel."\n\nThen, very quietly: "She'll know I talked. She always knows."`,
    on: [{ set: { sp_tsutoIntel: true } }],
    choices: [{ t: 'Step back out to Hemlock.', go: 'sp_ts_end' }],
  },
  sp_ts_talk: {
    scene: 'night', npc: 'tsuto',
    text: `At the word "sister," something in Tsuto flinches. "Ameiko always got the best of everything. Father's pride. Father's name. I got his silence." He stares at his hands. "Then Nualia looked at me like I mattered. Do you know how rare that is?"\n\nYou let the quiet stretch. At last he sighs. "Thistletop has one bridge, and archers watch it. Cross at dusk, when the sun is in their eyes. And there is something under the fort, in the sea caves. The goblins won't go down there. Neither would I."\n\nHe turns to the wall. "Tell Ameiko... no. Don't tell her anything."`,
    on: [{ set: { sp_tsutoIntel: true, sp_tsutoHeart: true } }],
    choices: [{ t: 'Step back out to Hemlock.', go: 'sp_ts_end' }],
  },
  sp_ts_read: {
    scene: 'night', npc: 'tsuto',
    text: `{who} watches instead of talking. Tsuto's fingers keep straying to a thread around his wrist, where a lock of silver-white hair is braided tight. Every time footsteps pass the door, he flinches toward the window, not away from it. He is not afraid of the sheriff. He is afraid of being rescued.\n\nYou say so, quietly. Tsuto's composure cracks. "She doesn't rescue people. She collects them." His voice drops. "If you go to Thistletop, cross at dusk. The archers hate the setting sun."`,
    on: [{ set: { sp_tsutoRead: true, sp_tsutoIntel: true } }],
    choices: [{ t: 'Step back out to Hemlock.', go: 'sp_ts_end' }],
  },
  sp_ts_silent: {
    scene: 'night', npc: 'tsuto',
    text: `Tsuto simply smiles, a thin, empty smile, and starts humming a lullaby under his breath. It is the same tune you might hear a mother sing in a Tian village, sweet and very old.\n\nNo matter what you try, he does not say another word. After a while, he lies down on the cot and turns his face to the wall, still humming.\n\nAs you leave, you realize where you have heard that tune before: Ameiko hums it too, when she thinks no one is listening.`,
    choices: [{ t: 'Step back out to Hemlock.', go: 'sp_ts_end' }],
  },
  sp_ts_end: {
    scene: 'night', npc: 'hemlock',
    text: (s) => `Hemlock locks the door behind you and lets out a long breath. ${f(s, 'sp_tsutoIntel') ? '"More than he gave me in a whole day. Well done. I\'ll send word to the garrison to keep an eye on the north road, in case his angel comes calling."' : '"Don\'t take it hard. He\'s been like that with everyone. We\'ll try again when he\'s hungrier."'}\n\nHe walks you to the door and pauses on the step. "Whatever's under the Glassworks, be careful down there. This town has buried enough people this week."`,
    choices: NIGHT,
  },

  // ============================================================ 8. A night patrol
  sp_np: {
    scene: 'night', chapter: 'The Glassworks',
    text: (s) => `Deputy Pell, a lanky watchman with a lantern and a nervous laugh, catches you outside the inn. "Heroes! Good. Er. This will sound silly, but something is moving on the waterfront, and I'd rather not look at it alone."\n\nYou follow him down to the fog-wrapped docks.${sczarniFriendly(s) ? ' A scarf-wearing loafer on a crate catches your eye, points silently toward the fish market, and gives you a respectful nod. The Sczarni seem to be on your side tonight.' : ''}${f(s, 'sp_sczarniEnemy') ? ' A shutter clicks shut above you. Someone in a bright scarf ducks out of sight. You have the uneasy feeling of being watched.' : ''}\n\nBetween the stalls, a fish barrel is waddling slowly along the pier. On its own.`,
    choices: [
      { t: 'Sneak up on the barrel.', check: { skill: 'stealth', dc: 13, who: 'party' }, pass: 'sp_np_barrel', fail: 'sp_np_barrel_loud' },
      { t: 'March right up with Deputy Pell\'s lantern held high.', go: 'sp_np_barrel_loud' },
    ],
  },
  sp_np_barrel: {
    scene: 'night',
    text: (s) => `{who} creeps up behind the barrel and lifts the lid a crack. Two huge yellow eyes stare up out of a pile of pickled herring. A goblin, wedged in up to its armpits, chewing.\n\n"Is not goblin," it whispers. "Is barrel. Go away."\n\nDeputy Pell makes a small, high-pitched noise.${f(s, 'sp_sczarniEnemy') && !f(s, 'sp_ambushDone') ? '\n\nThen you hear it: soft footsteps on the planks behind you, and the scrape of a knife being drawn.' : ''}`,
    choices: BARREL_CHOICES,
  },
  sp_np_barrel_loud: {
    scene: 'night',
    text: (s) => `You trip over a coil of net, Deputy Pell yelps, and the lantern swings wildly. The barrel freezes mid-waddle. After a long pause, a muffled voice inside says, very firmly, "Is just barrel."\n\nYou knock on the lid. It knocks back.\n\nInside, wedged up to its armpits in pickled herring, sits a small and very greasy goblin, chewing guiltily.${f(s, 'sp_sczarniEnemy') && !f(s, 'sp_ambushDone') ? '\n\nThen you hear it: soft footsteps on the planks behind you, and the scrape of a knife being drawn.' : ''}`,
    choices: BARREL_CHOICES,
  },
  sp_np_ambush: {
    scene: 'night',
    text: `You spin around. Three figures in bright scarves step out of the fog, and the one in front flashes a gold tooth. "Told you Sandpoint was a small town, heroes. Let's settle our business somewhere private."\n\nDeputy Pell squeaks and hides behind the barrel. The barrel squeaks and hides behind Deputy Pell. The Sczarni wave you toward the dark mouth of a warehouse with their knives.`,
    choices: [{ t: 'Settle it, then.', go: 'sp_np_fight' }],
  },
  sp_np_fight: { combat: 'sczarni', win: 'sp_np_ambush_after' },
  sp_np_ambush_after: {
    scene: 'night',
    text: `The Sczarni limp away into the fog, swearing to leave town by morning. This time you believe them. Deputy Pell emerges, shaking, and announces he is putting you all in his report "in very large letters."\n\nOne of the fleeing thugs dropped a pouch of coin. Finders keepers, says {skirm}.\n\nAnd the barrel, astonishingly, is still there, trembling slightly. A small voice from inside says, "Is over? Barrel can go now?"`,
    on: [{ gold: 30 }, { set: { sp_sczarniBroken: true } }],
    choices: BARREL_CHOICES,
  },
  sp_np_talk: {
    scene: 'night',
    text: `{who} dangles a herring just out of reach. The goblin's resistance lasts about two seconds. It pops out of the barrel, snatches the fish and introduces itself as Gubbles. Gubbles ran away from the raid because "fire is scary when it is not on purpose."\n\nIn exchange for the rest of the barrel, Gubbles spills everything. "Big boss lady with silver hair at Thistletop. She makes all tribes be friends. Very bad. Goblins hate friends. And under the fort, in the wet caves, she keeps the Big Doggy. Big Doggy eats goblins."\n\nGubbles then waddles off into the night, barrel and all.`,
    on: [{ set: { sp_goblinSnitch: true } }],
    choices: NIGHT,
  },
  sp_np_bolt: {
    scene: 'night',
    text: `You reach in with the herring. The goblin bites the herring. Then it bites your finger, for good measure. Then it bursts out of the barrel in an explosion of pickle brine, cackles, and cannonballs off the end of the pier into the black water.\n\nThere is a splash, a gurgle, and a faint, triumphant song fading out toward the sea.\n\nDeputy Pell writes something in his notebook. "Suspect... escaped... by swimming." He looks up. "Can goblins swim?" Apparently so.`,
    on: [{ damage: { who: 'player', dice: '1d2' } }],
    choices: NIGHT,
  },
  sp_np_jail: {
    scene: 'night', npc: 'hemlock',
    text: `You hammer the lid shut and roll the barrel up the hill. It complains the entire way, in goblin, at length.\n\nSheriff Hemlock opens the jail door, looks at the barrel, and looks at you. "What is that?" The barrel says, "Is barrel." Hemlock closes his eyes for a moment, like a man counting to ten.\n\nThe goblin, it turns out, is happy to trade gossip for herring: the silver-haired lady at Thistletop keeps "something big" in the sea caves. Hemlock pays you a watch bounty, mostly, you suspect, so you will leave.`,
    on: [{ gold: 20 }, { set: { sp_goblinJailed: true } }],
    choices: NIGHT,
  },
};

export const HOOKS = {
  day2: [
    { t: 'Take the infamous Hagfish challenge at the dockside tavern.', go: 'sp_hag', if: (s) => !s.flags.v_hagfish, set: { v_hagfish: true, visitedAny: true } },
    { t: 'Climb to the Old Light ruins, where goblins have been seen.', go: 'sp_ol', if: (s) => !s.flags.v_oldlight, set: { v_oldlight: true, visitedAny: true } },
    { t: 'Check on the shouting down by the fishing docks.', go: 'sp_sz', if: (s) => !s.flags.v_sczarni, set: { v_sczarni: true, visitedAny: true } },
    { t: 'Open the silk-wrapped parcel waiting at the Rusty Dragon.', go: 'sp_al', if: (s) => s.flags.aldernSaved && !s.flags.v_aldernGift, set: { v_aldernGift: true, visitedAny: true } },
    { t: 'Help out at the Sandpoint Garrison training yard.', go: 'sp_yard', if: (s) => !s.flags.v_yard, set: { v_yard: true, visitedAny: true } },
  ],
  evening: [
    { t: 'Sit with Ameiko at the Rusty Dragon.', go: 'sp_am', if: (s) => !s.flags.v_ameikoGrief, set: { v_ameikoGrief: true } },
    { t: 'Visit the jail and question Tsuto with Sheriff Hemlock.', go: 'sp_ts', if: (s) => !s.flags.v_tsutoJail, set: { v_tsutoJail: true } },
    { t: 'Join the town watch on a night patrol of the waterfront.', go: 'sp_np', if: (s) => !s.flags.v_patrol, set: { v_patrol: true } },
  ],
};

export const SCENES = {
  sp_hag: [
    { who: 'skirm', text: 'I have stolen many things. I would not steal that fish.' },
    { who: 'tank', text: 'Seen worse in army stew.' },
    { who: 'hero', text: H('Someone has to take the challenge. Might as well be me.', 'It\'s kind of cute? In a horrible way?', 'It\'s staring.', 'That fish has seen things. Bad things. Probably in that water.') },
  ],
  sp_hag_win: [
    { who: 'healer', text: 'I\'m saying a prayer for your stomach. A long one.' },
    { who: 'skirm', text: 'Champion of the Hagfish! I\'m telling everyone. Forever.' },
    { who: 'hero', text: H('Victory... tastes terrible.', 'Gold! And only a little queasy!', 'Never again.', 'Worth it. Ask me again in an hour.') },
  ],
  sp_hag_lose: [
    { who: 'tank', text: 'Two gulps. Respectable.' },
    { who: 'healer', text: 'Sit down. Breathe. And please stop burping near me.' },
    { who: 'hero', text: H('I\'ll get it next time.', 'Well, that was an experience!', '...', 'The fish won. Let it have this.') },
  ],
  sp_hag_trick: [
    { who: 'skirm', text: 'Teamwork! Also, I may have pocketed a tankard in the chaos.' },
    { who: 'healer', text: 'That was not honest.' },
    { who: 'hero', text: H('Half the jar. A fair compromise.', 'We\'re a great team!', 'Leave. Now.', 'Cheating is just winning with extra steps.') },
  ],
  sp_hag_caught: [
    { who: 'arcane', text: 'There is fish in my hat. There is fish in my HAT.' },
    { who: 'skirm', text: 'Amateur hour. You never look guilty. Rule one.' },
  ],
  sp_hag_watch: [
    { who: 'tank', text: 'Cast-iron pot. Hah.' },
    { who: 'skirm', text: 'Free lunch is the best lunch.' },
  ],
  sp_ol: [
    { who: 'arcane', text: 'The Old Light! Finally! I\'ve only been asking for two days!' },
    { who: 'tank', text: 'If the old man comes, he walks behind me.' },
  ],
  sp_ol_ruins: [
    { who: 'arcane', text: 'Spoons. They\'re digging up history with spoons.' },
    { who: 'skirm', text: 'Spoons are underrated. Very good for prying.' },
    { who: 'hero', text: H('We stop them before they do more damage.', 'Goblin archaeologists! Sort of adorable!', 'Count them. Then move.', 'Ten thousand years of history, and these are its guardians.') },
  ],
  sp_ol_sneak: [
    { who: 'skirm', text: 'Pointy flower. Definitely a pointy flower.' },
  ],
  sp_ol_spotted: [
    { who: 'tank', text: 'Who kicked the pebble?' },
    { who: 'hero', text: H('No more hiding. Forward!', 'Whoops. Hi, goblins!', 'So much for quiet.', 'Wonderful. A song about me. Finally, fame.') },
  ],
  sp_ol_after: [
    { who: 'arcane', text: 'A Sihedron fragment! I may faint. Someone catch me. Not Brannoc, he drops things.' },
    { who: 'healer', text: 'Goblins don\'t dig for history. Someone sent them.' },
    { who: 'hero', text: H('We keep this safe, whatever it is.', 'It\'s so pretty! And creepy!', 'Cold. Heavy. I don\'t like it.', 'Great. A cursed rock. Just what my pack needed.') },
  ],
  sp_ol_lore: [
    { who: 'arcane', text: 'A WEAPON. The Old Light was a WEAPON. Pass me my notebook. All of my notebooks.' },
    { who: 'tank', text: 'Tunnels toward the Glassworks. Remember that.' },
  ],
  sp_ol_nolore: [
    { who: 'arcane', text: 'Harbor or lunch. It\'s definitely one of those.' },
    { who: 'skirm', text: 'I vote lunch.' },
  ],
  sp_sz: [
    { who: 'tank', text: 'Three of them. One old man. Not fair.' },
    { who: 'skirm', text: 'I know that scarf pattern. Magnimar crew. Pricey taste, cheap tricks.' },
    { who: 'hero', text: H('Leave him alone!', 'Hey! Mackerel bullies! Shoo!', 'Bad idea, friend.', 'Protection money? How original.') },
  ],
  sp_sz_scared: [
    { who: 'tank', text: 'Good. Saved me a swing.' },
    { who: 'healer', text: 'He said they\'d be seeing us. I didn\'t like how he said it.' },
  ],
  sp_sz_bluff: [
    { who: 'tank', text: 'You told me that sign meant "pass the salt."' },
    { who: 'skirm', text: 'It\'s a classic. I\'m so proud I could cry.' },
    { who: 'hero', text: H('A small lie for a good man\'s sake.', 'I can\'t believe that worked!', 'Don\'t ask me what boss.', 'Apparently I\'m Sczarni royalty now. Bow.') },
  ],
  sp_sz_paid: [
    { who: 'healer', text: 'Paying off thieves feels wrong. But no one got hurt.' },
    { who: 'skirm', text: 'Rosto. Fatman\'s Feedbag. Noted. Useful friends are useful.' },
  ],
  sp_sz_brawl: [
    { who: 'skirm', text: 'Following knife men into a dark warehouse. Classic us.' },
    { who: 'hero', text: H('Then let\'s teach the lesson.', 'Ooh, warehouse fight!', 'Fine.', 'Of course it\'s a warehouse. It\'s always a warehouse.') },
  ],
  sp_sz_after: [
    { who: 'skirm', text: 'Three wheels of cheese. This is the best fight of my life.' },
    { who: 'healer', text: 'Those candlesticks belong to the cathedral. Zantus will be so relieved.' },
  ],
  sp_sz_jail: [
    { who: 'tank', text: 'Hemlock smiled. I saw it.' },
    { who: 'hero', text: H('Justice is served.', 'The sheriff likes us!', 'More enemies. Fine.', 'Cold stares from the fish stalls. Love that for us.') },
  ],
  sp_sz_release: [
    { who: 'skirm', text: 'A Sczarni who owes you one. That\'s better than gold.' },
    { who: 'healer', text: 'Or worse. Debts cut both ways.' },
  ],
  sp_al: [
    { who: 'skirm', text: 'He painted you. From memory. That\'s... a lot of memory.' },
    { who: 'healer', text: 'It\'s very generous. Very, very generous.' },
    { who: 'hero', text: H('It\'s kind of him. I think.', 'Presents! For me!', 'Hm.', 'Four pages. He used both sides.') },
  ],
  sp_al_suspicious: [
    { who: 'healer', text: 'Even when his eyes are open? That poor man needs rest. Or help.' },
    { who: 'tank', text: 'Keep the letter. Just in case.' },
    { who: 'hero', text: H('He sounds troubled. I hope he\'s all right.', 'Maybe he\'s just a really dramatic writer?', 'Something\'s wrong with him.', 'Lovely. A fan club of one, and he doesn\'t sleep.') },
  ],
  sp_al_charmed: [
    { who: 'skirm', text: 'Very generous with the chin. Very.' },
    { who: 'arcane', text: 'The brushwork is genuinely excellent. Magnimar school, I think.' },
  ],
  sp_al_warm: [
    { who: 'skirm', text: 'Weekly letters. Get ready for a lot of violet ink.' },
  ],
  sp_al_cool: [
    { who: 'healer', text: 'Kind, but honest. That was fair.' },
    { who: 'skirm', text: 'Face-down in the pack. Brutal. I respect it.' },
  ],
  sp_yard: [
    { who: 'tank', text: 'Feet wider, lad. You\'ll fall over in a breeze.' },
    { who: 'hero', text: H('Courage can be taught. Let\'s teach it.', 'Training day! This\'ll be fun!', 'They\'re scared. Fair.', 'This is the town\'s defense? Gods help us.') },
  ],
  sp_yard_win: [
    { who: 'tank', text: 'Good lesson. He\'ll remember it.' },
    { who: 'healer', text: 'Did you see his face? Pure joy.' },
  ],
  sp_yard_lose: [
    { who: 'skirm', text: 'The rake! The RAKE! I\'ll treasure this until I die.' },
    { who: 'healer', text: 'Hold still. That\'s going to be a lovely lump.' },
    { who: 'hero', text: H('A small price for their courage.', 'Ow! But look how happy he is!', 'Never mention this.', 'Dobbs, Slayer of Heroes. I\'ll never live this down.') },
  ],
  sp_yard_teach: [
    { who: 'arcane', text: 'My dirt diagrams were a triumph of military pedagogy.' },
    { who: 'tank', text: 'They\'ll do.' },
  ],
  sp_yard_teach_fail: [
    { who: 'healer', text: 'Maybe skip the flaming dog next time.' },
    { who: 'skirm', text: 'I thought it was a great story.' },
  ],
  sp_am: [
    { who: 'healer', text: 'She\'s holding herself together with string and stubbornness.' },
    { who: 'hero', text: H('She shouldn\'t have to carry this alone.', 'Let\'s be gentle with her.', 'Grief takes time.', 'That smile is the worst acting I\'ve ever seen.') },
  ],
  sp_am_open: [
    { who: 'healer', text: 'You said the right thing. Sometimes there isn\'t one, and you still found it.' },
    { who: 'tank', text: 'She\'s strong. She\'ll come through.' },
  ],
  sp_am_closed: [
    { who: 'healer', text: 'Grief opens on its own schedule. Not ours.' },
  ],
  sp_am_quiet: [
    { who: 'tank', text: 'Good. Sometimes you just sit.' },
    { who: 'skirm', text: 'I didn\'t make a single joke for a whole hour. Somebody write that down.' },
    { who: 'hero', text: H('We\'re here for you, Ameiko. Always.', 'That song was beautiful.', '...', 'Fine. Maybe I have something in my eye.') },
  ],
  sp_ts: [
    { who: 'healer', text: 'He looks so young like this.' },
    { who: 'tank', text: 'He left his father in glass. Remember that.' },
  ],
  sp_ts_break: [
    { who: 'tank', text: 'Cliff path. Landward side. Good.' },
    { who: 'hero', text: H('Thank you, Tsuto. That may save lives.', 'See? That wasn\'t so hard!', 'Useful.', 'Wow. He folded like a cheap tent.') },
  ],
  sp_ts_talk: [
    { who: 'healer', text: 'He just wanted to matter to somebody. That\'s how she got him.' },
    { who: 'arcane', text: 'Something in the sea caves that even goblins avoid. I\'m writing that down in red.' },
  ],
  sp_ts_read: [
    { who: 'healer', text: 'A lock of her hair. He still loves her, even now.' },
    { who: 'hero', text: H('She collects people. We\'ll free the ones we can.', 'That\'s so sad. And so creepy.', 'She has a hold on him.', 'Romantic. In a horrifying, cult-y way.') },
  ],
  sp_ts_silent: [
    { who: 'skirm', text: 'That lullaby gave me the shivers.' },
    { who: 'healer', text: 'Maybe their mother sang it. Before everything went wrong.' },
  ],
  sp_ts_end: [
    { who: 'tank', text: 'Hemlock\'s a good man. Too tired, though.' },
  ],
  sp_np: [
    { who: 'skirm', text: 'A walking barrel. Finally, a mystery I can get behind.' },
    { who: 'tank', text: 'Stay behind me, deputy.' },
  ],
  sp_np_barrel: [
    { who: 'skirm', text: 'Is not goblin. Is barrel. I love it.' },
    { who: 'hero', text: H('Come out slowly. No one will hurt you.', 'Hi, little barrel!', 'That is a goblin.', 'Oh yes, a very convincing barrel.') },
  ],
  sp_np_barrel_loud: [
    { who: 'arcane', text: 'The barrel knocked back. I have questions.' },
    { who: 'hero', text: H('Show yourself!', 'Knock knock! Who\'s there? Barrel!', 'Open it.', 'Clearly just a barrel. Case closed.') },
  ],
  sp_np_ambush: [
    { who: 'tank', text: 'Should\'ve hit them harder the first time.' },
    { who: 'hero', text: H('You should have left town while you could.', 'You again? Seriously?', 'Bad idea.', 'Small town, small grudges, small brains.') },
  ],
  sp_np_ambush_after: [
    { who: 'skirm', text: 'Finders keepers. That\'s the law.' },
    { who: 'healer', text: 'That is not the law, and you know it.' },
  ],
  sp_np_talk: [
    { who: 'skirm', text: 'Gubbles is my favorite goblin. Gubbles is my only favorite goblin.' },
    { who: 'healer', text: 'Big Doggy. Under the fort. That doesn\'t sound like a pet.' },
    { who: 'hero', text: H('Thank you, Gubbles. Stay out of trouble.', 'Bye, Gubbles! Be good!', 'Big Doggy. Noted.', 'Our best informant is a goblin in a fish barrel. Peak heroism.') },
  ],
  sp_np_bolt: [
    { who: 'healer', text: 'Let me see that finger. Goblin bites go bad quickly.' },
    { who: 'tank', text: 'Goblins swim. Learn something every day.' },
  ],
  sp_np_jail: [
    { who: 'skirm', text: 'Hemlock counting to ten is my new favorite thing.' },
    { who: 'hero', text: H('One more prisoner for the sheriff.', 'Delivery for the sheriff! One barrel!', 'Done.', 'He paid us to leave. That\'s a first.') },
  ],
};

export const CAMP = [
  { if: (s) => s.flags.sp_hagfishChampion, lines: [
    { who: 'skirm', text: 'So. Champion of the Hagfish. How\'s the tummy?' },
    { who: 'hero', text: H('Holding strong. Like Sandpoint.', 'It gurgles sometimes! Is that normal?', 'Don\'t.', 'I can still taste it. Thanks for asking.') },
    { who: 'tank', text: 'Your name\'s on the beam. That\'s forever, that is.' },
  ] },
  { if: (s) => s.flags.sp_sihedronShard, lines: [
    { who: 'arcane', text: 'I keep taking the Sihedron fragment out to look at it. It\'s always colder than the air around it.' },
    { who: 'healer', text: 'Maybe stop taking it out, then?' },
    { who: 'arcane', text: 'Seven points. Seven sins. And someone wanted it badly enough to send goblins with spoons.' },
    { who: 'hero', text: H('We\'ll find out who. And why.', 'Spooky rock club! I\'m in!', 'Bury it, maybe.', 'Can we not cuddle the cursed rock at bedtime?') },
  ] },
  { if: (s) => s.flags.sp_sczarniEnemy && !s.flags.sp_sczarniBroken, lines: [
    { who: 'tank', text: 'Someone\'s been watching our camp. Scarf. Gold tooth.' },
    { who: 'skirm', text: 'Sczarni hold grudges. Longer than goblins hold songs.' },
    { who: 'hero', text: H('Let them come. We stand together.', 'Maybe they just want to be friends?', 'We sleep in shifts.', 'Great. Fans.') },
  ] },
  { if: (s) => s.flags.sp_sczarniFavor || s.flags.sp_sczarniFooled, lines: [
    { who: 'skirm', text: 'Found a little bundle on my bedroll. Dried figs and a note: "From friends."' },
    { who: 'healer', text: 'From Sczarni friends. Are we sure that\'s a good thing?' },
    { who: 'skirm', text: 'It\'s figs. Figs are always a good thing.' },
  ] },
  { if: (s) => s.flags.sp_aldernSuspicious, lines: [
    { who: 'healer', text: 'I keep thinking about Aldern\'s letter. "Even when they are open."' },
    { who: 'hero', text: H('If he\'s in trouble, I hope he asks for help.', 'Maybe he just writes like a poet?', 'Something\'s wrong in that house.', 'Every hero gets one creepy admirer. Mine has a manor.') },
    { who: 'tank', text: 'If we ever go to Magnimar, we go together.' },
  ] },
  { if: (s) => s.flags.sp_ameikoBond, lines: [
    { who: 'healer', text: 'Ameiko played her father\'s song tonight. I heard it from upstairs.' },
    { who: 'tank', text: 'She\'ll be all right. She has us.' },
    { who: 'hero', text: H('Then we make sure she does.', 'We should bring her flowers tomorrow!', 'Aye.', 'Don\'t tell anyone, but I cried a little.') },
  ] },
  { if: (s) => s.flags.sp_tsutoIntel || s.flags.sp_goblinSnitch, lines: [
    { who: 'arcane', text: 'Let\'s pool what we know about Thistletop. One bridge. Archers. Something in the sea caves.' },
    { who: 'skirm', text: 'A "Big Doggy." Everyone keeps mentioning the Big Doggy.' },
    { who: 'tank', text: 'Then we plan for a big dog.' },
  ] },
];

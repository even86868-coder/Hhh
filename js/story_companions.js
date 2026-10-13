// Companion arcs: one three-beat personal story per companion.
// Beat 1 hooks into raid_end, beat 2 into evening, beat 3 into hemlock. Each beat ends with '__return'.
// Contract: NODES (story nodes), HOOKS (hostNodeId -> extra choices), SCENES (banter by node id), CAMP (campfire talks).
// Flags: cq_<name>1_done/2_done/3_done (beat taken), arc-internal cq_<name>_* flags,
// and the outcomes loyal_<Name> / rift_<Name>.

const inParty = (name) => (s) => s.party.some((c) => c.name === name && !c.isPlayer);
const f = (s, k) => !!s.flags[k];
const H = (heroic, cheerful, grim, snarky) => ({ heroic, cheerful, grim, snarky });
const back = (t) => ({ t, go: '__return' });

export const NODES = {
  // ================================================================ BRANNOC
  // Beat 1: the garrison memorial (after the raid)
  cq_brannoc1: {
    scene: 'night', chapter: 'Brannoc: Names on the Wall',
    text: `Brannoc isn't at the Rusty Dragon. You find him at the old militia garrison, where a wall of driftwood boards carries the names of watchmen who never came home. Goblin torches scorched half of them tonight.\n\nBrannoc is scrubbing soot off one name with his own sleeve. HOLLIS. He doesn't turn around.\n\n"Couldn't leave it like that." A long pause. "My brother. Younger. Twelve years gone." Another pause, longer. "Should be my name up there. Not his."\n\nThe sea wind rattles the boards. He keeps scrubbing, though the name is already clean.`,
    choices: [
      { t: 'Grab a rag and clean the next board, saying nothing.', go: 'cq_brannoc1_quiet' },
      { t: 'Ask about Hollis, gently.', check: { skill: 'diplomacy', dc: 13, who: 'player' }, pass: 'cq_brannoc1_open', fail: 'cq_brannoc1_shut' },
      { t: 'Look over the memorial while he works.', check: { skill: 'perception', dc: 12, who: 'party' }, pass: 'cq_brannoc1_flowers', fail: 'cq_brannoc1_shut' },
    ],
  },
  cq_brannoc1_quiet: {
    scene: 'night',
    text: `You find a rag and start on the next board. Nobody speaks. The moon climbs. Somewhere a dog barks at nothing.\n\nAfter a long while, Brannoc says, "He was funny. Funnier than me." He considers. "Low bar."\n\nThen, in short bursts, like a man paying out rope: Hollis loved fried eel. Hollis sang off-key on purpose to annoy the captain. Hollis once tried to ride a cow on a dare and lost a tooth.\n\nWhen the last board is clean, Brannoc nods once. "Thanks. For not talking." From him, it sounds like a medal.`,
    on: [{ set: { cq_brannoc_bond: true } }],
    choices: [back('Walk back to the inn together.')],
  },
  cq_brannoc1_open: {
    scene: 'night',
    text: `Brannoc's hands stop. For a moment you think he won't answer.\n\n"Goblin push on the Brinestump road. I was sergeant. Told Hollis to hold the old footbridge while I took the rest to the farms." His jaw works. "He held it. Alone. By the time I got back..." He doesn't finish.\n\nHe sets the rag down very carefully, as if it might break.\n\n"Twelve years I've been late." Then, gruffer: "Don't tell Tamsin. She'll pray at me."\n\nYou promise. He almost smiles.`,
    on: [{ set: { cq_brannoc_bond: true, cq_brannoc_story: true } }],
    choices: [back('Sit with him a while, then head to bed.')],
  },
  cq_brannoc1_shut: {
    scene: 'night',
    text: `Wrong moment. Brannoc's shoulders lock up like a portcullis.\n\n"Not tonight."\n\nHe goes back to scrubbing, harder than before. You stand there feeling like you've stepped on a grave, which, in fairness, you sort of have.\n\nBut as you turn to go, his voice stops you. "...Stay. If you want."\n\nSo you sit on an upturned bucket while he works, and neither of you says anything else. It isn't nothing. It might even be a start.`,
    choices: [back('Head back once he finishes.')],
  },
  cq_brannoc1_flowers: {
    scene: 'night',
    text: `Tucked behind Hollis's board, half-hidden, is a bundle of dried sea-poppies tied with faded militia cord. The knot is an old watchman's hitch, the kind nobody bothers to teach anymore.\n\nBrannoc sees you looking and goes very still. He touches the knot with one thick finger.\n\n"Dunmore," he says. "Dunmore Kell. Stood the bridge watch with us." He frowns. "Thought he'd drunk himself into the sea years back."\n\nHe stares at the poppies for a long time. "Someone still remembers him. Huh."`,
    on: [{ set: { cq_brannoc_dunmore: true, cq_brannoc_bond: true } }],
    choices: [back('Leave the poppies where they are and head back.')],
  },

  // Beat 2: the old comrade (evening after the Glassworks)
  cq_brannoc2: {
    scene: 'inn', chapter: 'Brannoc: The Bridge Watch',
    text: (s) => `Brannoc asks, with great reluctance, whether you'd walk with him to the Hagfish, the dockside tavern where old sailors go to forget things. ${f(s, 'cq_brannoc_dunmore') ? 'He wants to find the man who left the poppies.' : 'Someone there has been asking after him all day.'}\n\nIn the corner sits a one-eyed wreck of a man with a militia tattoo gone blue with age: Dunmore Kell. He sees Brannoc and goes the color of old porridge.\n\n"Sergeant." He raises a shaking mug. "Twelve years I've meant to tell you something. Never had the stones to say it sober."\n\nBrannoc doesn't sit. His knuckles are white.`,
    choices: [
      { t: 'Sit Dunmore down with bread and strong tea, and let him talk.', check: { skill: 'diplomacy', dc: 12, who: 'player' }, pass: 'cq_brannoc2_truth', fail: 'cq_brannoc2_mess' },
      { t: 'Lean in hard: "Say it plain, Dunmore. Now."', check: { skill: 'intimidate', dc: 14, who: 'player' }, pass: 'cq_brannoc2_truth', fail: 'cq_brannoc2_mess' },
      { t: 'Let Brannoc decide whether he wants to hear it.', go: 'cq_brannoc2_leave' },
    ],
  },
  cq_brannoc2_truth: {
    scene: 'inn',
    text: `Dunmore talks, and the story comes out wrong. Wrong compared to the one Brannoc has carried, anyway.\n\nHollis never held the bridge alone. He was ordered to fall back. He stayed because a farm girl, maybe six, was trapped on the far side, and he carried her across with goblins on his heels.\n\n"And you, Sergeant," Dunmore croaks. "The captain ordered you to hold the farms. You ran back anyway. Only one of us who did." He wipes his eye. "You weren't late. You were the only one who came."\n\nBrannoc sits down, very slowly, like his legs have quit.`,
    on: [{ set: { cq_brannoc_truth: true } }],
    choices: [back('Stay until the candles burn down.')],
  },
  cq_brannoc2_mess: {
    scene: 'inn',
    text: `It goes badly. Dunmore gets defensive, then weepy, then knocks over three mugs and a chair. The words come out in pieces: "the girl... he wouldn't leave the girl... the captain said HOLD... you came back, you stubborn ox, you came back..."\n\nThen he slides gently under the table and starts snoring.\n\nBrannoc lifts him like a sack of flour and carries him home to a shack by the docks. On the walk back he says only, "Heard enough."\n\nBut you can see the pieces rattling around behind his eyes, refusing to fit.`,
    on: [{ set: { cq_brannoc_half: true } }],
    choices: [back('Walk Brannoc back to the inn.')],
  },
  cq_brannoc2_leave: {
    scene: 'inn',
    text: `You look at Brannoc. Brannoc looks at the door.\n\n"Twelve years," he says. "Can wait twelve more." He walks out into the night without another word.\n\nDunmore sags. Then he grabs your sleeve with surprising strength and presses something into your palm: a worn wooden militia token, carved on both sides.\n\n"Give him that. When he's ready. Not before." His one eye is wet and clear. "He'll know when."\n\nYou pocket it. It feels heavier than wood should.`,
    on: [{ set: { cq_brannoc_token: true } }],
    choices: [back('Go after Brannoc.')],
  },

  // Beat 3: forgiveness (before Thistletop)
  cq_brannoc3: {
    scene: 'sandpoint', npc: 'hemlock', chapter: 'Brannoc: Hold the Line',
    text: (s) => `At the north gate, Brannoc is checking his straps for the fourth time. Goblins in the Nettlewood. Goblins at Thistletop. Goblins, same as twelve years ago.\n\n"If I freeze out there," he mutters, without looking up, "leave me. Don't come back for me. Promise."${f(s, 'cq_brannoc_truth') ? '\n\nDunmore\'s story hangs between you, unspoken.' : ''}${f(s, 'cq_brannoc_half') ? '\n\nThe broken pieces of Dunmore\'s story still rattle around between you.' : ''}${f(s, 'cq_brannoc_token') ? '\n\nDunmore\'s token sits in your pocket like a coal.' : ''}\n\nSheriff Hemlock watches from the gatehouse, arms folded. He knew both brothers. He says nothing, which is very loud.`,
    choices: [
      { t: '"You weren\'t late, Brannoc. You were the one who came back."', go: 'cq_brannoc3_forgive', if: (s) => f(s, 'cq_brannoc_truth') },
      { t: 'Give him Dunmore\'s token.', go: 'cq_brannoc3_token', if: (s) => f(s, 'cq_brannoc_token') },
      { t: 'Ask Sheriff Hemlock what really happened at the bridge.', check: { skill: 'diplomacy', dc: 14, who: 'player', bonus: (s) => (f(s, 'cq_brannoc_half') ? 3 : 0) }, pass: 'cq_brannoc3_token', fail: 'cq_brannoc3_stuck', if: (s) => !f(s, 'cq_brannoc_truth') && !f(s, 'cq_brannoc_token') },
      { t: '"Hollis wouldn\'t want you carrying him. He\'d want you to live."', check: { skill: 'diplomacy', dc: 15, who: 'player', bonus: (s) => (f(s, 'cq_brannoc_bond') ? 2 : 0) }, pass: 'cq_brannoc3_forgive', fail: 'cq_brannoc3_stuck' },
      { t: '"Bury it. We need a sword out there, not a sob story."', go: 'cq_brannoc3_rift' },
    ],
  },
  cq_brannoc3_token: {
    scene: 'sandpoint', npc: 'hemlock',
    text: (s) => `${f(s, 'cq_brannoc_token') ? 'You hold out the token. Brannoc takes it like it might bite.' : 'Hemlock unfolds his arms, reaches into his coat and hands Brannoc a worn wooden token. "Dunmore left this with me years ago. Said you\'d need it someday."'}\n\nOne side reads, in clumsy carved letters: H. HOLLIS. CARRIED THE GULL GIRL. BRAVE FOOL.\n\nThe other side: SGT CAME BACK FOR HIM. ONLY ONE.\n\nHemlock's voice is gravel. "I was there when you carried your brother home, Brannoc. Nobody blamed you. Nobody but you."\n\nBrannoc turns the token over and over. His mouth moves, but nothing comes out.`,
    on: [{ set: { cq_brannoc_truth: true } }],
    choices: [{ t: 'Put a hand on his shoulder.', go: 'cq_brannoc3_forgive' }],
  },
  cq_brannoc3_forgive: {
    scene: 'sandpoint', npc: 'hemlock',
    text: `Brannoc breathes out, long and slow, like a man setting down a pack he forgot he was wearing.\n\nHe pulls an old militia badge from his belt pouch, Hollis's badge, and pins it to his armor beside his own.\n\n"Hollis'd laugh at me. Twelve years of moping." Then something happens to his face that you've never seen before. It takes you a moment to recognize it as a smile.\n\n"Right. Let's go hit some goblins. For him." He catches your eye. "Don't tell Pip I smiled. Ruins my reputation."\n\nHemlock tosses you a potion as you pass. "From the watch. Bring him back."`,
    on: [{ set: { loyal_Brannoc: true } }, { potions: 1 }],
    choices: [back('Set out, side by side.')],
  },
  cq_brannoc3_stuck: {
    scene: 'sandpoint', npc: 'hemlock',
    text: `Brannoc listens. He nods. But his eyes go somewhere far away, to an old footbridge on the Brinestump road.\n\n"Maybe," he says. "After Thistletop."\n\nHe shoulders his shield and walks out through the gate. Hemlock watches him go, then gives you a small, tired shrug, the shrug of a man who has tried this conversation before.\n\nSome wounds close in a day. Some take a lifetime. At least he isn't walking alone.`,
    choices: [back('Follow him out.')],
  },
  cq_brannoc3_rift: {
    scene: 'sandpoint', npc: 'hemlock',
    text: `Brannoc goes still. Then he nods, once, very precisely.\n\n"Right. A sword." His voice is flat as a frozen pond. "That's what I'm for."\n\nHe turns away and doesn't look at you again. Hemlock's frown could curdle milk.\n\nBrannoc will still stand in front of you when the arrows fly. That's who he is. But whatever door had cracked open in him these past few days has just swung shut, and you're the one who closed it.`,
    on: [{ set: { rift_Brannoc: true } }],
    choices: [back('Set out in uncomfortable silence.')],
  },

  // ================================================================ TAMSIN
  // Beat 1: the child she can't heal
  cq_tamsin1: {
    scene: 'cathedral', chapter: 'Tamsin: The Cough',
    text: `The new cathedral has become an infirmary. Tamsin moves between cots, golden light flickering from her hands, until she stops beside a small girl named Wren from the Turandarok orphanage.\n\nWren's smoke burns are gone. Her cough isn't. It rattles, deep and old, like something living in her chest.\n\n"Three times," Tamsin whispers. "I've channeled three times. The burns close. The cough stays." Her hands are shaking. "Sarenrae's light should be enough. Why isn't it enough?"\n\nWren tugs Tamsin's sleeve. "Can you tell me the sun story again?"`,
    choices: [
      { t: 'Examine Wren yourself.', check: { skill: 'heal', dc: 14, who: 'party' }, pass: 'cq_tamsin1_cause', fail: 'cq_tamsin1_story' },
      { t: 'Tell Wren a story so Tamsin can rest.', go: 'cq_tamsin1_story' },
      { t: '"Maybe some things just can\'t be fixed."', go: 'cq_tamsin1_hard' },
    ],
  },
  cq_tamsin1_cause: {
    scene: 'cathedral',
    text: `{who} leans close and sniffs Wren's blanket. Damp. Musty. Speckled with grey-green fuzz.\n\n"Where do you sleep, Wren?" "By the wall. It's wet when it rains. Which is always."\n\nIt isn't a curse or a punishment from the gods. It's mold. Months of breathing it. No spell can fix a leaky roof.\n\nTamsin stares at the blanket, then laughs, half a sob. "I've been asking a goddess to fix bad carpentry." She wipes her eyes. "A dry room, herb steam, clean bedding. Ameiko has a spare room. I'll ask her tonight."\n\nWren beams. "Is it a room with a cat?"`,
    on: [{ set: { cq_tamsin_cause: true, cq_tamsin_bond: true } }],
    choices: [back('Help carry Wren to the Rusty Dragon.')],
  },
  cq_tamsin1_story: {
    scene: 'cathedral',
    text: `You sit on the edge of Wren's cot and tell her about the sun, who once got lost behind a mountain and had to ask a goat for directions. The goat was rude. The sun was very polite about it. There is a chase scene.\n\nBy the time the sun finds its way home, Wren is asleep, breathing a little easier.\n\nTamsin has watched the whole thing from the next cot, chin in hands. "I forget sometimes," she says softly, "that the light isn't only in the spells." She squeezes your hand. "Thank you. Really."`,
    on: [{ set: { cq_tamsin_comfort: true, cq_tamsin_bond: true } }],
    choices: [back('Let Tamsin rest and slip out.')],
  },
  cq_tamsin1_hard: {
    scene: 'cathedral',
    text: `Tamsin's head snaps up. For a moment there is real fire in her eyes, the Dawnflower's own temper.\n\n"Then I'll find out why," she says. "And then I'll fix that."\n\nShe turns back to Wren and doesn't look at you again. When you leave, she's still there, holding the girl's hand, lips moving in a prayer that sounds less like asking and more like arguing.\n\nShe may be right. You may be right. Either way, she'll be awake until dawn.`,
    on: [{ set: { cq_tamsin_doubt: true } }],
    choices: [back('Leave her to her vigil.')],
  },

  // Beat 2: Nualia, the "miracle"
  cq_tamsin2: {
    scene: 'cathedral', chapter: 'Tamsin: Tobyn\'s Angel',
    text: (s) => `Tamsin sits on the cathedral steps, staring at the scorched ground where the old chapel burned. Tsuto's journal has shaken her.\n\n"Nualia," she says. "They called her Tobyn's angel. A miracle child. People rubbed her hair for luck. Asked her to bless their fishing nets." She hugs her knees. "And she broke. She broke so badly she ran to Lamashtu."\n\n"What if that's what I do? Promise people miracles until the promise crushes someone?"${f(s, 'cq_tamsin_cause') ? '\n\nAcross the square, a lamp burns in Ameiko\'s spare room, where Wren\'s cough is already softer.' : ''}`,
    choices: [
      { t: '"Faith isn\'t a promise of miracles. It\'s showing up anyway."', check: { skill: 'religion', dc: 13, who: 'player' }, pass: 'cq_tamsin2_faith', fail: 'cq_tamsin2_fumble' },
      { t: '"The town failed Nualia, not the goddess. You see people, not miracles."', check: { skill: 'diplomacy', dc: 14, who: 'player', bonus: (s) => (f(s, 'cq_tamsin_bond') ? 2 : 0) }, pass: 'cq_tamsin2_people', fail: 'cq_tamsin2_fumble' },
      { t: '"Maybe stop praying for a while. Take a break."', go: 'cq_tamsin2_doubt' },
    ],
  },
  cq_tamsin2_faith: {
    scene: 'cathedral',
    text: `Tamsin is quiet for a long moment. Then she nods slowly.\n\n"The old sermons say the Dawnflower doesn't burn the night away all at once. She rises a little every morning. Every single morning, even the cloudy ones." She looks at her hands. "She never promised me I'd fix everything. She promised I wouldn't be alone while I tried."\n\nShe stands, brushing off her robes, and some of the old steel is back in her spine. "Right. Enough sulking on steps. I have a cat to find for a little girl."`,
    on: [{ set: { cq_tamsin_faith: true } }],
    choices: [back('Help her hunt for a cat.')],
  },
  cq_tamsin2_people: {
    scene: 'cathedral',
    text: `Tamsin blinks. "Nobody ever asked Nualia what she wanted," she says slowly. "Did they? They just wanted things from her."\n\nShe looks across the square toward the Rusty Dragon. "I never asked Wren either. I just kept throwing light at her like she was a broken lamp."\n\nShe marches off. Ten minutes later she returns, flushed and laughing. "I asked her. Do you know what she wants more than anything in the world? A cat. An orange one. Named Duke."\n\n"I can do that," Tamsin says. "No miracle required."`,
    on: [{ set: { cq_tamsin_faith: true, cq_tamsin_bond: true } }],
    choices: [back('Begin Operation Duke.')],
  },
  cq_tamsin2_fumble: {
    scene: 'cathedral',
    text: `You try. You really do. But somewhere in the middle your theology gets tangled, and you end up explaining that Sarenrae is "sort of like a big friendly lamp who also has a sword, and the sword is also a lamp."\n\nTamsin stares at you. Then she laughs so hard she has to lie down on the steps.\n\n"That was terrible," she gasps. "That was the worst sermon I've ever heard." She wipes her eyes. "Thank you. I needed that more than the right answer."`,
    on: [{ set: { cq_tamsin_laugh: true } }],
    choices: [back('Sit with her until the stars come out.')],
  },
  cq_tamsin2_doubt: {
    scene: 'cathedral',
    text: `Tamsin doesn't argue. That's the worst part.\n\n"Maybe," she says. She pinches out the little candle she'd lit on the steps and watches the smoke curl away.\n\nShe stays there a long time, small against the great cathedral doors. When you finally head back to the inn, she follows a few steps behind, sun amulet tucked inside her robes where nobody can see it.\n\nYou've seen her face a goblin horde without blinking. You've never seen her look this lost.`,
    on: [{ set: { cq_tamsin_shaken: true } }],
    choices: [back('Walk back in silence.')],
  },

  // Beat 3: mercy
  cq_tamsin3: {
    scene: 'sandpoint', chapter: 'Tamsin: Mercy',
    text: (s) => `Before you leave for Thistletop, Tamsin pulls you aside by the well.\n\n"When we find Nualia," she says, "Sarenrae teaches redemption. Anyone can come back to the light. But the Dawnflower also carries a scimitar." She twists her amulet. "If Nualia can be saved, I want to try. If she can't... I need to know where you stand. Before we're in the fire."${f(s, 'cq_tamsin_cause') ? '\n\nWren runs up, barely coughing, with a crayon drawing of four heroes and one enormous orange cat, and presses it into Tamsin\'s hands.' : ''}${f(s, 'cq_tamsin_shaken') ? '\n\nHer voice wobbles. She still hasn\'t found her footing.' : ''}`,
    choices: [
      { t: '"Mercy first. Steel only if she leaves us no choice."', go: 'cq_tamsin3_mercy', if: (s) => !f(s, 'cq_tamsin_shaken') },
      { t: '"Mercy isn\'t magic. It\'s a choice you keep making. Like you did for Wren."', check: { skill: 'diplomacy', dc: 15, who: 'player', bonus: (s) => (f(s, 'cq_tamsin_faith') ? 3 : 0) + (f(s, 'cq_tamsin_cause') ? 2 : 0) }, pass: 'cq_tamsin3_mercy', fail: 'cq_tamsin3_unsure' },
      { t: '"We\'ll save her, no matter the cost."', go: 'cq_tamsin3_reckless' },
      { t: '"No mercy. She tried to burn this whole town."', go: 'cq_tamsin3_rift' },
    ],
  },
  cq_tamsin3_mercy: {
    scene: 'sandpoint',
    text: `Tamsin lets out a breath. Then she unties a ribbon of sun-yellow silk from her own wrist and ties it around yours, knotting it twice.\n\n"Mercy first," she agrees. "Then steel. And whatever happens, we carry it together." She tucks a small vial into your pack. "Blessed it myself. Don't tell Father Zantus I used his good holy water."\n\nShe takes a deep breath and looks north, toward the thorns and the sea. She is small and stubborn and absolutely unafraid.\n\n"Right. Let's go give a lost girl one more chance."`,
    on: [{ set: { loyal_Tamsin: true, cq_tamsin_mercyNualia: true } }, { potions: 1 }],
    choices: [back('Set out with the ribbon on your wrist.')],
  },
  cq_tamsin3_unsure: {
    scene: 'sandpoint',
    text: `Tamsin listens, nodding along, but the words don't quite land. She looks down at her hands as if waiting for them to tell her the answer.\n\n"I want to believe that," she says finally. "I'm just not sure I'm strong enough to choose it when it counts."\n\nShe tucks her amulet back inside her robes and shoulders her pack. "We'll see when we get there, I suppose."\n\nIt isn't a no. But it isn't the Tamsin who faced down a goblin horde, either. Not yet.`,
    choices: [back('Set out for Thistletop.')],
  },
  cq_tamsin3_reckless: {
    scene: 'sandpoint',
    text: `Tamsin smiles, but it's a sad little smile. She shakes her head.\n\n"No matter the cost isn't mercy," she says gently. "That's pride wearing mercy's robes. If saving Nualia means losing you, or Sandpoint, then it isn't saving anyone."\n\nShe pats your arm. "But thank you for wanting to. Your heart's in the right place. Your arithmetic just needs work."\n\nShe still looks worried. But she's teaching instead of doubting, and that's something.`,
    on: [{ set: { cq_tamsin_vow: true } }],
    choices: [back('Set out, a little chastened.')],
  },
  cq_tamsin3_rift: {
    scene: 'sandpoint',
    text: `Something in Tamsin's face closes, gently, like a door eased shut so as not to wake anyone.\n\n"I see," she says. "Then I'll pray for both of you. Her, and you."\n\nShe doesn't raise her voice. She doesn't argue. She just walks to the front of the group and stays there, back straight, not looking around.\n\nShe will still heal your wounds. She'd heal Nualia's too, if it came to that. But tonight, she won't be sharing the campfire with you.`,
    on: [{ set: { rift_Tamsin: true } }],
    choices: [back('Set out, with a distance between you.')],
  },

  // ================================================================ QUILLAN
  // Beat 1: the warm shard
  cq_quillan1: {
    scene: 'night', chapter: 'Quillan: A Warm Stone',
    text: `While everyone else collapses, Quillan is on his hands and knees beside a fallen goblin, lantern in his teeth. He pries something from its necklace of bottlecaps and teeth: a chip of seamless black stone, a jagged red rune scratched across it.\n\n"Thassilonian!" he crows, nearly dropping the lantern. "Ten thousand years old, worn by a goblin who probably tried to eat it! Do you know what this is? Neither do I! Isn't that wonderful?"\n\nThen he goes quiet, turning it over in his long fingers. "It's warm," he says. "Why is it warm?"`,
    choices: [
      { t: 'Help him identify the rune.', check: { skill: 'arcana', dc: 13, who: 'party' }, pass: 'cq_quillan1_lore', fail: 'cq_quillan1_curious' },
      { t: '"Ooh. Tell me everything!"', go: 'cq_quillan1_curious' },
      { t: '"Put it down, Quillan. Warm ancient rocks are never good news."', go: 'cq_quillan1_caution' },
    ],
  },
  cq_quillan1_lore: {
    scene: 'night',
    text: `{who} traces the rune in the lantern light. Seven strokes, one bent back on itself like a clenched fist. Wrath. The sin of Alaznist, Runelord of the old empire.\n\n"A ward-shard," Quillan breathes. "Broken off something bigger. And still charged, after ten millennia!" He holds it up to his ear, half joking. Then his smile slips.\n\n"That's odd. It almost feels like it's... listening." He laughs nervously and tucks it into a pouch. "Purely metaphorically. Rocks don't listen. Probably."\n\nHe doesn't stop touching the pouch all the way back to the inn.`,
    on: [{ set: { cq_quillan_lore: true, cq_quillan_shard: true } }],
    choices: [back('Head back to the Rusty Dragon.')],
  },
  cq_quillan1_curious: {
    scene: 'night',
    text: `That's all the invitation Quillan needs.\n\nBy the time you reach the inn, you have learned about the seven Runelords, the Thassilonian alphabet (all three of them), the proper pronunciation of "Xin-Shalast," and why most historians are, in Quillan's words, "absolute turnips."\n\nHe is incandescent with joy. He hasn't had anyone listen this long since he left the elven libraries.\n\n"You're a marvelous audience," he says at your door, clutching the shard. "I'm going to sleep with this under my pillow. For scholarship." It glows faintly red through his fingers. He doesn't seem to notice.`,
    on: [{ set: { cq_quillan_curious: true, cq_quillan_shard: true } }],
    choices: [back('Wish him goodnight.')],
  },
  cq_quillan1_caution: {
    scene: 'night',
    text: `Quillan looks wounded, then sheepish. "You sound like my aunt Velarys. She also told me not to lick the lightning crystal." He pauses. "She was right about that, actually."\n\nHe wraps the shard in a scrap of oilcloth, then another, then a third, and tucks it at the very bottom of his pack under three books and a spare sock.\n\n"There. Contained. Responsible. Very boring." He sighs. "But I'm keeping it. For the Academy. Possibly."\n\nYou notice he walks slightly faster than usual, as if the pack is pushing him.`,
    on: [{ set: { cq_quillan_caution: true, cq_quillan_shard: true } }],
    choices: [back('Head back to the inn.')],
  },

  // Beat 2: whispers from below
  cq_quillan2: {
    scene: 'glassworks', chapter: 'Quillan: A Grammar of Anger',
    text: (s) => `Quillan's bed is empty. You find him in the Glassworks basement, sitting cross-legged at the mouth of the smugglers' tunnel, staring down into the dark.\n\n${f(s, 'cq_quillan_caution') ? 'The shard lies unwrapped beside him, its oilcloth folded neatly. He doesn\'t remember unwrapping it.' : 'The shard glows on his knee like an ember.'} His notebook is full of runes. Line after line of them, in a script he's never been taught.\n\n"Can you hear it?" he whispers. His eyes have a faint red sheen. "It's a grammar. A grammar of anger. It wants me to finish a sentence." He giggles. "Just one sentence."`,
    choices: [
      { t: 'Kneel beside him and gently say his name until he looks at you.', check: { skill: 'diplomacy', dc: 13, who: 'player' }, pass: 'cq_quillan2_back', fail: 'cq_quillan2_snapped' },
      { t: 'Study what he\'s written before it goes further.', check: { skill: 'arcana', dc: 15, who: 'party', bonus: (s) => (f(s, 'cq_quillan_lore') ? 3 : 0) }, pass: 'cq_quillan2_understand', fail: 'cq_quillan2_snapped' },
      { t: '"Finish it. What\'s the worst that could happen?"', go: 'cq_quillan2_tempt' },
    ],
  },
  cq_quillan2_back: {
    scene: 'glassworks',
    text: `"Quillan. Quillan. Hey. Quillan."\n\nOn the sixth try, he blinks. The red drains from his eyes like wine from a glass. He looks down at the notebook, at the hundreds of runes he doesn't remember writing, and goes pale as parchment.\n\n"Oh," he says. "Oh, that's... that's not good, is it? That's the opposite of good." His hands are shaking. "I didn't even notice I'd stopped thinking."\n\nHe closes the notebook. Then, with visible effort, he hands it to you. "Hold onto this. Please. Until I'm less... me."`,
    on: [{ set: { cq_quillan_anchor: true } }],
    choices: [back('Walk him back to bed.')],
  },
  cq_quillan2_understand: {
    scene: 'glassworks',
    text: `{who} reads the scrawled lines and feels a chill. It isn't a message. It's a hook.\n\nSin magic feeds on the reader's own passion. A greedy man would hear gold calling. A wrathful one, insults. And a scholar who loves knowledge more than anything hears the most delicious unanswered question in the world.\n\nYou explain it. Quillan listens, horrified and fascinated in equal measure. "It was using my curiosity as a door," he whispers. "That's... diabolical. And honestly? Brilliant."\n\nHe snaps the notebook shut. "Brilliant things can still be bad for me. I'll write that down. Somewhere else."`,
    on: [{ set: { cq_quillan_wise: true, cq_quillan_lore: true } }],
    choices: [back('Head back up into the clean night air.')],
  },
  cq_quillan2_snapped: {
    scene: 'glassworks',
    text: `"Don't TOUCH it!" Quillan's voice cracks like a whip. For one awful second, his face is someone else's: twisted, furious, a stranger wearing his skin.\n\nThen it's gone. He claps a hand over his mouth, eyes wide and wet.\n\n"I'm sorry. I'm so sorry. I've never... I don't shout. I don't even shout at pigeons." He shoves the shard away from himself with his foot. "That wasn't me. Was that me? It felt like me. That's the frightening part."\n\nHe follows you upstairs, very quiet, without being asked.`,
    on: [{ set: { cq_quillan_snapped: true } }],
    choices: [back('Get him away from the tunnel.')],
  },
  cq_quillan2_tempt: {
    scene: 'glassworks',
    text: `Quillan grins and speaks a single syllable.\n\nThe basement fills with red light. A wave of heat and fury slams outward, cracking jars, scattering glass, knocking you flat. For a heartbeat, you want very much to hit someone. Anyone.\n\nWhen it fades, Quillan is laughing. Delighted, breathless, a little too loud. "Did you feel that? Gods, did you feel it? That was one syllable!"\n\nThen he sees the cut on your arm and stops laughing. He stares at his own hands for a long time. "I wanted to say the next one," he whispers. "I still want to."`,
    on: [{ set: { cq_quillan_tempted: true } }, { damage: { who: 'party', dice: '1d4' } }],
    choices: [back('Drag him out of there.')],
  },

  // Beat 3: the inscription
  cq_quillan3: {
    scene: 'runewell', chapter: 'Quillan: The Inscription',
    text: (s) => `Before you leave for Thistletop, Quillan begs for one last trip into the catacombs. Beside the runewell, ${f(s, 'runewellDestroyed') ? 'dark and silent now,' : 'still humming with angry red light,'} is a wall you rushed past before: a complete inscription in the language of Wrath.\n\n"It's an invocation," Quillan says. "Whole. Unbroken. If I read it aloud, I could carry Alaznist's fury into Thistletop. I could protect all of us." He holds up a stick of chalk. His hand isn't quite steady.\n\n"Or I could become something Tamsin would have to pray over." He looks at you. "Help me choose. I don't trust myself."`,
    choices: [
      { t: '"Copy it for the scholars. Don\'t speak it. Knowledge, not obedience."', go: 'cq_quillan3_scholar', if: (s) => f(s, 'cq_quillan_wise') || f(s, 'cq_quillan_anchor') },
      { t: '"Curiosity is good. Hunger isn\'t. Which one is this?"', check: { skill: 'diplomacy', dc: 14, who: 'player', bonus: (s) => (f(s, 'cq_quillan_caution') ? 2 : 0) + (f(s, 'cq_quillan_wise') ? 2 : 0) - (f(s, 'cq_quillan_tempted') ? 2 : 0) }, pass: 'cq_quillan3_scholar', fail: 'cq_quillan3_doubt' },
      { t: 'Help him chisel out the key rune before it can whisper again.', check: { skill: 'disable', dc: 14, who: 'party' }, pass: 'cq_quillan3_smash', fail: 'cq_quillan3_backlash' },
      { t: '"Read it. We need every edge we can get."', go: 'cq_quillan3_rift' },
    ],
  },
  cq_quillan3_scholar: {
    scene: 'runewell',
    text: `Quillan nods slowly. Then he opens a fresh notebook and copies the inscription, but in a cipher of his own invention, so the words sit on the page dead and harmless. The key rune he leaves out entirely, and smudges on the wall with his thumb.\n\nThe whisper dies mid-sentence.\n\n"History should be read," he says softly, "not obeyed." He tucks the shard into the runewell's rubble and leaves it there. "Goodbye, little rock. You were fascinating, and I never want to see you again."\n\nHe turns to you, eyes clear and bright. "Thank you. For being my common sense. I seem to have misplaced mine."`,
    on: [{ set: { loyal_Quillan: true, cq_quillan_runeNotes: true } }],
    choices: [back('Climb back to the surface.')],
  },
  cq_quillan3_smash: {
    scene: 'runewell',
    text: `{who} sets the chisel at the heart of the key rune and strikes. Stone flakes away. The second strike cracks it clean through.\n\nSomething in the walls screams, very far away, and then there is silence. True silence, for the first time since the raid.\n\nQuillan sways. Then he laughs, a real laugh, light and silly. "Oh. Oh, it's quiet. I didn't realize how loud it had been." He presses his palm to the ruined rune. "Ten thousand years of history, and we vandalized it. My colleagues would faint."\n\nHe grins. "Worth it. Absolutely worth it."`,
    on: [{ set: { loyal_Quillan: true } }],
    choices: [back('Climb back to the surface.')],
  },
  cq_quillan3_backlash: {
    scene: 'runewell',
    text: `The chisel slips. The rune flares, and a lash of red force throws you both against the far wall.\n\nWhen your ears stop ringing, the rune is cracked, but not broken. The whisper is fainter, sulking. Quillan sits in the dust, rubbing his head.\n\n"Well. Half a victory." He squints at the rune. "It's still talking. Just with a lisp now." He gets up and, very deliberately, turns his back on it. "I'll just have to not listen. Elves are excellent at ignoring things. Ask any human."\n\nHe doesn't look entirely convinced.`,
    on: [{ set: { cq_quillan_shaken: true } }, { damage: { who: 'party', dice: '1d4' } }],
    choices: [back('Leave before it finds its voice again.')],
  },
  cq_quillan3_doubt: {
    scene: 'runewell',
    text: `Quillan opens his mouth to answer, closes it, opens it again. "I... don't know," he admits. "That's the problem, isn't it? I don't know."\n\nIn the end, he does nothing. He doesn't read it. He doesn't copy it. He doesn't break it. He just stands there until you take his arm and lead him away.\n\nAll the way up the tunnel, he keeps glancing back over his shoulder.\n\n"It'll still be there," he murmurs. "When this is over. It'll still be there." You can't tell if he sounds relieved or hungry.`,
    choices: [back('Climb back to the surface.')],
  },
  cq_quillan3_rift: {
    scene: 'runewell',
    text: `Quillan reads it.\n\nThe chamber goes red. Power pours into him like wine into a cracked cup, and for a moment he floats an inch off the floor, hair crackling, eyes burning. It's beautiful. It's terrible.\n\nThen it's over. He drops to his knees, gasping, and when he looks up at you, he's afraid. Not of the rune. Of how good it felt.\n\n"You told me to," he says quietly. "I asked you to be my common sense." He gets up without your help. He doesn't chatter all the way back to the surface. Quillan, silent. That's the worst sign of all.`,
    on: [{ set: { rift_Quillan: true, cq_quillan_wrathRead: true } }],
    choices: [back('Follow him up in silence.')],
  },

  // ================================================================ PIP
  // Beat 1: the debt
  cq_pip1: {
    scene: 'night', chapter: 'Pip: Old Friends',
    text: `Pip slipped away after the last goblin fell. You track him to an alley behind the Fatman's Feedbag, where a tall Varisian woman with three gold teeth has him pinned against a barrel with a very shiny knife.\n\n"Six years, little rat," she purrs. "You owe the Goldtooth family forty gold. And a certain locket."\n\n"Mirela!" Pip squeaks. "Light of my life! You look fantastic. Is that a new knife? It's lovely. Very pointy." Behind her, two broad Sczarni thugs crack their knuckles.\n\nPip spots you over her shoulder and mouths: help.`,
    choices: [
      { t: 'Talk her down. Nobody needs to bleed tonight.', check: { skill: 'diplomacy', dc: 14, who: 'player' }, pass: 'cq_pip1_talk', fail: 'cq_pip1_fight' },
      { t: '"The sheriff owes us a favor. Want to test how big?"', check: { skill: 'intimidate', dc: 15, who: 'player' }, pass: 'cq_pip1_scare', fail: 'cq_pip1_fight' },
      { t: 'Draw steel. Pip is with you.', go: 'cq_pip1_brawl' },
    ],
  },
  cq_pip1_talk: {
    scene: 'night',
    text: `You talk. About the raid, about the sheriff's patrols, about how a dead halfling pays exactly zero gold. Mirela listens with the patience of a cat watching a mousehole.\n\nFinally she lowers the knife. "Fine. The heroes of Sandpoint get a little grace." She taps Pip's nose with the blade's flat. "When you leave town for good, the locket comes to me. Or the Goldtooths take it out of your hide."\n\nShe saunters off. Pip sags against the barrel. "So! That's Mirela. We used to be... business associates." He won't say anything about the locket. He changes the subject four times on the walk home.`,
    on: [{ set: { cq_pip_time: true } }],
    choices: [back('Walk Pip home.')],
  },
  cq_pip1_scare: {
    scene: 'night',
    text: `You step into the lantern light and let Mirela take a good look at you. Goblin blood. Soot. The look of someone who has had a very long night and would love a reason to make it longer.\n\nMirela studies you, then laughs, a bright and dangerous sound. "Oh, I like this one, Pip. You always did make useful friends." She sheathes the knife. "We'll talk again before you leave town. About the locket."\n\nShe and her thugs melt into the dark. Pip lets out a whistle. "That," he says, "was the scariest and best thing I've seen all week. And I saw goblins on fire."`,
    on: [{ set: { cq_pip_time: true, cq_pip_bold: true } }],
    choices: [back('Head back to the inn.')],
  },
  cq_pip1_fight: { combat: 'sczarni', win: 'cq_pip1_after' },
  cq_pip1_brawl: { combat: 'sczarni', win: 'cq_pip1_after' },
  cq_pip1_after: {
    scene: 'night',
    text: `The thugs groan in a pile of broken crates. Mirela backs away, knife up, eyes glittering. "That was rude, little rat. The Goldtooths don't forget rude."\n\n"Neither do I!" Pip calls after her. "I'll send you a strongly worded letter! With pictures!"\n\nWhen she's gone, his bravado drains out like water from a cracked jug. He sits down hard on a crate. "Thanks," he says, not looking at you. "Nobody's ever... you know. Stood in front of me." Then, brightening: "Also, I took her coin purse. Small one. Call it interest."`,
    on: [{ set: { cq_pip_fought: true, cq_pip_time: true } }, { gold: 15 }],
    choices: [back('Help Pip home, laughing.')],
  },

  // Beat 2: the locket
  cq_pip2: {
    scene: 'inn', chapter: 'Pip: The Locket',
    text: `You find Pip on the roof of the Rusty Dragon, legs dangling over the edge, turning something silver in his fingers. A locket, old and dented, with a tiny painted portrait inside: a laughing woman holding a fat, scowling baby.\n\n"Acquired it when I was nine," Pip says. "Off a Sczarni cart. My first job for the Goldtooths. Then I sort of... didn't hand it in." He shrugs, too casually. "They've wanted it ever since. It must be worth a fortune."\n\nHe snaps it shut. "Funny thing. I don't even know whose it was. Before the cart, I mean."`,
    choices: [
      { t: 'Look closer at the locket.', check: { skill: 'perception', dc: 13, who: 'party' }, pass: 'cq_pip2_clue', fail: 'cq_pip2_noclue' },
      { t: 'Think about who in town might have lost it.', check: { skill: 'local', dc: 14, who: 'party' }, pass: 'cq_pip2_clue', fail: 'cq_pip2_noclue' },
      { t: '"Why\'d you keep it all these years, Pip?"', go: 'cq_pip2_heart' },
      { t: '"It\'s just a trinket. Hand it over and clear your debt."', go: 'cq_pip2_shrug' },
    ],
  },
  cq_pip2_clue: {
    scene: 'inn',
    text: `{who} tilts the locket into the lamplight. Inside the rim, tiny engraving: "Annick, my pearl. Your loving mother, C. Vesk."\n\nPip goes very still. "Vesk. Corinne Vesk. The fishwife on the docks. She sells smoked eel and yells at gulls." He swallows. "She had a daughter who... the sea took her. Years ago."\n\nHe stares at the scowling painted baby. "This isn't worth a fortune. It's worth everything. To one person." His voice cracks. "I've been carrying around somebody's whole heart and I thought it was just shiny."`,
    on: [{ set: { cq_pip_owner: true } }],
    choices: [back('Sit with him on the roof a while.')],
  },
  cq_pip2_noclue: {
    scene: 'inn',
    text: `You squint at the locket, but the lamplight is poor and the silver is scratched. If there was ever a name inside, years in a halfling's pocket have rubbed it away.\n\nPip shrugs and tucks it back into his vest. "Ah well. Mystery locket. Very romantic." He leans back on his elbows and looks at the stars.\n\n"I'll figure it out someday," he says. "Probably. Or I'll be buried with it and some grave robber will have a lovely surprise." He grins, but it doesn't quite reach his eyes.`,
    choices: [back('Climb back down.')],
  },
  cq_pip2_heart: {
    scene: 'inn',
    text: `Pip is quiet for so long you think he won't answer. Then, without a single joke:\n\n"Grew up in the Sczarni camps. Nobody's kid in particular. Everybody's errand boy." He opens the locket and looks at the painted pair. "That baby's scowling, right? But the mum's laughing anyway. Like it doesn't matter how grumpy the kid is. She's keeping him."\n\nHe snaps it shut. "Used to look at it when I couldn't sleep. Pretended..." He coughs. "Anyway! Sentimental nonsense. Don't tell anyone. I have a reputation as a heartless scoundrel."\n\nYou promise. He elbows you, hard and grateful.`,
    on: [{ set: { cq_pip_heart: true } }],
    choices: [
      { t: 'Ask to look at the locket more closely.', check: { skill: 'perception', dc: 13, who: 'party' }, pass: 'cq_pip2_clue', fail: 'cq_pip2_noclue' },
      back('Sit together and watch the harbor lights.'),
    ],
  },
  cq_pip2_shrug: {
    scene: 'inn',
    text: `"Right!" Pip laughs, a little too loudly. "Course. Just a trinket. Shiny bit of nothing."\n\nHe tucks it back into his vest, all the same. Not into a pocket. Into the little pouch over his heart.\n\n"Sensible advice. Very practical. You'd make a great Sczarni." He hops to his feet and does a cartwheel along the ridgeline that makes your stomach drop. "Right. Bedtime. Big day of not being stabbed tomorrow."\n\nHe climbs down without saying goodnight. You get the feeling you missed something important.`,
    on: [{ set: { cq_pip_cold: true } }],
    choices: [back('Stay on the roof a while, alone.')],
  },

  // Beat 3: coin or conscience
  cq_pip3: {
    scene: 'sandpoint', chapter: 'Pip: Coin or Conscience',
    text: (s) => `At the north gate, Mirela is waiting, leaning on a post with a fat purse in her hand and two thugs at her back.\n\n"Leaving town, little rat? Then it's time." She jingles the purse. "Give me the locket, and I'll forget the forty gold. Even add fifty on top. That's how much a certain collector in Magnimar wants it."${f(s, 'cq_pip_owner') ? '\n\nNot thirty paces away, old Corinne Vesk is setting out smoked eel at her stall, squabbling with a gull.' : ''}\n\nPip's hand drifts to the pouch over his heart. He looks at you.`,
    choices: [
      { t: '"Give it back to Corinne, Pip. Right now."', go: 'cq_pip3_return', if: (s) => f(s, 'cq_pip_owner') },
      { t: '"The locket isn\'t hers to buy. Tell her to walk."', go: 'cq_pip3_refuse', if: (s) => !f(s, 'cq_pip_owner') },
      { t: '"It\'s your call, Pip."', go: 'cq_pip3_choice' },
      { t: '"Take the deal. Fifty gold and a clean slate."', go: 'cq_pip3_sell' },
    ],
  },
  cq_pip3_return: {
    scene: 'sandpoint',
    text: `Pip takes a deep breath, walks straight past Mirela, and holds the locket out to Corinne Vesk.\n\nThe old woman stares at it. Opens it. Makes a sound you'll remember for the rest of your life, and then she is hugging Pip so hard his feet leave the ground. "My Annick. My pearl. Where did you... oh, you sweet little thief, you darling boy..."\n\nPip turns the color of a ripe tomato. "Mmf. Technically I'm an acquisitions expert. Mmf. Can't breathe."\n\nBehind you, Mirela's knife whispers out of its sheath. "That," she says, "was a fifty-gold mistake."`,
    on: [{ set: { cq_pip_returned: true } }],
    choices: [
      { t: '"The sheriff is right there. Want to explain this to him?"', check: { skill: 'bluff', dc: 15, who: 'player', bonus: (s) => (f(s, 'cq_pip_bold') ? 2 : 0) }, pass: 'cq_pip3_end', fail: 'cq_pip3_fight' },
      { t: 'Step between Mirela and your friend.', go: 'cq_pip3_fight' },
    ],
  },
  cq_pip3_refuse: {
    scene: 'sandpoint',
    text: (s) => `${f(s, 'cq_pip_ownCall') ? 'Pip squares his small shoulders and folds his arms.\n\n"You heard me. Not for sale.' : 'Pip blinks at you, then grins, slow and wide. He turns to Mirela and folds his arms.\n\n"You heard my friend. Not for sale.'} I'm leaving it with Sheriff Hemlock until we find whose it really is." He sniffs. "Should've done that years ago, honestly."\n\nMirela's smile doesn't move, but her eyes go flat as coins. "You've gone soft, little rat. Soft things get squashed."\n\nHer thugs step forward. The gate guard pointedly looks the other way.`,
    on: [{ set: { cq_pip_keptsafe: true } }],
    choices: [
      { t: '"Walk away, Mirela. Last offer."', check: { skill: 'intimidate', dc: 15, who: 'player', bonus: (s) => (f(s, 'cq_pip_bold') || f(s, 'cq_pip_fought') ? 2 : 0) }, pass: 'cq_pip3_end', fail: 'cq_pip3_fight' },
      { t: 'Ready your weapons beside Pip.', go: 'cq_pip3_fight' },
    ],
  },
  cq_pip3_choice: {
    scene: 'sandpoint',
    text: (s) => (f(s, 'cq_pip_heart') || f(s, 'cq_pip_owner')
      ? `Pip looks at you for a long moment. Then he looks at the purse. Then at the pouch over his heart.\n\n"My call," he repeats. "Huh. Nobody's ever let it be my call before."\n\nHe rolls his shoulders, and something in his face settles. It's the look of someone who has been carrying a question for a very long time and finally knows the answer.\n\n"Sorry, Mirela," he says, cheerful as sunrise. "I think I'd rather be the kind of rat my friends think I am."`
      : `Pip looks at the purse for a long moment. Then at you, waiting for you to say something. You don't.\n\n"My call," he says. "Right." He laughs, not very convincingly. "Well, a rat's a rat, isn't it?"\n\nHe pulls out the locket and holds it a moment too long before dropping it into Mirela's palm. She tosses him the purse and blows him a kiss. "Pleasure doing business, little rat."\n\nPip weighs the gold in his hand. It doesn't seem to make him any happier.`),
    choices: [
      { t: 'Watch Pip walk to Corinne\'s stall.', go: 'cq_pip3_return', if: (s) => f(s, 'cq_pip_owner') },
      { t: 'Stand with Pip as he refuses.', go: 'cq_pip3_refuse', set: { cq_pip_ownCall: true }, if: (s) => !f(s, 'cq_pip_owner') && f(s, 'cq_pip_heart') },
      { t: 'Follow Pip out of town.', go: 'cq_pip3_sold', if: (s) => !f(s, 'cq_pip_owner') && !f(s, 'cq_pip_heart') },
    ],
  },
  cq_pip3_sold: {
    scene: 'sandpoint',
    text: `Pip splits the gold with you without being asked, chattering the whole time about what he'll buy. Pies. A hat. Possibly a pony, if ponies come in halfling size.\n\nBut once, when he thinks nobody's looking, his hand goes to the empty pouch over his heart and stays there.\n\nIt was his call, and he made it. Maybe someday he'll wonder what would have happened if someone had told him he was worth more than a purse. For now, he just whistles a little too loudly as the gate falls behind you.`,
    on: [{ gold: 50 }, { set: { cq_pip_sold: true } }],
    choices: [back('Head north.')],
  },
  cq_pip3_sell: {
    scene: 'sandpoint',
    text: `Pip's face does something complicated. Then it smooths over, the way a pond does after you throw a stone in.\n\n"Course," he says brightly. "Fifty gold. Clean slate. Smart."\n\nHe hands Mirela the locket without looking at it. She tosses him the purse and saunters off, humming. Pip drops the gold into your hand, all of it.\n\n"Here. You negotiated." He walks ahead of you through the gate, whistling.\n\nHe'll still guard your back. He'll still crack jokes. But you notice he stops telling you things after that, and he never quite meets your eyes again.`,
    on: [{ gold: 50 }, { set: { rift_Pip: true, cq_pip_sold: true } }],
    choices: [back('Follow him north, gold heavy in your pocket.')],
  },
  cq_pip3_fight: { combat: 'sczarni', win: 'cq_pip3_end' },
  cq_pip3_end: {
    scene: 'sandpoint',
    text: (s) => `Mirela backs off, spitting curses in three languages. "Keep your trinket, then. The Goldtooths are done with you, little rat. Done!"\n\n"Promise?" Pip calls after her.\n\n${f(s, 'cq_pip_returned') ? 'Corinne Vesk presses a parcel of smoked eel into each of your hands, and a dusty healing draught she swears was her late husband\'s. She kisses Pip on both cheeks. He looks like he might melt.' : 'Pip marches the locket straight to Sheriff Hemlock, who promises to find its owner. A grateful watchman hands you a healing draught for your trouble.'}\n\nOn the road north, Pip falls into step beside you. "You didn't make me sell it," he says quietly. "Nobody's ever bet on me before." He sniffs. "Don't make it weird."`,
    on: [{ set: { loyal_Pip: true } }, { potions: 1 }],
    choices: [back('Don\'t make it weird. Head north together.')],
  },
};

// ------------------------------------------------------------------ hooks
const arc = (name, beat, ret, label) => {
  const id = `cq_${name.toLowerCase()}${beat}`;
  const prev = beat > 1 ? `cq_${name.toLowerCase()}${beat - 1}_done` : null;
  return {
    t: label, go: id, ret,
    if: (s) => inParty(name)(s) && !s.flags[`${id}_done`] && (!prev || !!s.flags[prev]),
    set: { [`${id}_done`]: true },
  };
};

export const HOOKS = {
  raid_end: [
    arc('Brannoc', 1, 'raid_end', 'Find Brannoc. He slipped off toward the old garrison.'),
    arc('Tamsin', 1, 'raid_end', 'Help Tamsin with the wounded at the cathedral.'),
    arc('Quillan', 1, 'raid_end', 'See what Quillan is poking at by lantern light.'),
    arc('Pip', 1, 'raid_end', 'Track down Pip. He vanished into an alley.'),
  ],
  evening: [
    arc('Brannoc', 2, 'evening', 'Walk with Brannoc to the Hagfish tavern.'),
    arc('Tamsin', 2, 'evening', 'Sit with Tamsin on the cathedral steps.'),
    arc('Quillan', 2, 'evening', 'Look for Quillan. His bed is empty.'),
    arc('Pip', 2, 'evening', 'Join Pip on the roof of the Rusty Dragon.'),
  ],
  hemlock: [
    arc('Brannoc', 3, 'hemlock', 'Talk to Brannoc at the north gate before you leave.'),
    arc('Tamsin', 3, 'hemlock', 'Tamsin wants a word before you leave.'),
    arc('Quillan', 3, 'hemlock', 'Go with Quillan to the catacomb inscription one last time.'),
    arc('Pip', 3, 'hemlock', 'Settle Pip\'s debt with Mirela at the gate.'),
  ],
};

// ------------------------------------------------------------------ banter
export const SCENES = {
  cq_brannoc1: [
    { who: 'tank', text: 'Go on back. I\'ll be along.' },
    { who: 'hero', text: H('I\'m not leaving you here alone.', 'Nope! I\'m staying. I\'m very stubborn.', 'I\'ll stay.', 'And miss you being mysterious? No chance.') },
    { who: 'tank', text: '...Suit yourself.' },
  ],
  cq_brannoc2: [
    { who: 'tank', text: 'Hate this place. Smells like regret and herring.' },
    { who: 'hero', text: H('Whatever he says, we hear it together.', 'Ooh, mystery tavern! I love a mystery tavern!', 'Stay close.', 'Charming. I\'ll try not to touch anything.') },
  ],
  cq_brannoc3_forgive: [
    { who: 'healer', text: 'Brannoc... are you smiling?' },
    { who: 'tank', text: 'No.' },
    { who: 'skirm', text: 'He is! I saw teeth! Someone fetch a painter!' },
  ],
  cq_tamsin1: [
    { who: 'healer', text: 'I don\'t understand. The light should work. It always works.' },
    { who: 'hero', text: H('We\'ll figure this out together, Tamsin.', 'Hey, you\'ve got us! We\'re very good at figuring things out. Sometimes.', 'Let me look.', 'Maybe the problem isn\'t the light.') },
  ],
  cq_tamsin2: [
    { who: 'healer', text: 'Everyone wanted Nualia to be a miracle. Nobody wanted her to be a girl.' },
    { who: 'hero', text: H('Then we remember the difference.', 'You\'d never treat anyone like that, Tamsin.', 'Towns do that.', 'People are the worst. Present company mostly excepted.') },
  ],
  cq_tamsin3_mercy: [
    { who: 'healer', text: 'Mercy first. Then steel. Together.' },
    { who: 'tank', text: 'I\'ll handle the steel part.' },
    { who: 'healer', text: 'I know you will, Brannoc. That\'s what worries me.' },
  ],
  cq_quillan1: [
    { who: 'arcane', text: 'Look at the stroke order! The serifs! The ARCHAIC DIACRITICS!' },
    { who: 'hero', text: H('Careful with that, Quillan.', 'Ooh, show me the diacritics!', 'It\'s a rock.', 'Please never say "archaic diacritics" to me again.') },
    { who: 'arcane', text: 'It\'s not a rock. Well. It is a rock. But it\'s a rock with OPINIONS.' },
  ],
  cq_quillan2: [
    { who: 'arcane', text: 'Shh. Shh. It\'s almost done conjugating.' },
    { who: 'hero', text: H('Quillan, look at me. Come back.', 'Uh, Quillan? Your eyes are doing a scary thing.', 'Quillan. Up. Now.', 'Great. The wizard is talking to the darkness. Love that.') },
  ],
  cq_quillan3_scholar: [
    { who: 'arcane', text: 'Do you know, I think that\'s the first time I\'ve walked away from a book unfinished.' },
    { who: 'healer', text: 'I\'m proud of you, Quillan.' },
    { who: 'arcane', text: 'Please don\'t be. I\'ll cry, and elves cry for centuries.' },
  ],
  cq_pip1: [
    { who: 'skirm', text: 'Funny story! This lovely lady and I go way back!' },
    { who: 'hero', text: H('Let him go. Now.', 'Hi! We\'re Pip\'s friends! Please don\'t stab him!', 'Knife down.', 'Pip. What did you steal this time?') },
    { who: 'skirm', text: 'Nothing! Recently.' },
  ],
  cq_pip2: [
    { who: 'skirm', text: 'Nice view up here. You can see every unlocked window in town.' },
    { who: 'hero', text: H('That\'s not why you come up here, is it?', 'Ooh, it\'s so pretty! Wait, what\'s that you\'re holding?', 'What\'s that?', 'Of course that\'s what you notice.') },
  ],
  cq_pip3_end: [
    { who: 'skirm', text: 'I just did a good deed. In public. My reputation is ruined.' },
    { who: 'tank', text: 'You never had one.' },
    { who: 'skirm', text: 'Rude. Accurate, but rude.' },
  ],
};

// ------------------------------------------------------------------ campfire
export const CAMP = [
  { if: (s) => f(s, 'loyal_Brannoc'), lines: [
    { who: 'tank', text: 'Hollis would\'ve liked you lot.' },
    { who: 'skirm', text: 'Even me?' },
    { who: 'tank', text: 'Especially you. He was an idiot too.' },
    { who: 'skirm', text: 'I\'m choosing to hear that as a compliment.' },
  ] },
  { if: (s) => f(s, 'loyal_Brannoc'), lines: [
    { who: 'hero', text: H('You seem lighter lately, Brannoc.', 'Brannoc! You hummed! I heard it!', 'You\'re sleeping better.', 'Careful. You almost looked happy just now.') },
    { who: 'tank', text: 'Hmph.' },
    { who: 'tank', text: '...Hollis used to hum that one. Fried eel song. Terrible.' },
  ] },
  { if: (s) => f(s, 'rift_Brannoc'), lines: [
    { who: 'healer', text: 'Brannoc, you haven\'t said a word all night.' },
    { who: 'tank', text: 'Nothing to say. I\'m the sword.' },
    { who: 'healer', text: 'You\'re a person, Brannoc. Whoever told you otherwise was wrong.' },
  ] },
  { if: (s) => f(s, 'loyal_Tamsin'), lines: [
    { who: 'healer', text: 'Wren wrote to me! Well. Drew. It\'s a cat. I think it\'s a cat.' },
    { who: 'arcane', text: 'It has six legs.' },
    { who: 'healer', text: 'Then it\'s a very fast cat, Quillan.' },
  ] },
  { if: (s) => f(s, 'cq_tamsin_shaken') && !f(s, 'loyal_Tamsin'), lines: [
    { who: 'healer', text: 'Do you think the Dawnflower is ever disappointed in us?' },
    { who: 'hero', text: H('Never in you, Tamsin.', 'Nope! You\'re her favorite. Obviously.', 'Maybe. She keeps showing up anyway.', 'If she is, I\'m first in line, not you.') },
    { who: 'healer', text: '...Thank you. I needed someone to say it.' },
  ] },
  { if: (s) => f(s, 'loyal_Quillan'), lines: [
    { who: 'arcane', text: 'I\'ve started a new treatise. "Runes I Have Bravely Not Read."' },
    { who: 'skirm', text: 'Short book?' },
    { who: 'arcane', text: 'Surprisingly long, actually. Thassilon was very chatty.' },
  ] },
  { if: (s) => f(s, 'cq_quillan_tempted') || f(s, 'rift_Quillan'), lines: [
    { who: 'arcane', text: 'Sometimes I still hear it. The grammar. When it\'s very quiet.' },
    { who: 'healer', text: 'Then we\'ll keep it noisy, Quillan. Tell us about soup runes.' },
    { who: 'arcane', text: '...There are actually three soup runes. Shall I begin?' },
  ] },
  { if: (s) => f(s, 'loyal_Pip'), lines: [
    { who: 'skirm', text: 'So I\'ve decided to go straight. Mostly straight. Straight-ish.' },
    { who: 'tank', text: 'Then give back my coin purse.' },
    { who: 'skirm', text: 'Baby steps, Brannoc. Baby steps.' },
  ] },
  { if: (s) => f(s, 'cq_pip_returned'), lines: [
    { who: 'hero', text: H('Corinne won\'t stop telling everyone about you, Pip.', 'Pip! Corinne called you a darling boy! In public!', 'You did good, Pip.', 'A halfling hero. Never thought I\'d see the day.') },
    { who: 'skirm', text: 'Please stop. My heartless scoundrel image can only take so much.' },
  ] },
  { if: (s) => f(s, 'rift_Pip'), lines: [
    { who: 'skirm', text: 'Fifty gold buys a lot of pie.' },
    { who: 'hero', text: H('Does it buy anything you actually want, Pip?', 'Hey. You okay over there?', 'You don\'t sound happy.', 'You\'ve said that four times tonight.') },
    { who: 'skirm', text: '...Not as much pie as you\'d think.' },
  ] },
];

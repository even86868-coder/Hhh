// Story expansion: Thistletop side paths for Chapter 1 ("Burnt Offerings").
// Nettlewood detours (a snared goblin scout, a hermit), the sea caves under the island,
// goblin politics in the prison pit, Lyrie's study, and the sealed vault beneath the shrine.
// Contract: NODES (story nodes), HOOKS (hostNodeId -> extra choices), SCENES (banter by node id), CAMP (campfire talks).

const has = (f) => (s) => !!s.flags[f];
const not = (f) => (s) => !s.flags[f];
const H = (heroic, cheerful, grim, snarky) => ({ heroic, cheerful, grim, snarky });

export const NODES = {
  // ------------------------------------------------------------ Nettlewood: the snared scout
  tt_scout: {
    scene: 'nettlewood',
    on: [{ set: { tt_scoutMet: true } }],
    text: `A thin, furious squeal leads you to a bramble clearing. Hanging upside down from a snare is a very small goblin with very large ears, slowly spinning. It is, you realize, caught in its own trap.\n\n"NO EAT NIBSY!" it wails. "Nibsy is stringy! Nibsy is mostly ears! Nibsy only came out here to pee, and the rope was ANGRY!"\n\nIts tiny dagger lies in the dirt below. {skirm} has already picked it up and is admiring the rust.`,
    choices: [
      { t: 'Cut the rope and set Nibsy free.', go: 'tt_scout_spare' },
      { t: 'Spin him a little. "Talk first. What\'s waiting at Thistletop?"', check: { skill: 'intimidate', dc: 13, who: 'player' }, pass: 'tt_scout_talk', fail: 'tt_scout_bolt' },
      { t: 'Leave him hanging. Someone will come for him eventually.', go: 'nettlewood' },
    ],
  },
  tt_scout_spare: {
    scene: 'nettlewood',
    on: [{ set: { tt_goblinFriend: true } }],
    text: `The rope parts and Nibsy lands on his head with a thump. He scrambles up, checks that both ears are still attached, and stares at you as if you had grown a second face.\n\n"Longshank... let Nibsy GO?" His lip trembles. "Nobody ever let Nibsy go. Not even Mama." He licks his palm and slaps it against his own forehead. "Goblin oath! On Nibsy's favorite ear! Nibsy owes you one big help."\n\n{healer} gently dabs a scratch on his knee. He hisses, then purrs.`,
    choices: [
      { t: '"Then help us now. Know a safe way to the coast?"', go: 'tt_scout_path' },
      { t: '"Go home, Nibsy. And stay out of trouble."', go: 'nettlewood' },
    ],
  },
  tt_scout_talk: {
    scene: 'nettlewood',
    on: [{ set: { tt_cavesKnown: true } }],
    text: `Three slow spins later, Nibsy is very talkative. "Big bridge! Archers! Stinky bugbear with a bow in the tower! Chief Ripnugget on a wagon throne! Pretty scary Mistress down in the old stones!" He gulps. "And caves! Under the island, where the water goes in and out. Smugglers leave boxes there. Nibsy is not allowed. Snappy things live there."\n\nHe dangles miserably. "Nibsy told everything. Please?"\n\n{tank} raises an eyebrow at you, waiting.`,
    choices: [
      { t: 'Cut him down. A deal is a deal.', go: 'tt_scout_spare' },
      { t: 'Tie him up properly so he can\'t warn anyone.', go: 'nettlewood', set: { tt_scoutTied: true } },
    ],
  },
  tt_scout_bolt: {
    scene: 'nettlewood',
    on: [{ damage: { who: 'player', dice: '1d3' } }, { set: { tt_scoutFled: true } }],
    text: `You give the rope a menacing twirl. Nibsy, it turns out, is excellent at twirling. He swings around, sinks his needle teeth into your thumb, and wriggles out of the snare like a greased eel.\n\n"HELP! HELP! LONGSHANKS IN THE BRAMBLES! THEY TRIED TO SPIN NIBSY!"\n\nHe vanishes into the thorns, still shrieking. From every direction, the bushes begin to rustle and giggle.`,
    choices: [{ t: 'Weapons out. Here they come.', go: 'nettle_ambush' }],
  },
  tt_scout_path: {
    scene: 'nettlewood',
    on: [{ set: { tt_cavesKnown: true } }],
    text: `Nibsy leads you through a "goblin road," which is mostly a tunnel through thorns sized for goblins. You crawl, scrape, and mutter. {tank} leaves a good deal of dignity in the brambles.\n\nBut no patrols find you. At last the thorns open onto salt wind and a sea cliff. Nibsy points down at the churning surf. "Caves under the island. Smugglers' door. Snappy things inside, so... good luck!"\n\nHe salutes with the wrong hand and is gone.`,
    choices: [{ t: 'Look out at Thistletop.', go: 'thistletop' }],
  },

  // ------------------------------------------------------------ Nettlewood: the hermit
  tt_hermit: {
    scene: 'forest',
    on: [{ set: { tt_hermitMet: true } }],
    text: `Off the path, the thorns give way to a mossy hollow and a crooked shack. Wind chimes of shells and tiny bones clink from every branch. On the porch, an ancient gnome in a hat full of feathers is rocking in a chair and glaring at you.\n\n"Visitors," she says, as though naming a disease. "I am Granny Ogwen. The goblins broke my fence again, my kettle is cold, and you are standing on my mushrooms."\n\nYou step off the mushrooms. A one-eyed crow on her shoulder laughs at you.`,
    choices: [
      { t: 'Apologize nicely and offer to share your trail rations.', check: { skill: 'diplomacy', dc: 14, who: 'player' }, pass: 'tt_hermit_tea', fail: 'tt_hermit_rude' },
      { t: 'Offer to fix the broken fence.', check: { skill: 'str', dc: 13, who: 'party' }, pass: 'tt_hermit_fence', fail: 'tt_hermit_splinter' },
      { t: 'Back away politely. Thistletop awaits.', go: 'nettlewood' },
    ],
  },
  tt_hermit_fence: {
    scene: 'forest',
    text: `{who} heaves the fallen posts upright while the rest of you lash them with vine. In a quarter hour the fence stands straighter than it has in years. Granny Ogwen inspects it, kicks a post, and grunts. The post does not fall. This seems to be the highest praise she gives.\n\n"Hmph. Fine. Useful visitors are a different thing. Come in. I'll put the kettle on."\n\nThe crow hops onto {arcane}'s head and refuses to leave.`,
    choices: [{ t: 'Join her for tea.', go: 'tt_hermit_tea' }],
  },
  tt_hermit_splinter: {
    scene: 'forest',
    on: [{ damage: { who: 'party', dice: '1d3' } }],
    text: `The first post falls on {tank}'s foot. The second falls on everyone else. By the time the fence is standing, all of you have splinters in places splinters should not go, and the crow has laughed itself hoarse.\n\nStill, the fence stands. Granny Ogwen sighs the sigh of a woman who has seen many fools. "Well. You tried. That's more than the goblins do. Come in before you hurt yourselves again."`,
    choices: [{ t: 'Limp inside for tea.', go: 'tt_hermit_tea' }],
  },
  tt_hermit_rude: {
    scene: 'forest',
    on: [{ gold: 10 }],
    text: `You offer her a strip of dried fish. Granny Ogwen looks at it for a long moment. "Fish," she says. "To a woman who lives by the SEA." She seizes a broom.\n\nYou retreat at speed, with the broom whacking whoever is slowest. That is {arcane}. As you flee, the crow swoops past and drops something into your hood: a little pouch of coins, stolen from somebody else entirely.\n\nIt caws once, smugly. You think it likes you.`,
    choices: [{ t: 'Get back to the path before she finds a bigger broom.', go: 'nettlewood' }],
  },
  tt_hermit_tea: {
    scene: 'forest',
    on: [{ set: { tt_hermitWarning: true } }, { potions: 1 }],
    text: `The tea tastes like moss and honey and something warm underneath. Granny Ogwen watches you drink it. "Thistletop," she says. "Goblins, a pretty madwoman, fine. But listen. Under that island sleeps something older than all of them. A dog that is not a dog. My granny's granny heard it howl."\n\nShe presses a little stoppered bottle into your palm. "If you find a door with a star on it, don't you open it. Seal it, or walk away. Promise me."\n\nThe crow nods very seriously.`,
    choices: [{ t: '"We promise." Thank her and go.', go: 'nettlewood' }],
  },

  // ------------------------------------------------------------ The sea caves
  tt_caves_find: {
    scene: 'thistletop',
    text: `A goat track zigzags down the cliff to a strip of black shingle. The tide is out, and beneath the island's skirt of rock a cave mouth yawns, dripping with weed. The air inside smells of salt, tar, and old fish.\n\nBetween you and the opening lies a jumble of slick, barnacled boulders, and a channel of cold water swirling knee-deep and rising. {skirm} is already eyeing the rocks. {tank} is already rolling up a pair of trouser legs.`,
    choices: [
      { t: 'Wade straight through the icy channel.', check: { skill: 'con', dc: 14, who: 'party' }, pass: 'tt_caves_inner', fail: 'tt_caves_cold' },
      { t: 'Hop across the barnacled boulders.', check: { skill: 'acrobatics', dc: 15, who: 'player' }, pass: 'tt_caves_inner', fail: 'tt_caves_slip' },
    ],
  },
  tt_caves_tide: {
    scene: 'thistletop',
    on: [{ damage: { who: 'party', dice: '1d3' } }],
    text: `You scramble down the cliff, picking between crags, but the caves seem to move every time you look. Then a swell larger than the rest comes thundering in and slaps all four of you flat against the rock.\n\nBy the time you have coughed out the seawater, the tide is rising fast and the cave mouths are vanishing underwater. Whatever way in there was, it's gone until tomorrow. {healer} wrings out a soggy sleeve, glaring at the sea as if it owes everyone an apology.`,
    choices: [{ t: 'Squelch back up to the clifftop.', go: 'thistletop' }],
  },
  tt_caves_cold: {
    scene: 'catacombs',
    on: [{ damage: { who: 'party', dice: '1d4' } }],
    text: `The water is cold enough to make your teeth chatter in rhythm. Halfway across, the current shoves {who} sideways and everyone grabs everyone, and then you are all in it up to your chins, gasping and swearing.\n\nYou crawl out on the far side, numb to the bone and leaving a trail of puddles. At least nobody drowned. {arcane} announces a total loss of feeling in both feet and would like that noted for the record.`,
    choices: [{ t: 'Shiver onward into the dark.', go: 'tt_caves_inner' }],
  },
  tt_caves_slip: {
    scene: 'catacombs',
    on: [{ damage: { who: 'player', dice: '1d6' } }],
    text: `Rock one: perfect. Rock two: graceful. Rock three: covered in a seaweed so slippery it might as well be butter. Your feet go up, the rest of you goes down, and you slide headfirst into the channel with a magnificent splash.\n\nYou surface spluttering, a crab clinging to your ear. The others pick their way over the rocks you so helpfully tested. "Ten out of ten for style," says {skirm}, offering a hand.`,
    choices: [{ t: 'Shake off the crab and press on.', go: 'tt_caves_inner' }],
  },
  tt_caves_inner: {
    scene: 'catacombs',
    on: [{ set: { tt_caves: true } }],
    text: `The cave opens into a high grotto lit by greenish light filtering through the water. Crates and barrels are stacked on a ledge, stamped with Magnimar trade marks. Smugglers' goods.\n\nA goblin sits on the biggest crate, snoring, a harpoon across his knees. Around the tide pools, something clicks. Two shapes the size of ponies shift under the weed: lobster-like, with claws that could snip a person in half.\n\n{tank} mouths one word: "Reefclaws."`,
    choices: [
      { t: 'Creep close and strike before they wake.', check: { skill: 'stealth', dc: 15, who: 'party' }, pass: 'tt_caves_sneak', fail: 'tt_caves_noticed' },
      { t: 'Charge! Better than waiting for the claws.', go: 'tt_caves_fight' },
    ],
  },
  tt_caves_sneak: {
    scene: 'catacombs',
    text: `You move like shadows across the wet stone, placing every foot where the drips will cover the sound. {who} gets so close to the sleeping goblin that you can count his nose hairs. One of the reefclaws flexes a claw, dreaming crustacean dreams.\n\nEveryone is in position. Weapons are raised. The goblin smacks his lips and murmurs, "Five more minutes, Mama."\n\nNot today.`,
    choices: [{ t: 'Strike!', go: 'tt_caves_fight_surprise' }],
  },
  tt_caves_noticed: {
    scene: 'catacombs',
    text: `A loose pebble clatters down the rocks, bouncing all the way into the tide pool with a sound like a dinner bell. The goblin snorts awake and falls off his crate. The reefclaws rise out of the weed, claws clacking like a mad drummer.\n\n"INTRUDERS!" the goblin shrieks, scrambling for his harpoon. "Snappies! SNAP THEM!"\n\nSo much for subtle.`,
    choices: [{ t: 'Fight!', go: 'tt_caves_fight' }],
  },
  tt_caves_fight: { combat: 'seacaves', win: 'tt_caves_loot' },
  tt_caves_fight_surprise: { combat: 'seacaves', surprise: 'party', win: 'tt_caves_loot' },
  tt_caves_loot: {
    scene: 'catacombs',
    on: [{ potions: 2 }, { gold: 60 }],
    text: `The last claw stops twitching. In the sudden quiet you hear only the drip of water and the wheeze of everyone catching their breath.\n\nThe crates hold stolen Sandpoint goods: lamp oil, bolts of cloth, wheels of cheese, and a box of healing potions packed in straw. A purse of silver rests in the goblin's pocket, which {skirm} has already emptied with professional speed.\n\nBut the stacking looks odd, as if someone hid something behind it.`,
    choices: [
      { t: 'Search behind the crates.', check: { skill: 'perception', dc: 16, who: 'party' }, pass: 'tt_caves_cache', fail: 'tt_caves_stair' },
      { t: 'No time. Find the way up.', go: 'tt_caves_stair' },
    ],
  },
  tt_caves_cache: {
    scene: 'catacombs',
    on: [{ gear: { key: 'resistance', val: 1 } }, { set: { tt_cache: true } }],
    text: `{who} wriggles behind the crates and finds a niche in the rock, sealed with an oilskin flap. Inside lies a bundle of cloaks, each one stitched with tiny silver knots along the hem. They hum faintly when you touch them.\n\n{arcane} gasps. "Warding stitches! These are cloaks of resistance, a whole set! Somebody in Magnimar is going to be very upset." He considers. "Somebody who traffics with goblins. So, good."\n\nThey fit surprisingly well.`,
    choices: [{ t: 'Wear them proudly and find the way up.', go: 'tt_caves_stair' }],
  },
  tt_caves_stair: {
    scene: 'catacombs',
    text: `At the back of the grotto, an ancient stair spirals up into the rock. The steps are worn smooth and far too wide for goblin feet, carved with angular runes. Thassilonian, like the catacombs under Sandpoint. The goblins only borrowed this place.\n\nThe stair climbs and climbs, then ends at a wooden trapdoor. Above it you hear muffled yips, scratching claws, and a goblin singing badly about cheese.\n\n{tank} braces against the wood. "On three."`,
    choices: [
      { t: 'Push through carefully and quietly.', check: { skill: 'stealth', dc: 14, who: 'player' }, pass: 'tt_caves_emerge', fail: 'tt_caves_kennel' },
      { t: '"Three!" Burst through all at once.', go: 'tt_caves_kennel' },
    ],
  },
  tt_caves_kennel: {
    scene: 'fort',
    on: [{ damage: { who: 'party', dice: '1d4' } }],
    text: `The trapdoor flies open into a goblin dog kennel. A dozen mangy dogs leap up at once, and for a few frantic seconds there is nothing but teeth, fur, and terrible smells.\n\nYou kick them back, slam the gate, and stagger out of the kennel. The singing goblin stares at you, drops his cheese, and runs away screaming. The dogs howl. Somewhere above, a deep voice laughs. The whole fort knows you're here.`,
    choices: [{ t: 'Into the courtyard, then.', go: 'courtyard' }],
  },
  tt_caves_emerge: {
    scene: 'fort',
    text: (s) => `You ease the trapdoor up an inch at a time. It opens beneath a heap of dog blankets inside the kennels, and the goblin dogs, bless their tiny brains, are all asleep in a pile. The singing goblin has wandered off.\n\nYou slip out into the shadow of the palisade, inside Thistletop and unseen.${s.flags.tt_goblinFriend ? '\n\nScratched into the kennel post at goblin height is a little drawing of a big-eared goblin and an arrow. Nibsy\'s secret route to the chief\'s back door.' : ''}`,
    choices: [
      { t: 'Follow Nibsy\'s marks past the tower.', if: has('tt_goblinFriend'), check: { skill: 'stealth', dc: 14, who: 'party' }, pass: 'tt_caves_backdoor', fail: 'bruthazmus_ambush' },
      { t: 'Creep into the courtyard.', go: 'courtyard' },
    ],
  },
  tt_caves_backdoor: {
    scene: 'fort',
    on: [{ set: { tt_skippedBruthazmus: true } }],
    text: `Nibsy's arrows lead you along the palisade, under a cart, and through a gap no one has bothered to fix. High in the watchtower, a huge bugbear is snoring with his bow across his chest, a half-eaten ham on his belly.\n\n{skirm} briefly considers stealing the ham. {healer} firmly vetoes the ham. You tiptoe past and reach a door that is propped open with a goblin skull. Beyond it: shouting, cackling, and a squeaky voice proclaiming its own greatness.`,
    choices: [{ t: 'Step into the throne room.', go: 'throne' }],
  },

  // ------------------------------------------------------------ Goblin politics in the pit
  tt_pit: {
    scene: 'fort',
    on: [{ set: { tt_pitDone: true } }],
    text: `Behind a curtain of dog hides, a pit is dug into the floor and covered by a rusty grate. A dozen grubby faces peer up from the darkness. Goblins who displeased Ripnugget.\n\n"Longshanks! Longshanks killed the chief!" They don't sound sad about it.\n\nOne goblin pushes to the front, standing on another's head. He has notched ears, a pot for a helmet, and the swagger of someone who has practiced this speech. "Chuffwhistle the Clever greets you! Chuffwhistle should be chief now. Let's talk."`,
    choices: [
      { t: 'Hear Chuffwhistle out.', go: 'tt_pit_chuff' },
      { t: 'Toss down some rations first. They look starving.', go: 'tt_pit_feed' },
      { t: 'Leave the pit alone.', go: '__return' },
    ],
  },
  tt_pit_feed: {
    scene: 'fort',
    on: [{ set: { tt_pitFed: true } }],
    text: `You drop down a wheel of stolen cheese. The pit erupts. There is biting, there is cheering, and there is one goblin who simply lies on the cheese and refuses to move.\n\n{healer} spots a skinny goblin coughing in a corner and lowers a cup of water on a string. Twelve pairs of eyes stare upward with something like wonder.\n\nChuffwhistle clambers back to the front, cheese in his teeth. "Longshanks GENEROUS. Chuff likes generous. Now, about the chief thing..."`,
    choices: [
      { t: 'Hear Chuffwhistle out.', go: 'tt_pit_chuff' },
      { t: 'Wish them luck and go.', go: '__return' },
    ],
  },
  tt_pit_chuff: {
    scene: 'fort',
    text: `"Ripnugget dead. Mistress mad. Goblins need a chief who is CLEVER." Chuffwhistle taps his pot. "Chuff can count to eleven! Chuff can read three letters! Let Chuff out, Chuff becomes chief, and Thistletop goblins stop burning longshank towns." He reconsiders. "Mostly. Small fires only. Little cozy fires."\n\nThe other goblins nod, apparently impressed by eleven.\n\n{arcane} whispers, "A peace treaty with goblins. That's never been done! Has it? I'd have to check."`,
    choices: [
      { t: 'Study his face. Is he serious?', if: not('tt_chuffRead'), check: { skill: 'sense', dc: 14, who: 'party' }, pass: 'tt_pit_truth', fail: 'tt_pit_chuff_shrug' },
      { t: '"Deal. But no fires. Not even cozy ones."', check: { skill: 'diplomacy', dc: 16, who: 'player', bonus: (s) => (s.flags.goblinKing ? 4 : 0) + (s.flags.tt_goblinFriend ? 2 : 0) + (s.flags.tt_pitFed ? 2 : 0) + (s.flags.tt_chuffRead ? 2 : 0) }, pass: 'tt_pit_deal', fail: 'tt_pit_haggle' },
      { t: '"I know a better chief. Nibsy!"', if: (s) => !!s.flags.tt_goblinFriend && !s.flags.tt_scoutTied, go: 'tt_pit_nibsy' },
      { t: '"No deals with goblins."', go: 'tt_pit_refuse' },
    ],
  },
  tt_pit_chuff_shrug: {
    scene: 'fort',
    on: [{ set: { tt_chuffRead: true } }],
    text: `You stare into Chuffwhistle's eyes. He stares back. He crosses them. You lose the staring contest and learn nothing, except that goblins can rotate their eyes in different directions, which you will now see in your dreams.\n\n{tank} grunts. "Goblin's a goblin. Question is whether he's a useful one."\n\nChuffwhistle beams up at you, entirely unbothered.`,
    choices: [{ t: 'Back to the negotiation.', go: 'tt_pit_chuff' }],
  },
  tt_pit_truth: {
    scene: 'fort',
    on: [{ set: { tt_chuffRead: true } }],
    text: `Behind the swagger, you see it: he's terrified. Not of you. Of what lives beneath the fort. He keeps glancing at the trapdoor.\n\n"Mistress sings to the big dog under the stones," he whispers. "Every night. Goblins hear it growl back. Ripnugget said 'good, scary dog, very nice.' Chuff says NO. Chuff wants goblins far away from that dog." His ears droop. "Chuff threw Ripnugget's crown in the sea once. That's why the pit."\n\nYou believe him.`,
    choices: [{ t: 'Back to the negotiation.', go: 'tt_pit_chuff' }],
  },
  tt_pit_haggle: {
    scene: 'fort',
    text: `Chuffwhistle folds his arms. "No fires AT ALL? What do goblins do on birthdays?" The pit mutters. Negotiations, it seems, have stalled over the matter of birthday candles.\n\n"Chuff needs something to show the tribe. Something shiny! Something chiefly!" His eyes slide toward the throne room, where Ripnugget's crown lies in the junk.\n\n{skirm} looks pained, as if being asked to give away a very nice crown is a personal insult.`,
    choices: [
      { t: 'Fetch him Ripnugget\'s crown.', go: 'tt_pit_deal', set: { tt_crownGiven: true } },
      { t: 'Lead the pit in a rousing goblin song instead.', check: { skill: 'cha', dc: 13, who: 'player' }, pass: 'tt_pit_deal', fail: 'tt_pit_refuse' },
      { t: '"Forget it."', go: 'tt_pit_refuse' },
    ],
  },
  tt_pit_deal: {
    scene: 'fort',
    on: [{ set: { tt_goblinChief: true, tt_vaultKnown: true } }],
    text: (s) => `You lower a rope. Chuffwhistle climbs out with tremendous dignity, then trips over the grate. ${s.flags.tt_crownGiven ? 'He jams Ripnugget\'s crown over his pot and nearly topples from the weight.' : 'He polishes his pot until it almost shines.'} The pit goblins pour out after him, chanting "CHUFF! CHUFF! CHUFF!"\n\n"Chief Chuffwhistle the Clever swears: no burning longshank towns, no stealing longshank babies, no singing to the big dog." He lowers his voice. "Door under the Mistress's shrine. Star on it. Don't open. Chuff's first wise decree."`,
    choices: [{ t: 'Shake his tiny, sticky hand.', go: '__return' }],
  },
  tt_pit_nibsy: {
    scene: 'fort',
    on: [{ set: { tt_goblinChief: true, tt_nibsyChief: true, tt_vaultKnown: true } }],
    text: `As if summoned, a familiar pair of enormous ears pokes around the curtain. "Longshank called?" Nibsy has been following you the whole way, of course.\n\nThe pit goes silent. "Nibsy? Nibsy who peed on the chief's dog?" "Nibsy who befriended the longshanks?" "...Nibsy who has FRIENDS?" That last one settles it. "NIBSY! NIBSY! NIBSY!"\n\nChuffwhistle sulks, then accepts the title of Royal Counter of Things. Nibsy whispers, "Big dog under the shrine. Don't let it out. Please."`,
    choices: [{ t: 'Crown Nibsy with a soup pot.', go: '__return' }],
  },
  tt_pit_refuse: {
    scene: 'fort',
    text: `Chuffwhistle's ears droop all the way to his chin. "Fine. Chuff will be clever in the pit, then. Forever. Alone. In the dark."\n\nThe goblins below set up a long, mournful wail that is mostly for effect.\n\n{healer} speaks up quietly. "Whatever we decide, we can't just leave them to starve down here. Can we?"`,
    choices: [
      { t: 'Open the grate and let them scatter into the woods.', go: '__return', set: { tt_pitFreed: true } },
      { t: 'Leave them for Sheriff Hemlock to deal with.', go: '__return', set: { tt_pitLeft: true } },
    ],
  },

  // ------------------------------------------------------------ Lyrie's study
  tt_study: {
    scene: 'catacombs',
    on: [{ set: { tt_studyDone: true } }],
    text: `{tank} steps forward and asks Orik, very slowly, about his rates, his contract terms, and whether dental is included. Orik, a professional, starts answering. Lyrie rolls her eyes and goes back to her notes.\n\nNobody is watching the narrow side arch. Through it, you can see a lamp-lit study crammed with books, scrolls, and charcoal rubbings of runes.\n\n{skirm} catches your eye and mouths: "Go. I'll keep watch."`,
    choices: [
      { t: 'Slip into the study.', check: { skill: 'stealth', dc: 15, who: 'player' }, pass: 'tt_study_in', fail: 'tt_study_trap' },
      { t: 'Too risky. Stay with the group.', go: '__return' },
    ],
  },
  tt_study_trap: {
    scene: 'catacombs',
    on: [{ damage: { who: 'player', dice: '1d6' } }],
    text: `Your foot crosses a chalk line on the threshold. A rune on the floor flares, and a pair of glowing lips appears in midair and SHRIEKS: "THIEF! THIEF! LYRIE, THERE IS A THIEF!" A crackle of sparks leaps up your leg.\n\nIn the hall, Lyrie snaps to her feet. "Oh, you have GOT to be joking."\n\nYou have perhaps three seconds. The desk is right in front of you, buried in papers.`,
    choices: [{ t: 'Grab an armful of papers and run!', go: 'tt_study_grab' }],
  },
  tt_study_grab: {
    scene: 'catacombs',
    on: [{ set: { tt_orikLedger: true } }],
    text: `You sweep a stack of papers into your arms and dash back through the arch before Lyrie reaches it. She glares, but Orik has his sword half up and {tank} hasn't moved an inch, so she settles for calling you "an illiterate magpie."\n\nYou glance down at what you grabbed. Mostly shopping lists. But one page is a ledger in tidy handwriting: "O. Vancaskerkin, wages owed. Pay upon completion. (Do not complete.)"\n\nInteresting.`,
    choices: [{ t: 'Rejoin the standoff.', go: '__return' }],
  },
  tt_study_in: {
    scene: 'catacombs',
    text: `You step neatly over a chalk rune on the threshold and into Lyrie's study. It's the room of someone who sleeps four hours a night and resents all four. Notes are pinned to every surface, connected by red string. In the middle of it all is a drawing of a seven-pointed star, each point labeled in a precise, cramped hand.\n\nOn the desk sits a locked iron box. Its lock is shaped like a tiny snarling dragon.`,
    choices: [
      { t: 'Study the notes.', check: { skill: 'arcana', dc: 16, who: 'party' }, pass: 'tt_study_lore', fail: 'tt_study_muddle' },
      { t: 'Pick the lock on the iron box.', check: { skill: 'disable', dc: 17, who: 'party' }, pass: 'tt_study_scroll', fail: 'tt_study_jam' },
      { t: 'Get out before anyone notices.', go: '__return' },
    ],
  },
  tt_study_lore: {
    scene: 'catacombs',
    on: [{ set: { tt_lyrieNotes: true, tt_orikLedger: true } }],
    text: `{who} reads fast, lips moving. The star is the Sihedron, symbol of ancient Thassilon, its seven points the seven virtues of rule that its runelords twisted into sins: greed, lust, wrath, gluttony, sloth, envy, pride.\n\nLyrie believes the old empire is waking. Nualia hears a "voice in the runes" that promises her power. Beneath the shrine, a sealed vault holds "the Mistress's hound, bound by Thassilonian wardcraft."\n\nAnd tucked under it all: Orik's wage ledger, marked "Do not pay."`,
    choices: [
      { t: 'Try the iron box too.', if: (s) => !s.flags.tt_boxTried, check: { skill: 'disable', dc: 17, who: 'party' }, pass: 'tt_study_scroll', fail: 'tt_study_jam' },
      { t: 'Pocket the ledger and slip back out.', go: '__return' },
    ],
  },
  tt_study_muddle: {
    scene: 'catacombs',
    on: [{ set: { tt_orikLedger: true } }],
    text: `The notes are in a cipher layered on top of Thassilonian layered on top of truly awful handwriting. {arcane} whimpers softly with longing. You make out "star," "seven," and possibly "soup."\n\nOne page is in plain Taldane, at least: a wage ledger. "O. Vancaskerkin. Pay upon completion. (Do not complete.)" Lyrie, it seems, was never going to pay Orik a single copper.\n\nThat might be worth mentioning to him.`,
    choices: [
      { t: 'Try the iron box.', if: (s) => !s.flags.tt_boxTried, check: { skill: 'disable', dc: 17, who: 'party' }, pass: 'tt_study_scroll', fail: 'tt_study_jam' },
      { t: 'Pocket the ledger and slip back out.', go: '__return' },
    ],
  },
  tt_study_scroll: {
    scene: 'catacombs',
    on: [{ set: { tt_scroll: true, tt_boxTried: true } }, { potions: 1 }],
    text: `{who} jiggles a pin, whispers to the dragon-lock, and it opens with a polite click. Inside, nested in velvet: a potion, a pouch of chalk, and a scroll sealed with red wax and covered in the same angular runes as the stair below.\n\n{arcane} unrolls an inch and goes pale with delight. "A warding scroll. For binding seals. She was keeping it to renew something." "Something she very much wanted to stay shut."\n\nYou take all of it.`,
    choices: [{ t: 'Slip back out.', go: '__return' }],
  },
  tt_study_jam: {
    scene: 'catacombs',
    on: [{ damage: { who: 'player', dice: '1d4' } }, { set: { tt_boxTried: true } }],
    text: `The dragon-lock bites. Literally. A tiny needle snaps out of its jaws and jabs {who} in the finger, leaving a stinging, numb ache that creeps up to the elbow.\n\nThe box stays firmly shut. In the hall, Orik's voice carries: "...and no, dental is not included." The conversation is wrapping up. You've lingered long enough.`,
    choices: [{ t: 'Slip back out.', go: '__return' }],
  },
  tt_ledger_fail: {
    scene: 'catacombs', npc: 'orik',
    text: `Orik reads the ledger, and his jaw works. Then he crumples it. "Maybe she cheats me. Maybe you forged that. Either way, I don't turn tail mid-job. Bad for business."\n\nLyrie's eyes, however, have gone very narrow. "You were in my STUDY?" Shadows ripple behind her as something scuttles out of the dark.\n\nWell. At least they'll be arguing with each other later.`,
    choices: [{ t: 'Fight!', go: 'orik_fight' }],
  },

  // ------------------------------------------------------------ The thing beneath Thistletop
  tt_vault: {
    scene: 'shrine',
    on: [{ set: { tt_vaultDone: true } }],
    text: (s) => `Behind the altar, a narrow stair spirals down into cold. At the bottom stands a round door of black stone, carved with a seven-pointed star. Red runes crawl around its rim like lazy fire.\n\nSomething on the other side is breathing. Slow, huge breaths that make the door creak. Then a growl, so low you feel it in your teeth, and a sound like claws the size of daggers dragging across stone.${s.flags.tt_hermitWarning ? '\n\nGranny Ogwen\'s words come back to you: a dog that is not a dog.' : ''}${s.flags.tt_vaultKnown ? '\n\nThe goblins warned you about this.' : ''}${s.flags.tt_scroll ? '\n\nLyrie\'s warding scroll feels warm in your pack.' : ''}`,
    choices: [
      { t: 'Reinforce the wards with arcane craft.', check: { skill: 'arcana', dc: 18, who: 'party', bonus: (s) => (s.flags.tt_scroll ? 4 : 0) + (s.flags.tt_lyrieNotes ? 2 : 0) }, pass: 'tt_vault_sealed', fail: 'tt_vault_backlash' },
      { t: 'Pray for the gods to strengthen the seal.', check: { skill: 'religion', dc: 18, who: 'party', bonus: (s) => (s.flags.tt_scroll ? 4 : 0) + (s.flags.tt_hermitWarning ? 2 : 0) }, pass: 'tt_vault_sealed', fail: 'tt_vault_backlash' },
      { t: 'Put an eye to the crack in the door. Just a peek.', go: 'tt_vault_peek' },
      { t: 'Back away quietly and leave it be.', go: 'tt_vault_leave' },
    ],
  },
  tt_vault_sealed: {
    scene: 'shrine',
    on: [{ set: { tt_sealed: true } }],
    text: (s) => `${s.flags.tt_scroll ? 'You unroll Lyrie\'s scroll, and its runes peel off the parchment like sparks, settling into the door\'s rim.' : '{who} lays a hand on the door, speaking words of binding older than Sandpoint.'} The red runes flicker, then burn clear and bright as dawn. One by one, new lines knit across the cracks.\n\nBehind the door, the breathing stops. A long, wounded whine. Then a voice like gravel in a bucket: "Another time, little ones." Silence.\n\nThe door is cold and still. Sealed, for now.`,
    choices: [{ t: 'Climb back to the shrine.', go: '__return' }],
  },
  tt_vault_backlash: {
    scene: 'shrine',
    on: [{ damage: { who: 'party', dice: '1d6' } }],
    text: `The runes resist. Red light lashes out like a whip, flinging everyone back against the stairs. Behind the door, something laughs: a horrible, hungry, panting laugh.\n\nThe wards still hold, but they flicker and stutter like a candle in a draft. {healer} staggers up, bruised and furious. "One more try. Together. I am NOT leaving that thing a weak door."\n\nThe growling grows louder.`,
    choices: [
      { t: 'Try once more, everyone together.', check: { skill: 'wis', dc: 15, who: 'party', bonus: (s) => (s.flags.tt_scroll ? 3 : 0) }, pass: 'tt_vault_sealed', fail: 'tt_vault_crack' },
      { t: 'Retreat before it gets worse.', go: 'tt_vault_leave' },
    ],
  },
  tt_vault_peek: {
    scene: 'shrine',
    text: `You press your eye to the hairline crack. Darkness. Then two coals open in that darkness, each as big as a fist, and look straight at you.\n\nYou can't move. A voice slides into your head, warm and friendly and absolutely wrong. "Oh, hello. You smell like a hero. Come closer. Touch the star. I'll make you a deal far better than the goblins got..."\n\nYour hand is rising toward the door. Did you tell it to do that?`,
    choices: [
      { t: 'Wrench yourself away!', check: { skill: 'wis', dc: 16, who: 'player', bonus: (s) => (s.flags.tt_hermitWarning ? 2 : 0) }, pass: 'tt_vault_peek_ok', fail: 'tt_vault_crack' },
    ],
  },
  tt_vault_peek_ok: {
    scene: 'shrine',
    on: [{ set: { tt_sawBeast: true } }],
    text: `You tear your eye from the crack and stumble back into {tank}'s arms, gasping. The voice snarls in frustration, and the door shudders under a blow that sends dust raining from the ceiling.\n\nYou saw it, just for a heartbeat: a hound bigger than a horse, with too many teeth and a goblin's cunning in its eyes. It knows your face now.\n\n"Right," says {skirm}, a little shakily. "Let's never do that again."`,
    choices: [
      { t: 'Shore up the seal before it tries again.', check: { skill: 'arcana', dc: 17, who: 'party', bonus: (s) => (s.flags.tt_scroll ? 4 : 0) }, pass: 'tt_vault_sealed', fail: 'tt_vault_backlash' },
      { t: 'Get away from this door.', go: 'tt_vault_leave' },
    ],
  },
  tt_vault_crack: {
    scene: 'shrine',
    on: [{ set: { tt_sealCracked: true } }, { damage: { who: 'party', dice: '2d6' } }],
    text: `Your fingertip touches the star. CRACK. A line of red races across the door, and a blast of hot, rotten wind hurls you all back up the stairs. Something roars with delight.\n\nBy the time you scramble up, the door has stopped shaking. The runes still glow, but a jagged crack now runs through the star, oozing faint red light, and the thing behind it is laughing softly.\n\n"Soon," it says. "Thank you, hero."`,
    choices: [{ t: 'Slam the shrine door and get away.', go: '__return' }],
  },
  tt_vault_leave: {
    scene: 'shrine',
    on: [{ set: { tt_vaultLeft: true } }],
    text: `You back up the stairs, step by careful step, and the growling fades behind you. Some doors are not yours to open. Some aren't yours to fix, either, not today, not with your wounds still bleeding.\n\n{arcane} glances back nervously. "We should tell someone. Someone with a lot of wizards." {tank} nods once. "Later. Alive first."\n\nThe runes keep glowing behind you, patient as the tide.`,
    choices: [{ t: 'Return to the shrine.', go: '__return' }],
  },
};

export const HOOKS = {
  nettlewood: [
    { t: 'Investigate the furious squealing in a nearby snare.', if: (s) => !s.flags.tt_scoutMet, go: 'tt_scout' },
    { t: 'Follow the faint sound of wind chimes off the path.', if: (s) => !s.flags.tt_hermitMet, go: 'tt_hermit' },
  ],
  thistletop: [
    { t: 'Search the cliff base for a way in through the sea caves.', if: (s) => !s.flags.tt_caves && !s.flags.tt_cavesTried, set: { tt_cavesTried: true }, check: { skill: 'survival', dc: 16, who: 'party', bonus: (s) => (s.flags.tt_cavesKnown ? 6 : 0) }, pass: 'tt_caves_find', fail: 'tt_caves_tide' },
  ],
  throne_after: [
    { t: 'Investigate the whimpering behind a curtain of dog hides.', if: (s) => !s.flags.tt_pitDone, ret: 'throne_after', go: 'tt_pit' },
  ],
  lower: [
    { t: 'Keep them talking while you sneak into Lyrie\'s study.', if: (s) => !s.flags.tt_studyDone, ret: 'lower', go: 'tt_study' },
    { t: 'Show Orik the ledger: Lyrie never meant to pay him.', if: (s) => !!s.flags.tt_orikLedger && !s.flags.tt_ledgerShown && !s.flags.orikSpared, set: { tt_ledgerShown: true }, check: { skill: 'diplomacy', dc: 12, who: 'player', bonus: (s) => (s.flags.goblinKing ? 2 : 0) }, pass: 'orik_spared', fail: 'tt_ledger_fail' },
  ],
  nualia_after: [
    { t: 'First, investigate the growling beneath the shrine.', if: (s) => !s.flags.tt_vaultDone, ret: 'nualia_after', go: 'tt_vault' },
  ],
};

export const SCENES = {
  tt_scout: [
    { who: 'skirm', text: 'Can we keep him? I\'ll feed him. I\'ll walk him.' },
    { who: 'healer', text: 'He\'s terrified. Look at his little ears shaking.' },
    { who: 'hero', text: H('Nobody eats anybody. Let\'s hear him out.', 'Aww. He\'s like an angry turnip!', 'Goblins bite. Careful.', 'Caught in his own trap. Relatable, honestly.') },
  ],
  tt_scout_spare: [
    { who: 'healer', text: 'That was kind. Kindness has a way of coming back around.' },
    { who: 'tank', text: 'Or stabbing you in the back.' },
    { who: 'skirm', text: 'He licked his own forehead. That\'s binding. That\'s practically a contract.' },
  ],
  tt_scout_talk: [
    { who: 'arcane', text: 'Sea caves! Tidal ingress points are classic smuggler architecture!' },
    { who: 'tank', text: 'Snappy things, he said.' },
    { who: 'hero', text: H('Good. Now we have options.', 'Ooh, a secret entrance! I love a secret entrance.', 'Useful. Remember it.', 'Snappy things. Fantastic. Love the specificity.') },
  ],
  tt_scout_bolt: [
    { who: 'skirm', text: 'Okay, in fairness, that was very good wriggling.' },
    { who: 'tank', text: 'Shields up. Here they come.' },
  ],
  tt_scout_path: [
    { who: 'tank', text: 'Never crawling through a goblin road again.' },
    { who: 'arcane', text: 'I believe a bramble is now living in my hair. Permanently.' },
    { who: 'healer', text: 'And nobody saw us. Thank you, Nibsy.' },
  ],
  tt_hermit: [
    { who: 'arcane', text: 'Those chimes are knucklebones. Probably rabbit. Probably.' },
    { who: 'skirm', text: 'That crow is judging me. I can feel it.' },
    { who: 'hero', text: H('Respect her home. We\'re guests here.', 'Hi, Granny! Sorry about the mushrooms!', 'Watch the crow.', 'Charming. She hates us already. We\'re making progress.') },
  ],
  tt_hermit_fence: [
    { who: 'tank', text: 'Good fence. Honest work.' },
    { who: 'arcane', text: 'Could someone please remove the crow? It\'s nesting.' },
  ],
  tt_hermit_splinter: [
    { who: 'healer', text: 'Hold still. No, the other place. No, STILL.' },
    { who: 'tank', text: 'Fence won.' },
    { who: 'skirm', text: 'The fence was rigged. I\'m sure of it.' },
  ],
  tt_hermit_rude: [
    { who: 'arcane', text: 'Ow! She has the swing of a war-mage!' },
    { who: 'skirm', text: 'The crow robbed someone FOR us. I think I\'m in love.' },
    { who: 'hero', text: H('Lesson learned: no fish for sea folk.', 'That went... surprisingly well, considering the broom?', 'Run now. Talk later.', 'Fish. To a woman by the sea. Genius move.') },
  ],
  tt_hermit_tea: [
    { who: 'healer', text: 'This tea is wonderful. What\'s in it?' },
    { who: 'arcane', text: 'A dog that is not a dog. A fiend? A Thassilonian binding? I have so many questions and she is so scary.' },
    { who: 'hero', text: H('We\'ll keep that promise.', 'We promise, Granny! Pinky swear!', 'Noted. No doors.', 'Great. Another thing that wants to eat us.') },
  ],
  tt_caves_find: [
    { who: 'tank', text: 'Cold water. Wonderful.' },
    { who: 'skirm', text: 'Rocks are faster. Rocks are always faster.' },
    { who: 'arcane', text: 'The tide schedule here is very interesting. And rising. Mostly rising.' },
  ],
  tt_caves_tide: [
    { who: 'healer', text: 'I have seaweed in places seaweed should not be.' },
    { who: 'tank', text: 'Bridge it is.' },
  ],
  tt_caves_cold: [
    { who: 'arcane', text: 'I cannot feel my toes. I may never feel my toes again.' },
    { who: 'healer', text: 'Keep moving. Movement keeps you warm.' },
  ],
  tt_caves_slip: [
    { who: 'skirm', text: 'I\'d give that a ten. The crab gives it a six.' },
    { who: 'hero', text: H('I\'m fine! Onward!', 'I MEANT to do that! Crab and all!', 'Nobody saw that.', 'Not one word. Not ONE.') },
  ],
  tt_caves_inner: [
    { who: 'arcane', text: 'Reefclaws! Their pincers can sever... oh, never mind the details.' },
    { who: 'skirm', text: 'Crates. Lots of lovely, unattended crates.' },
    { who: 'tank', text: 'Claws first. Crates after.' },
  ],
  tt_caves_sneak: [
    { who: 'skirm', text: 'He calls for his mama. That\'s adorable. Still stabbing him, though.' },
    { who: 'healer', text: 'Quietly, please. Quietly.' },
  ],
  tt_caves_noticed: [
    { who: 'tank', text: 'Who kicked the pebble?' },
    { who: 'skirm', text: 'Not me. Probably the crab.' },
  ],
  tt_caves_loot: [
    { who: 'healer', text: 'These are from Sandpoint. Someone\'s been stealing from our neighbors.' },
    { who: 'skirm', text: 'And now we\'re stealing it back. Which makes it not stealing. It\'s returning!' },
    { who: 'hero', text: H('We\'ll return what we can to the town.', 'Cheese! So much cheese!', 'Take the potions. Leave the rest.', 'Smugglers working with goblins. Classy.') },
  ],
  tt_caves_cache: [
    { who: 'arcane', text: 'Feel that hum! Proper Magnimar enchanting!' },
    { who: 'tank', text: 'Warm, too.' },
    { who: 'skirm', text: 'I look fabulous. Somebody say I look fabulous.' },
  ],
  tt_caves_stair: [
    { who: 'arcane', text: 'Thassilonian! The goblins are squatting on a ruin and don\'t even know it!' },
    { who: 'tank', text: 'Quiet. Someone\'s singing up there.' },
  ],
  tt_caves_kennel: [
    { who: 'tank', text: 'Dogs. Should\'ve guessed.' },
    { who: 'healer', text: 'Who got bitten? Everyone? Of course everyone.' },
  ],
  tt_caves_emerge: [
    { who: 'skirm', text: 'Inside and unseen. That is how professionals do it.' },
    { who: 'hero', text: H('We\'re in. Stay sharp.', 'Sneaky sneaky! We\'re so good at this!', 'Inside. Quiet now.', 'Sure, ignore the smell. Totally fine.') },
  ],
  tt_caves_backdoor: [
    { who: 'skirm', text: 'That ham. That beautiful, abandoned ham.' },
    { who: 'healer', text: 'Keep walking.' },
    { who: 'tank', text: 'Remind me to thank that goblin.' },
  ],
  tt_pit: [
    { who: 'healer', text: 'They\'ve been down there a while. Look how thin they are.' },
    { who: 'tank', text: 'Still goblins.' },
    { who: 'hero', text: H('Prisoners deserve a fair hearing. Even goblins.', 'A goblin with a speech prepared! This is the best day!', 'Careful. Goblins lie.', 'Ah yes, goblin politics. My favorite flavor of chaos.') },
  ],
  tt_pit_feed: [
    { who: 'skirm', text: 'That one\'s hugging the cheese. I respect that.' },
    { who: 'healer', text: 'There. Everyone deserves a drink of water.' },
  ],
  tt_pit_chuff: [
    { who: 'arcane', text: 'He can count to eleven. That puts him ahead of several Magnimar councilors.' },
    { who: 'tank', text: 'Small fires. Hm.' },
  ],
  tt_pit_chuff_shrug: [
    { who: 'skirm', text: 'Teach me to do the eye thing. Please.' },
    { who: 'hero', text: H('Well. That was unsettling.', 'How does he DO that?!', 'Learned nothing.', 'I will never unsee that.') },
  ],
  tt_pit_truth: [
    { who: 'healer', text: 'He\'s afraid. Of whatever is under that shrine.' },
    { who: 'arcane', text: 'If the goblins fear it, we should listen.' },
  ],
  tt_pit_haggle: [
    { who: 'skirm', text: 'That\'s a VERY nice crown. Just saying.' },
    { who: 'tank', text: 'Birthday candles. We\'re arguing about birthday candles.' },
  ],
  tt_pit_deal: [
    { who: 'healer', text: 'If this holds, Sandpoint might finally have a quiet summer.' },
    { who: 'arcane', text: 'Historians will call this the Treaty of the Pit! Possibly. I will call it that.' },
    { who: 'hero', text: H('Keep your word, Chief, and we\'ll keep ours.', 'Long live Chief Chuffwhistle!', 'We\'ll be watching, Chief.', 'Congratulations on your pot.') },
  ],
  tt_pit_nibsy: [
    { who: 'skirm', text: 'Our little guy! All grown up! I\'m not crying, YOU\'RE crying.' },
    { who: 'tank', text: 'Good choice.' },
    { who: 'healer', text: 'Be a kind chief, Nibsy.' },
  ],
  tt_pit_refuse: [
    { who: 'tank', text: 'Can\'t trust a goblin treaty.' },
    { who: 'healer', text: 'Maybe not. But we can still be merciful.' },
  ],
  tt_study: [
    { who: 'tank', text: 'So. Dental. Tell me about it.' },
    { who: 'skirm', text: 'Go, go, go. I\'ll cough if anyone looks.' },
  ],
  tt_study_trap: [
    { who: 'arcane', text: 'A magic mouth! Oh, that\'s an elegant little alarm, actually.' },
    { who: 'hero', text: H('Grab what matters and go!', 'Eep! Grab stuff! Run!', 'Move. Now.', 'Lovely. A screaming door. Just what I needed.') },
  ],
  tt_study_grab: [
    { who: 'skirm', text: 'Shopping lists AND a scandal. Nice haul.' },
    { who: 'tank', text: 'Orik ought to see that ledger.' },
  ],
  tt_study_in: [
    { who: 'arcane', text: 'Look at the string! She connected everything! I want to marry this wall.' },
    { who: 'skirm', text: 'That box is begging to be opened.' },
  ],
  tt_study_lore: [
    { who: 'arcane', text: 'The seven sins of Thassilon. Greed first. Always greed first.' },
    { who: 'healer', text: 'A hound bound beneath the shrine. We have to find it.' },
    { who: 'hero', text: H('The more we know, the better we fight.', 'Ooh, ancient secrets AND office drama!', 'Bad news, all of it.', 'Great. An empire waking up. That\'s fine.') },
  ],
  tt_study_muddle: [
    { who: 'arcane', text: 'A triple cipher. She\'s a monster. A genius monster.' },
    { who: 'skirm', text: 'Soup? It says soup? I like this wizard now.' },
  ],
  tt_study_scroll: [
    { who: 'skirm', text: 'Tiny dragon locks are my favorite kind of lock.' },
    { who: 'arcane', text: 'A binding scroll. We might need this very soon.' },
  ],
  tt_study_jam: [
    { who: 'healer', text: 'Let me see that finger. Oh, that\'s swelling. Stop poking it.' },
    { who: 'hero', text: H('It\'s nothing. Let\'s go.', 'The dragon BIT me! Rude!', 'Leave it.', 'Bitten by a lock. My life is a comedy.') },
  ],
  tt_ledger_fail: [
    { who: 'tank', text: 'Stubborn. Can\'t fault him.' },
    { who: 'skirm', text: 'Well, now SHE\'S angry. Worth it.' },
  ],
  tt_vault: [
    { who: 'arcane', text: 'Those are Thassilonian binding wards. Very old, very strained.' },
    { who: 'tank', text: 'Whatever that is, it\'s big.' },
    { who: 'healer', text: 'Dawnflower, give us strength.' },
  ],
  tt_vault_sealed: [
    { who: 'healer', text: 'It held. Thank the light, it held.' },
    { who: 'arcane', text: '"Another time." It TALKED. I hate that it talked.' },
    { who: 'hero', text: H('Sealed. Sandpoint sleeps safe tonight.', 'We did it! Bye, scary doggy!', 'For now.', '"Another time." Sure. Mark your calendar.') },
  ],
  tt_vault_backlash: [
    { who: 'tank', text: 'Again. Together.' },
    { who: 'arcane', text: 'It\'s fighting back! The wards are fighting us!' },
  ],
  tt_vault_peek: [
    { who: 'healer', text: 'Don\'t listen to it! Look at me, not the door!' },
    { who: 'tank', text: 'Step away. Now.' },
  ],
  tt_vault_peek_ok: [
    { who: 'tank', text: 'Got you. Breathe.' },
    { who: 'hero', text: H('It knows us now. Let it remember.', 'Okay. Okay. That was a lot of teeth.', 'Never again.', 'Note to self: no peeking at hellhounds.') },
  ],
  tt_vault_crack: [
    { who: 'healer', text: 'What did it do to you? Look at me. Are you still you?' },
    { who: 'arcane', text: 'The seal is cracked. Not broken. Cracked. We need to tell someone. Everyone.' },
    { who: 'tank', text: 'Out. Now.' },
  ],
  tt_vault_leave: [
    { who: 'healer', text: 'We\'ll come back. When we\'re ready.' },
    { who: 'hero', text: H('Some battles wait for another day.', 'Nope! Nope nope nope. Bye!', 'Not today.', 'Leaving the giant demon dog alone. Truly our wisest choice.') },
  ],
};

export const CAMP = [
  { if: (s) => !!s.flags.tt_goblinFriend, lines: [
    { who: 'skirm', text: 'Do you think Nibsy is okay out there?' },
    { who: 'tank', text: 'He\'s a goblin. He\'s fine.' },
    { who: 'skirm', text: 'You\'re worried about him too. I can tell.' },
    { who: 'tank', text: '...A little.' },
  ] },
  { if: (s) => !!s.flags.tt_hermitMet, lines: [
    { who: 'arcane', text: 'That crow of Granny Ogwen\'s had a very intelligent eye. Possibly a familiar.' },
    { who: 'healer', text: 'Or possibly just a crow who knows we\'re easy marks.' },
    { who: 'hero', text: H('Either way, I hope she\'s safe.', 'I miss that crow already!', 'Crow\'s a thief.', 'It stole for us. Best crow in Varisia.') },
  ] },
  { if: (s) => !!s.flags.tt_goblinChief, lines: [
    { who: 'healer', text: 'A goblin chief who swore off burning towns. Do you think it will last?' },
    { who: 'hero', text: H('If we keep our side, maybe they\'ll keep theirs.', 'I believe in our little goblin chief!', 'A month. Maybe two.', 'Define "last." Do cozy fires count?') },
    { who: 'tank', text: 'We\'ll find out.' },
  ] },
  { if: (s) => !!s.flags.tt_lyrieNotes, lines: [
    { who: 'arcane', text: 'Lyrie\'s notes keep me up at night. Seven sins, seven runelords, and one of them waking up.' },
    { who: 'skirm', text: 'Which one\'s the greedy one?' },
    { who: 'arcane', text: 'Karzoug. Why?' },
    { who: 'skirm', text: 'No reason. Professional curiosity.' },
  ] },
  { if: (s) => !!s.flags.tt_sealCracked, lines: [
    { who: 'healer', text: 'You\'re quiet tonight. Is it the thing under Thistletop?' },
    { who: 'hero', text: H('It thanked me. I can\'t stop hearing it.', 'I\'m fine! Totally! It just... said my name, is all.', 'It\'ll come. We\'ll be ready.', 'A demon dog owes me a favor. That\'s not ominous at all.') },
    { who: 'healer', text: 'Then we face it together. Like everything else.' },
  ] },
  { if: (s) => !!s.flags.tt_sealed, lines: [
    { who: 'tank', text: 'That door. Good work, sealing it.' },
    { who: 'arcane', text: 'Wards like that don\'t last forever, though.' },
    { who: 'tank', text: 'Long enough is enough.' },
  ] },
];

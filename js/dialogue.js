// Character dialogue: combat barks, scene banter and campfire conversations.
// Speakers: companions by name (Brannoc, Tamsin, Quillan, Pip), the hero by personality
// (heroic, cheerful, grim, snarky), and monsters by stat-block key.
// Tokens: {t} target, {a} attacker/actor, {src} healer, {hero} player name.

export const PERSONALITIES = {
  heroic: { name: 'Heroic', desc: 'Brave, earnest, inspiring. Believes in doing the right thing.' },
  cheerful: { name: 'Cheerful', desc: 'Upbeat and friendly. Finds the fun in every disaster.' },
  grim: { name: 'Grim', desc: 'Few words, dark humor, quietly reliable.' },
  snarky: { name: 'Snarky', desc: 'Sharp-tongued and sarcastic, but always shows up.' },
};

// Companion personalities (also used as the AI banter character sheet).
export const CAST = {
  Brannoc: 'gruff, laconic ex-militia fighter; few words, dry humor, fiercely protective, loves ale',
  Tamsin: 'warm, stubborn cleric of Sarenrae the Dawnflower; kind but scolds recklessness, braver than she looks',
  Quillan: 'excitable elven wizard obsessed with Thassilonian runes and history; talks too much, uses big words',
  Pip: 'cheeky halfling rogue and "acquisitions expert"; jokes constantly, pockets shiny things, secretly loyal',
};

export const BARKS = {
  start: {
    Brannoc: ['Form up. Behind me.', 'Here they come.', 'Shields up.', 'Let\'s get this done.', 'Stay close, all of you.', 'Right. Who\'s first?'],
    Tamsin: ['Dawnflower, guide our blades!', 'Stay together and I\'ll keep you standing!', 'Sarenrae watch over us.', 'Nobody dies today. That\'s an order.', 'Light against the dark!'],
    Quillan: ['Ooh, a tactical puzzle!', 'Everyone mind the area spells, please!', 'Fascinating. Hostile, but fascinating.', 'Arcane support, standing by!', 'I\'ve read about this. Theoretically.'],
    Pip: ['Dibs on whatever they\'re carrying!', 'Oh good, I was getting bored.', 'Let\'s make this quick, I left a pie cooling.', 'I\'ll be over there. Stabbing.', 'Anyone else hungry? No? Fight, then.'],
    heroic: ['For Sandpoint!', 'Stand with me!', 'We end this here!', 'No one gets past us!', 'Courage, friends!'],
    cheerful: ['Ooh, here we go!', 'Let\'s have some fun!', 'Big smiles, everyone!', 'This\'ll make a great story later!', 'Ready when you are!'],
    grim: ['Let\'s finish it.', 'Bad day to be them.', 'Here we go again.', 'Quick and quiet.', 'They chose this.'],
    snarky: ['Oh great, more of them.', 'Wonderful. Just wonderful.', 'Try not to trip over your own feet.', 'I was promised a quiet festival.', 'Fine. Let\'s dance.'],
  },
  crit: {
    Brannoc: ['That\'s how it\'s done.', 'Down you go.', 'Felt that, did you?', 'Hah!', 'Clean.'],
    Tamsin: ['By the dawn\'s light!', 'Sarenrae guides my hand!', 'Sorry! Not sorry.', 'That one was blessed!'],
    Quillan: ['Precision! Geometry!', 'Did everyone see that?', 'Textbook execution!', 'I will be writing about this.'],
    Pip: ['Right in the soft bit!', 'Ooh, that\'s gonna bruise.', 'Pip strikes again!', 'Stabbity stab!', 'Nobody saw that coming. Especially you.'],
    heroic: ['For the innocent!', 'Justice strikes!', 'Yield, villain!', 'That is for Sandpoint!'],
    cheerful: ['Woohoo!', 'Did you see that?!', 'Bullseye!', 'Ha! I\'m amazing!'],
    grim: ['Done.', 'Stay down.', 'Clean cut.', 'That\'ll do.'],
    snarky: ['Oops. Did that hurt?', 'You walked into that.', 'Flawless. As usual.', 'Should\'ve stayed home.'],
  },
  kill: {
    Brannoc: ['One less.', 'Next.', 'That\'s that.', 'Stay down.'],
    Tamsin: ['May you find peace.', 'Go to your rest.', 'Dawnflower forgive me.', 'One fewer threat.'],
    Quillan: ['Neutralized!', 'Arcane superiority!', 'And that concludes the lesson.', 'Oh dear. Very thoroughly defeated.'],
    Pip: ['Mine! I mean, dead. Also mine.', 'Dibs on the boots.', 'Too slow!', 'And stay down, shorty! ...wait.'],
    heroic: ['One down!', 'Who\'s next?', 'The light prevails!', 'Rest now.'],
    cheerful: ['Got one!', 'Yay! Next!', 'That\'s a point for me!', 'Bye-bye!'],
    grim: ['Next.', 'One less.', 'Over.', 'Should\'ve run.'],
    snarky: ['Well, that was anticlimactic.', 'Next contestant.', 'Called it.', 'Stay down. Thanks.'],
  },
  allyDown: {
    Brannoc: ['{t}! Get up!', 'Man down! Cover {t}!', 'They\'ll pay for that.', '{t}, hold on!'],
    Tamsin: ['{t}! I\'m coming!', 'No, no, no! Hold on, {t}!', 'Stay with me, {t}!', 'Dawnflower, not {t}!'],
    Quillan: ['{t} has fallen! This is suboptimal!', 'Oh gods, {t}!', 'Someone help {t}!', '{t}! Tamsin, quickly!'],
    Pip: ['{t}! Hey! Don\'t you dare!', 'Not {t}! You owe me money!', 'Oi! That\'s my friend!', '{t}, get up, it\'s not funny!'],
    heroic: ['{t}! Hold on, I\'m here!', 'You\'ll answer for that!', 'Protect {t}!', 'Stay with us, {t}!'],
    cheerful: ['{t}?! No no no!', 'Hey! Leave {t} alone!', '{t}, wake up! Please!', 'Not cool! Not cool!'],
    grim: ['{t}\'s down.', 'Cover {t}.', 'They\'ll bleed for that.', 'Hold on, {t}.'],
    snarky: ['{t}! Don\'t you dare leave me with these idiots!', 'Get up, {t}, that\'s an order!', 'Oh, now they\'ve made me angry.', 'Really, {t}? Now?'],
  },
  lowHp: {
    Brannoc: ['Just a scratch.', 'I\'ve had worse.', 'Still standing.', 'Could use a hand here.'],
    Tamsin: ['I need a moment!', 'I\'m hurt, but I\'m here!', 'Light, give me strength...', 'Ow. Ow ow ow.'],
    Quillan: ['I\'m not built for this!', 'Help! Squishy wizard here!', 'Is that my blood? That\'s my blood!', 'Tactical retreat?'],
    Pip: ['Ow! Ow! I\'m small, I bruise easy!', 'Someone? Anyone? Healing?', 'This is fine. Totally fine.', 'I need a hug. And a potion.'],
    heroic: ['I can still fight!', 'Not yet... not yet!', 'I won\'t fall here!', 'Hold the line!'],
    cheerful: ['Okay, that one hurt!', 'Ow! Still smiling though!', 'Little help, friends?', 'Totally meant to do that.'],
    grim: ['Bleeding.', 'Not dead yet.', 'Need healing.', 'Hurts.'],
    snarky: ['Great. Bleeding. My favorite.', 'Could someone maybe heal the hero?', 'I\'m fine. Ignore the blood.', 'This is going on my complaint list.'],
  },
  healedBy: {
    Brannoc: ['Thanks.', 'Owe you one, {src}.', 'Back in it.', 'Good.'],
    Tamsin: ['Thank you, {src}!', 'Much better!', 'Bless you, {src}.'],
    Quillan: ['Splendid! Thank you, {src}!', 'Ah, vitality restored!', 'You\'re a marvel, {src}.'],
    Pip: ['Ooh, tingly!', 'You\'re the best, {src}!', 'I\'d kiss you, {src}, but we\'re busy.', 'Good as new! Mostly.'],
    heroic: ['Thank you, {src}!', 'Back on my feet!', 'Your faith keeps me going!'],
    cheerful: ['Ooh, that\'s nice!', 'Thanks, {src}! You\'re the best!', 'All better!'],
    grim: ['Thanks.', 'Better.', 'Owe you.'],
    snarky: ['Took you long enough. Thanks.', 'Finally. Thank you, {src}.', 'I suppose I\'ll live.'],
  },
  revived: {
    Brannoc: ['...not dead. Good.', 'Back. Where\'s the one who hit me?', 'Ugh. Thanks.'],
    Tamsin: ['I saw the light... it was very bright.', 'Thank you. Let\'s finish this!', 'I\'m back!'],
    Quillan: ['Did I die? Was it interesting?', 'Ugh, my head. What did I miss?', 'Note to self: do not do that again.'],
    Pip: ['I\'m alive! Did anyone take my stuff?', 'Ow. I hate that.', 'Pip\'s back, baby!'],
    heroic: ['I\'m not done yet!', 'Thank you. Now, where were we?', 'Back to the fight!'],
    cheerful: ['Ta-da! I\'m back!', 'Whoa, what happened?', 'Did I miss anything fun?'],
    grim: ['...still here.', 'Back.', 'Not today.'],
    snarky: ['Death was boring anyway.', 'Miss me?', 'Ugh. Who let me die?'],
  },
  fumble: {
    Brannoc: ['...didn\'t happen.', 'Hmph.', 'Nobody saw that.'],
    Tamsin: ['Oops!', 'Oh, Dawnflower, why?', 'That was... a warning swing.'],
    Quillan: ['A minor miscalculation!', 'Oh dear. Oh dear oh dear.', 'That was a decoy maneuver!'],
    Pip: ['That was on purpose. For the drama.', 'Who moved?!', 'Butterfingers!'],
    heroic: ['A temporary setback!', 'Hmph. Again!'],
    cheerful: ['Whoopsie!', 'Ha, oops! My bad!'],
    grim: ['...', 'Ugh.'],
    snarky: ['Nobody say a word.', 'I meant to do that.'],
  },
  allyCrit: {
    Brannoc: ['Nice hit, {a}.', 'Good one, {a}.', 'Hah. Well struck.'],
    Tamsin: ['Wonderful, {a}!', 'Well done, {a}!', 'The light shines on you, {a}!'],
    Quillan: ['Exquisite technique, {a}!', 'Bravo, {a}!', 'I must take notes, {a}!'],
    Pip: ['Ooh, {a}, show-off!', 'Nice one, {a}!', 'That\'s gonna leave a mark!'],
    heroic: ['Well fought, {a}!', 'That\'s the spirit, {a}!'],
    cheerful: ['Yeah, {a}! Woo!', 'Go {a}!'],
    grim: ['Nice.', 'Good hit, {a}.'],
    snarky: ['Not bad, {a}. Not bad at all.', 'Fine, {a}, that was impressive.'],
  },
  spell: {
    Quillan: ['Behold!', 'Arcane arts, engage!', 'Stand back, I\'m doing magic!', 'Sihedron and syllable!', 'Let the formulas speak!'],
    Tamsin: ['Dawnflower, hear me!', 'Light, mend us!', 'Sarenrae, lend me your fire!', 'Be blessed!'],
    heroic: ['By my power!', 'Magic, answer me!'],
    cheerful: ['Ooh, sparkles!', 'Magic time!'],
    grim: ['Burn.', 'Power.'],
    snarky: ['Watch and learn.', 'Abracadabra, I guess.'],
  },
  victory: {
    Brannoc: ['That\'s done. Drinks are on someone else.', 'Good work.', 'Everyone in one piece?', 'Hmph. Too easy.'],
    Tamsin: ['Thank the Dawnflower. Is everyone all right?', 'Let me look at those wounds.', 'We did it! Together!'],
    Quillan: ['A resounding victory! I\'ll write it up.', 'I believe that went rather well!', 'Did anyone else see my spell? It was very good.'],
    Pip: ['Looting time! I mean, respectful searching time.', 'Another win for Team Pip!', 'Easy! Totally easy. I wasn\'t scared.'],
    heroic: ['Victory! Well fought, all of you!', 'Sandpoint is safer tonight.', 'Together, nothing can stop us!'],
    cheerful: ['We won! Group hug!', 'That was awesome!', 'Woo! Best team ever!'],
    grim: ['It\'s over.', 'We live. Good.', 'Keep moving.'],
    snarky: ['And not a moment too soon.', 'Nobody tell me that was hard.', 'Well. That happened.'],
  },
};

// Monster taunts (by stat-block key)
export const MONSTER_BARKS = {
  goblin: ['Goblins chew and goblins bite!', 'Longshanks! Stab stab stab!', 'Your head looks tasty!', 'We burn your pies!', 'Chop chop, longshanks!', 'Hee hee hee!', 'Mine! My shiny!', 'Goblins cut and goblins fight!'],
  goblinArcher: ['Pew pew! Hee hee!', 'Shoot the tall one!', 'Arrows for your face!', 'Can\'t catch me!'],
  warchanter: ['Sing, goblins, SING!', 'Burn it all, la la la!', 'Goblin song make goblin strong!', 'Fight fight fight!'],
  goblinDog: ['*snarl*', '*yip yip*', '*growl*'],
  boar: ['*SNORT*', '*squeal*'],
  tsuto: ['You\'ll never stop her!', 'My sister was weak. I am not.', 'Sandpoint will burn!', 'Nualia promised me everything!'],
  sinspawn: ['*hiss*', '...wrath... wrath...', '*gnashing*'],
  erylium: ['Pretty meat! Pretty sinspawn meat!', 'Erylium bites! Erylium poisons!', 'The Mistress will reward me!', 'Hee hee! Can\'t hit Erylium!'],
  bruthazmus: ['Bruthazmus hunts!', 'Elf-friend dies first!', 'Run, little meats!', 'Good shooting. Hah!'],
  ripnugget: ['RIPNUGGET THE MIGHTY!', 'Stickfoot, bite them!', 'Me chief! You nothing!', 'Get them, worthless goblins!'],
  orik: ['Nothing personal.', 'I\'m paid either way.', 'You\'re good. I\'m better.'],
  lyrie: ['You\'re interrupting my research!', 'Insufferable children.', 'Burn!'],
  nualia: ['They loved their angel. Now they\'ll fear her!', 'Lamashtu, take them!', 'I am no one\'s lucky charm!', 'Bleed for the Mother of Monsters!'],
  yethHound: ['*horrible baying*', '*growl*'],
};

// Scene banter: shown after the narration of a story node.
// `hero` lines are objects keyed by personality.
const H = (heroic, cheerful, grim, snarky) => ({ heroic, cheerful, grim, snarky });
export const SCENES = {
  meet: [
    { who: 'skirm', text: 'Hi! I\'m Pip. Those were my fries. Well. They are now.' },
    { who: 'tank', text: 'Brannoc. Watch your purse around the small one.' },
    { who: 'arcane', text: 'Quillan! Have any of you seen the Old Light up close? The glyphs are extraordinary!' },
    { who: 'healer', text: 'Tamsin. Don\'t mind them. They\'re harmless. Mostly.' },
    { who: 'hero', text: H('Glad to meet you all. Let\'s watch each other\'s backs.', 'This is the best table in the inn! Hi, everyone!', 'Hm. Fine company. Pass the ale.', 'A thief, a brute and a bookworm. Lovely.') },
  ],
  festival: [
    { who: 'skirm', text: 'Free pie samples! I\'ve had nine. Professional research.' },
    { who: 'arcane', text: 'Did you know the cathedral sits on far older foundations?' },
    { who: 'tank', text: 'Nobody cares, Quillan.' },
    { who: 'hero', text: H('It\'s good to see the town smiling again.', 'Pie! Music! Butterflies! Best day ever!', 'Too many people. Too much noise.', 'If the mayor\'s speech gets any longer, I\'m leaving.') },
  ],
  raid: [
    { who: 'skirm', text: 'Are those goblins? Singing? Why are they always singing?!' },
    { who: 'healer', text: 'People are hurt! We have to help them!' },
    { who: 'hero', text: H('Protect the townsfolk! With me!', 'Okay! Goblins! We can handle goblins!', 'Blades out.', 'I knew this festival was too nice.') },
  ],
  raid_after: [
    { who: 'tank', text: 'Two fights. Pick one.' },
    { who: 'healer', text: 'That man is going to be eaten by a dog!' },
    { who: 'arcane', text: 'And the boneyard! Why would goblins want graves?' },
  ],
  aldern_after: [
    { who: 'skirm', text: 'Nice coat. Shame about the dog drool.' },
    { who: 'healer', text: 'Pip!' },
    { who: 'hero', text: H('You\'re safe now, my lord.', 'You\'re welcome! Nice hat, by the way!', 'Stay indoors.', 'Next time, run faster.') },
  ],
  cathedral_after: [
    { who: 'healer', text: 'Who would dig up a priest? It\'s monstrous.' },
    { who: 'arcane', text: 'Goblins don\'t plan. Somebody planned this.' },
  ],
  raid_end: [
    { who: 'tank', text: 'Hemlock\'s right. Goblins don\'t do this alone.' },
    { who: 'skirm', text: 'Free room at the Rusty Dragon though! Silver linings!' },
  ],
  day2: [
    { who: 'arcane', text: 'I vote we visit the scholar first. For science.' },
    { who: 'skirm', text: 'I vote breakfast. For survival.' },
  ],
  zantus_clue: [
    { who: 'healer', text: 'Lamashtu. The Mother of Monsters. Here.' },
    { who: 'tank', text: 'Then we find whoever did this and end it.' },
  ],
  zantus_tobyn: [
    { who: 'healer', text: 'A girl the whole town called a miracle. That\'s a heavy thing to carry.' },
    { who: 'hero', text: H('Nobody should be treated like a lucky charm.', 'Poor girl. That sounds lonely.', 'Missing body. Burned chapel. I don\'t like it.', 'Let me guess. She\'s not actually dead.') },
  ],
  shalelu_win: [
    { who: 'skirm', text: 'She likes us! She definitely likes us.' },
    { who: 'tank', text: 'She tolerates us.' },
  ],
  boar_intro: [
    { who: 'skirm', text: 'Aldern, you brought eight servants and a harp. To a hunt.' },
    { who: 'arcane', text: 'Boars! Big ones! Oh no!' },
  ],
  boar_after: [
    { who: 'healer', text: 'He keeps staring at you. It\'s a little... much.' },
    { who: 'hero', text: H('He\'s just grateful. I think.', 'He\'s sweet! A bit intense, but sweet!', 'Hm. Watch him.', 'Eleven compliments in one ride. I counted.') },
  ],
  quink_win: [
    { who: 'arcane', text: 'Seven sins! Seven Runelords! I need to sit down.' },
    { who: 'tank', text: 'You are sitting down.' },
  ],
  ameiko_missing: [
    { who: 'skirm', text: 'Ameiko\'s the only innkeeper who doesn\'t water the ale. We\'re getting her back.' },
    { who: 'hero', text: H('Then we go now. No delays.', 'Let\'s go save our favorite innkeeper!', 'Glassworks. Now.', 'Fine. Hero time again.') },
  ],
  glass_after: [
    { who: 'healer', text: 'Oh, Lukas... gods. Ameiko, I\'m so sorry.' },
    { who: 'tank', text: 'Somebody\'s going to answer for this.' },
  ],
  tsuto_confront: [
    { who: 'hero', text: H('Your sister trusted you!', 'Come on, Tsuto, you don\'t want this!', 'Last chance.', 'Oh, you\'re the villain? Bold choice.') },
  ],
  tsuto_journal: [
    { who: 'arcane', text: 'Catacombs of wrath. Under the Glassworks! History, right beneath our feet!' },
    { who: 'healer', text: 'And a demon-touched woman who wants to burn the town. Let\'s not forget that part.' },
  ],
  catacombs: [
    { who: 'arcane', text: 'Look at this masonry! Ten thousand years old and not a crack!' },
    { who: 'skirm', text: 'Look at that thing skittering in the dark! Very much alive!' },
  ],
  runewell: [
    { who: 'skirm', text: 'It\'s tiny! It\'s like a mean little bat-frog!' },
    { who: 'healer', text: 'A demon. Careful, all of you.' },
  ],
  runewell_destroyed: [
    { who: 'arcane', text: 'I just helped destroy a ten-thousand-year-old artifact. I have complicated feelings.' },
    { who: 'tank', text: 'Feel them later.' },
  ],
  hemlock: [
    { who: 'tank', text: 'Thistletop. I\'ve heard stories. None good.' },
    { who: 'hero', text: H('Then we\'ll write a better one.', 'An island fort of thorns! It sounds like an adventure!', 'Let\'s go.', 'Of course it\'s a thorn fort. Of course.') },
  ],
  nettlewood: [
    { who: 'skirm', text: 'Everything here has thorns. The bushes. The trees. Probably the squirrels.' },
    { who: 'arcane', text: 'Ow. Ow. Robes were a mistake.' },
  ],
  thistletop: [
    { who: 'tank', text: 'Rope bridge. Archers. Wonderful.' },
    { who: 'skirm', text: 'I could climb that. Probably. Maybe.' },
  ],
  throne: [
    { who: 'skirm', text: 'His crown is a bucket. He\'s wearing a bucket.' },
    { who: 'hero', text: H('Surrender, and your tribe can live!', 'Nice throne! Is that a wagon?', 'Your reign ends today.', 'All hail the bucket king.') },
  ],
  throne_after: [
    { who: 'arcane', text: 'Thassilonian stairs! Going down! Into the dark! Where the danger is!' },
  ],
  lower: [
    { who: 'healer', text: 'These two aren\'t goblins. Be careful.' },
  ],
  nualia_door: [
    { who: 'healer', text: 'She\'s in pain. You can see it, even through the madness.' },
    { who: 'hero', text: H('Nualia, it doesn\'t have to end like this.', 'Hey... we can still talk about this!', 'It ends here.', 'So you\'re the angel. Not what I pictured.') },
  ],
  nualia_after: [
    { who: 'healer', text: 'The claw is withering. Whatever held her is letting go.' },
  ],
  ending: [
    { who: 'tank', text: 'A Runelord. Waking up.' },
    { who: 'skirm', text: 'Can we go back to goblins? I liked goblins.' },
  ],
  epilogue: [
    { who: 'healer', text: 'Whatever comes next, we face it together.' },
    { who: 'tank', text: 'Aye. Together.' },
    { who: 'skirm', text: 'Group hug! Brannoc, you too!' },
    { who: 'hero', text: H('To Sandpoint, and to friends!', 'Best. Party. Ever.', '...fine. One hug.', 'Ugh. Fine. But nobody tells anyone.') },
  ],
};

// Campfire conversations at rest stops. Each needs all of its roles present.
export const CAMP = [
  [{ who: 'tank', text: 'Pip. Give it back.' }, { who: 'skirm', text: 'Give what back?' }, { who: 'tank', text: 'My coin purse.' }, { who: 'skirm', text: '...oh, THIS coin purse. Ha. Funny story.' }],
  [{ who: 'arcane', text: 'Tamsin, does Sarenrae have opinions on Thassilonian sin magic?' }, { who: 'healer', text: 'Very strong ones, Quillan.' }, { who: 'arcane', text: 'Wonderful! I\'ll take notes!' }, { who: 'healer', text: 'Please don\'t.' }],
  [{ who: 'healer', text: 'Brannoc, let me look at that arm.' }, { who: 'tank', text: 'It\'s fine.' }, { who: 'healer', text: 'It\'s bent the wrong way.' }, { who: 'tank', text: '...fine.' }],
  [{ who: 'skirm', text: 'Quillan, can you magic up some pie?' }, { who: 'arcane', text: 'That is not how conjuration works.' }, { who: 'skirm', text: 'Then what is the POINT of it?' }],
  [{ who: 'tank', text: 'Used to stand watch on the Sandpoint walls. Quiet nights.' }, { who: 'healer', text: 'Do you miss it?' }, { who: 'tank', text: 'No. This is better.' }],
  [{ who: 'arcane', text: 'Do you ever wonder what the Runelords were like? As people?' }, { who: 'skirm', text: 'Rich. Very, very rich.' }, { who: 'arcane', text: 'That\'s... actually historically accurate.' }],
  [{ who: 'hero', text: H('You all fought well today.', 'Today was scary, but kind of fun?', 'We got lucky today.', 'Nobody died. Low bar, but we cleared it.') }, { who: 'healer', text: 'We fought well together. That\'s what matters.' }, { who: 'tank', text: 'Aye.' }],
  [{ who: 'skirm', text: 'So, {hero}. Why\'d you really come to Sandpoint?' }, { who: 'hero', text: H('Because someone has to stand up for places like this.', 'Honestly? I heard about the pies.', 'Long story. Not tonight.', 'I lost a bet.') }, { who: 'skirm', text: 'Fair enough!' }],
  [{ who: 'healer', text: '{hero}, you look tired. Sleep. I\'ll take first watch.' }, { who: 'hero', text: H('Thank you, Tamsin. Wake me if anything stirs.', 'You\'re the best! Night, everyone!', '...thanks.', 'If a goblin eats me, I\'m blaming you.') }],
  [{ who: 'arcane', text: 'I translated another glyph! It says "greed"!' }, { who: 'tank', text: 'Great. Go to sleep.' }, { who: 'arcane', text: 'It also might say "soup." The dialect is tricky.' }],
  [{ who: 'skirm', text: 'Brannoc, do you ever smile?' }, { who: 'tank', text: 'Once. Didn\'t like it.' }, { who: 'skirm', text: 'I\'ll get you one day.' }],
  [{ who: 'healer', text: 'The Dawnflower teaches that even the darkest soul can be redeemed.' }, { who: 'hero', text: H('I hope she\'s right.', 'That\'s a nice thought!', 'Some can\'t.', 'Even goblins? Even Pip?') }, { who: 'skirm', text: 'Hey!' }],
];

// The hero personality picked by AI for the watch mode, by class.
export const DEFAULT_PERSONALITY = { fighter: 'heroic', barbarian: 'grim', paladin: 'heroic', ranger: 'grim', rogue: 'snarky', cleric: 'cheerful', wizard: 'cheerful', sorcerer: 'snarky' };

export function countLines() {
  let n = 0;
  for (const ev of Object.values(BARKS)) for (const l of Object.values(ev)) n += l.length;
  for (const l of Object.values(MONSTER_BARKS)) n += l.length;
  for (const sc of Object.values(SCENES)) for (const l of sc) n += typeof l.text === 'string' ? 1 : 4;
  for (const c of CAMP) for (const l of c) n += typeof l.text === 'string' ? 1 : 4;
  return n;
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function fill(text, vars) { return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m)); }

// Choose a bark line for a speaker key (companion name or personality) and event.
export function barkFor(event, speakerKey, vars = {}) {
  const pool = BARKS[event]?.[speakerKey];
  if (!pool || !pool.length) return null;
  return fill(pick(pool), vars);
}
export function monsterBark(key) {
  const pool = MONSTER_BARKS[key];
  return pool ? pick(pool) : null;
}

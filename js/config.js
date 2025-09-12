//config.js
export const WIN_CONDITION = {
    credits: 10000,
    moves: 1000
};
export const BOARD_RADIUS = 15;
export const HEX_SIZE = 28;

export const ITEMS = {
    'scrap': { name: 'Scrap Metal', basePrice: 27, size: 3, emoji: '⚙️' },
    'electronics': { name: 'Electronics', basePrice: 40, size: 1, emoji: '💻' },
    'medical': { name: 'Medical Supplies', basePrice: 55, size: 1, emoji: '💊' },
    'food': { name: 'Preserved Food', basePrice: 22, size: 2, emoji: '🥫' },
    'fuel': { name: 'Fuel Cells', basePrice: 47, size: 2, emoji: '🔋' },
    'purifier': { name: 'Water Purifier', basePrice: 175, size: 3, emoji: '💧' },
    'tuna': { name: 'Tuna Tins', basePrice: 80, size: 2, emoji: '🐟' },
    'robot': { name: 'Robot', basePrice: 275, size: 4, emoji: '🤖' },
    'catnip': { name: 'Catnip Extract', basePrice: 140, size: 1, emoji: '🌿', contraband: true },
    'laser': { name: 'Laser Pointer', basePrice: 105, size: 1, emoji: '🔴', contraband: true }
};
export const ITEM_KEYS = Object.keys(ITEMS);

export const SCENARIOS = [
    // Positive scenarios - good for early game
    { title: "The Glitched Sentry", text: "You find a twitching security robot, sparking and muttering about a hidden cache.", choices: [
        { text: "Salvage it", reward: { items: { 'scrap': 1, 'electronics': 1 } } },
        { text: "Reboot it (-1 Fuel Cell)", cost: { items: { 'fuel': 1 } }, reward: { credits: 250 }, condition: { items: { 'fuel': 1 } } }
    ]},
    { title: "The Collector's Item", text: "You find a perfectly preserved, pre-apocalypse can of tuna, a collector's item.", choices: [
        { text: "Sell it at the next town", reward: { credits: 350 } },
        { text: "Eat it for energy", reward: { storageMax: 1 } }
    ]},
    { title: "The Unmarked Crate", text: "You find a heavy, unmarked crate. Opening it will make noise.", choices: [
        { text: "Pry it open", reward: { storageMax: 3 } },
        { text: "Sell it sealed", reward: { credits: 200 } }
    ]},
    { title: "The Whispering Plant", text: "You find a rare, glowing plant. Local legends say it brings luck to those who leave an offering.", choices: [
        { text: "Harvest it", reward: { items: { 'medical': 2 } } },
        { text: "Leave offering (-1 Tuna)", cost: { items: { 'tuna': 1 } }, reward: { credits: 150 }, condition: { items: { 'tuna': 1 } } }
    ]},
    { title: "Abandoned Supply Cache", text: "You discover a hidden supply cache, apparently forgotten by some long-gone expedition.", choices: [
        { text: "Take the electronics", reward: { items: { 'electronics': 2 } } },
        { text: "Take the food supplies", reward: { items: { 'food': 2 } } }
    ]},
    { title: "Helpful Scavenger", text: "A friendly scavenger offers to share what they've found in exchange for a small favor.", choices: [
        { text: "Help them (+1 Scrap)", reward: { items: { 'scrap': 1, 'fuel': 1 } } },
        { text: "Trade knowledge", reward: { credits: 100 } }
    ]},
    // Mid-game scenarios with higher requirements
    { title: "The Outpost's Thirst", text: "A small settlement's water purifier is broken. They offer a staggering price for a replacement.", choices: [
        { text: "Sell yours (-1 Purifier)", cost: { items: { 'purifier': 1 } }, reward: { credits: 500 }, condition: { items: { 'purifier': 1 } } },
        { text: "Give it to them (-1 Purifier)", cost: { items: { 'purifier': 1 } }, reward: { storageMax: 2 }, condition: { items: { 'purifier': 1 } } }
    ]},
    { title: "A Suspicious Deal", text: "A shifty trader offers you a crate of 'valuable' electronics for cheap.", choices: [
        { text: "Buy the crate (-50c)", cost: { credits: 50 }, condition: { credits: 50 } },
        { text: "Negotiate (-25c)", cost: { credits: 25 }, condition: { credits: 25 } }
    ]},
    // Negative scenarios (some are forced choices)
    { title: "Alley Cat Ambush", text: "A gang of menacing Alley Cats corners you, demanding 'protection money'.", choices: [
        { text: "Distract them (-1 Laser)", cost: { items: { 'laser': 1 } }, condition: { items: { 'laser': 1 } } },
        { text: "Pay them (-100c)", cost: { credits: 100 }, condition: { credits: 100 } }
    ]},
    { title: "Cargo Malfunction", text: "Sparks fly from your cargo hold. A critical support has failed!", choices: [
        { text: "Jury-rig it (-1 Scrap)", cost: { items: { 'scrap': 1 } }, condition: { items: { 'scrap': 1 } } },
        { text: "Accept the loss", reward: { storageMax: -2 } }
    ]},
    { title: "Wasteland Toll", text: "A roadblock is manned by stern-looking enforcers. They demand a toll to pass.", choices: [
        { text: "Pay the toll (-50c)", cost: { credits: 50 }, condition: { credits: 50 } },
        { text: "Find another way", cost: { moves: -20 } }
    ]},
    { title: "Magnetic Storm", text: "A strange storm fries non-essential systems. You lose a random item.", choices: [
        { text: "Brace for impact", cost: { randomItem: 1 } },
        { text: "Take cover", cost: { randomItem: 1 } }
    ]}
];
//world.js
import {
    BOARD_RADIUS,
    ITEMS,
    ITEM_KEYS,
    SCENARIOS
} from './config.js';

export let hexGrid = new Map();
let settlements = [];
let roads = new Set();
let eventSpots = [];

// Utility function (specific to world generation)
function hexDist(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function hexInRange(center, range) {
    const results = [];
    for (let q = -range; q <= range; q++) {
        for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
            results.push({
                q: center.q + q,
                r: center.r + r
            });
        }
    }
    return results;
}

function generateSettlements() {
    const maxAttempts = 100;
    let attempts = 0;
    while (settlements.length < 10 && attempts < maxAttempts) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = 3 + Math.random() * (BOARD_RADIUS - 3);
        const q = Math.round(distance * Math.cos(angle));
        const r = Math.round(distance * Math.sin(angle));
        const pos = { q, r };
        if (settlements.every(s => hexDist(pos, s.pos) >= 4)) {
            settlements.push(createSettlement(pos, settlements.length));
        }
        attempts++;
    }
}

function createSettlement(pos, index) {
    const types = ['Mining', 'Agricultural', 'Tech Hub', 'Trading Post'];
    const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet'];
    const settlement = {
        pos,
        name: `${names[index]} ${types[index % types.length]}`,
        type: types[index % types.length],
        prices: {},
        desperateFor: ITEM_KEYS[Math.floor(Math.random() * ITEM_KEYS.length)],
        contraband: Math.random() > 0.6
    };
    ITEM_KEYS.forEach(itemKey => {
        const item = ITEMS[itemKey];
        let priceMultiplier = 0.7 + Math.random() * 0.6;
        if (settlement.type === 'Mining' && itemKey === 'food') priceMultiplier *= 1.5;
        if (settlement.type === 'Agricultural' && itemKey === 'electronics') priceMultiplier *= 1.4;
        if (settlement.type === 'Tech Hub' && itemKey === 'scrap') priceMultiplier *= 1.3;
        if (itemKey === settlement.desperateFor) priceMultiplier *= 3;
        settlement.prices[itemKey] = Math.round(item.basePrice * priceMultiplier);
    });
    return settlement;
}

function generateRoads() {
    for (let i = 0; i < settlements.length; i++) {
        for (let j = i + 1; j < settlements.length; j++) {
            if (hexDist(settlements[i].pos, settlements[j].pos) <= 10) {
                createRoad(settlements[i].pos, settlements[j].pos);
            }
        }
    }
}

function createRoad(start, end) {
    let current = {
        q: start.q,
        r: start.r
    };
    while (current.q !== end.q || current.r !== end.r) {
        roads.add(`${current.q},${current.r}`);
        if (current.q < end.q) current.q++;
        else if (current.q > end.q) current.q--;
        else if (current.r < end.r) current.r++;
        else if (current.r > end.r) current.r--;
    }
    roads.add(`${end.q},${end.r}`);
}

function createTerrain() {
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
        for (let r = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS); r <= Math.min(BOARD_RADIUS, -q + BOARD_RADIUS); r++) {
            const key = `${q},${r}`;
            let terrain = roads.has(key) ? 'road' : 'rough';
            const settlement = settlements.find(s => s.pos.q === q && s.pos.r === r);
            if (settlement) terrain = 'settlement';
            hexGrid.set(key, {
                coords: {
                    q,
                    r
                },
                terrain,
                settlement
            });
        }
    }
}

function placeEventSpots() {
    for (let i = 0; i < 40; i++) {
        const q = Math.floor(Math.random() * (2 * BOARD_RADIUS + 1)) - BOARD_RADIUS;
        const r = Math.floor(Math.random() * (2 * BOARD_RADIUS + 1)) - BOARD_RADIUS;
        if (hexGrid.get(`${q},${r}`)?.terrain === 'rough') {
            eventSpots.push({ q, r });
        }
    }
}

export function generateWorld() {
    hexGrid.clear();
    settlements = [];
    roads.clear();
    eventSpots = [];
    generateSettlements();
    generateRoads();
    createTerrain();
    placeEventSpots();
}

// --- World Data Accessors ---
export function getHex(pos) {
    return hexGrid.get(`${pos.q},${pos.r}`);
}

export function isEventSpot(pos) {
    return eventSpots.some(s => s.q === pos.q && s.r === pos.r);
}

export function removeEventSpot(pos) {
    eventSpots = eventSpots.filter(s => s.q !== pos.q || s.r !== pos.r);
}

export function getAvailableScenarios(player) {
    const isChoiceAvailable = (choice) => {
        if (!choice.condition) return true;
        if (choice.condition.credits && player.credits < choice.condition.credits) return false;
        if (choice.condition.items) {
            for (const itemKey in choice.condition.items) {
                if ((player.inventory.get(itemKey) || 0) < choice.condition.items[itemKey]) return false;
            }
        }
        return true;
    };

    const availableScenarios = SCENARIOS.filter(scenario =>
        scenario.choices.some(isChoiceAvailable)
    );

    const fallbackScenarios = SCENARIOS.filter(scenario =>
        scenario.choices.some(choice => !choice.condition)
    );

    return availableScenarios.length > 0 ? availableScenarios : fallbackScenarios;
}
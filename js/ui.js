//ui.js
import { ITEMS, ITEM_KEYS } from './config.js';

// UI Elements
const startScreen = document.getElementById('startScreen');
const winScreen = document.getElementById('winScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const townScreen = document.getElementById('townScreen');
const narrativeScreen = document.getElementById('narrativeScreen');
const gameContainer = document.getElementById('gameContainer');
const keypadButtons = document.querySelectorAll('.keypad-btn');
const choiceButtons = {
    A: document.getElementById('choiceA'),
    B: document.getElementById('choiceB'),
    C: document.getElementById('choiceC'),
};

export function initUI(startGameHandler, answerHandler, exitTownHandler, resolveChoiceHandler) {
    document.getElementById('startGameBtn').addEventListener('click', startGameHandler);
    document.getElementById('restartGameBtn').addEventListener('click', startGameHandler);
    document.getElementById('playAgainBtn').addEventListener('click', startGameHandler);
    document.getElementById('exitTownBtn').addEventListener('click', exitTownHandler);

    keypadButtons.forEach(button => {
        button.addEventListener('click', () => answerHandler(parseInt(button.dataset.value)));
    });

    document.addEventListener('keydown', (e) => {
        if (!gameContainer.style.display || gameContainer.style.display === 'none') return;
        if (e.key >= '1' && e.key <= '9') {
            answerHandler(parseInt(e.key));
        } else if (e.key === 'Escape' && townScreen.style.display === 'flex') {
            exitTownHandler();
        }
    });
    
    choiceButtons.A.addEventListener('click', () => resolveChoiceHandler(0));
    choiceButtons.B.addEventListener('click', () => resolveChoiceHandler(1));
    choiceButtons.C.addEventListener('click', () => resolveChoiceHandler(2));
}

// <-- NEW FUNCTION TO STYLE THE KEYPAD
export function updateKeypadLabels(validActions) {
    keypadButtons.forEach(btn => {
        btn.classList.remove('valid', 'settlement', 'event');
        const answer = parseInt(btn.dataset.value);
        const validAction = validActions.find(va => va.answer === answer);
        if (validAction) {
            btn.classList.add('valid');
            const { type } = validAction.action;
            if (type === 'settlement') btn.classList.add('settlement');
            else if (type === 'event') btn.classList.add('event');
        }
    });
}

export function updateUI(player, moves) {
    document.getElementById('credits').textContent = player.credits;
    document.getElementById('storageUsed').textContent = player.storageUsed;
    document.getElementById('storageMax').textContent = player.storageMax;
    document.getElementById('movesCount').textContent = moves;
    document.getElementById('position').textContent = `${player.pos.q},${player.pos.r}`;
    
    const townCreditsEl = document.getElementById('townUICredits');
    if (townScreen.style.display === 'flex') {
        townCreditsEl.textContent = player.credits;
    }
}

export function showFloatingText(text, pos, color) {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const gameRect = canvas.getBoundingClientRect();
    const element = document.createElement('div');
    element.className = 'floating-text';
    element.textContent = text;
    // Position it in the center of the canvas initially
    element.style.left = `${gameRect.left + gameRect.width / 2}px`;
    element.style.top = `${gameRect.top + gameRect.height / 2}px`;
    element.style.color = color || '#ffffff';
    // Append to the wrapper to avoid being clipped by canvas
    document.getElementById('game-wrapper').appendChild(element);
    setTimeout(() => element.remove(), 1500);
}


export function enterTownUI(settlement, player, buyHandler, sellHandler) {
    gameContainer.style.display = 'none';
    townScreen.style.display = 'flex';
    document.getElementById('townName').textContent = settlement.name;
    updateTownInterface(settlement, player, buyHandler, sellHandler);
}

export function exitTownUI() {
    townScreen.style.display = 'none';
    gameContainer.style.display = 'block';
}

function updateTownInterface(settlement, player, buyHandler, sellHandler) {
    const marketDiv = document.getElementById('marketPrices');
    marketDiv.innerHTML = '';
    ITEM_KEYS.forEach(itemKey => {
        const item = ITEMS[itemKey];
        const price = settlement.prices[itemKey];
        const playerAmount = player.inventory.get(itemKey) || 0;
        const isDesperate = itemKey === settlement.desperateFor;
        const priceClass = isDesperate ? 'price desperate' : 'price';
        const itemDiv = document.createElement('div');
        itemDiv.className = 'trade-item';

        let buttonsHTML = `<div class="item-actions">
            <span class="${priceClass}">${price}c</span>
            <button class="trade-btn buy-btn" data-item="${itemKey}" data-price="${price}">BUY</button>`;
        if (playerAmount > 0) {
            buttonsHTML += `<button class="trade-btn sell-btn" data-item="${itemKey}" data-price="${price}">SELL (${playerAmount})</button>`;
        }
        buttonsHTML += '</div>';

        itemDiv.innerHTML = `<div class="item-info">
            <span>${item.emoji}</span>
            <span>${item.name} ${item.contraband ? '⚠️' : ''}</span>
        </div>${buttonsHTML}`;
        marketDiv.appendChild(itemDiv);
    });
    marketDiv.querySelectorAll('.buy-btn').forEach(b => b.addEventListener('click', e => buyHandler(e.target.dataset.item, parseInt(e.target.dataset.price))));
    marketDiv.querySelectorAll('.sell-btn').forEach(b => b.addEventListener('click', e => sellHandler(e.target.dataset.item, parseInt(e.target.dataset.price))));
    updateInventoryDisplay(player);
    document.getElementById('townUICredits').textContent = player.credits;
}

function updateInventoryDisplay(player) {
    const inventoryDiv = document.getElementById('playerInventory');
    inventoryDiv.innerHTML = player.inventory.size === 0 ? '<div style="grid-column: 1/-1; text-align: center; color: #888;">Empty</div>' : '';
    player.inventory.forEach((amount, itemKey) => {
        if (amount > 0) {
            const item = ITEMS[itemKey];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.innerHTML = `<div class="quantity">x${amount}</div><div class="emoji">${item.emoji}</div><div class="name">${item.name}</div>`;
            inventoryDiv.appendChild(itemDiv);
        }
    });
    document.getElementById('inventorySpace').textContent = `${player.storageUsed}/${player.storageMax}`;
}

function isChoiceAvailable(choice, player) {
    if (!choice.condition) return true;
    if (choice.condition.credits && player.credits < choice.condition.credits) return false;
    if (choice.condition.items) {
        for (const itemKey in choice.condition.items) {
            if ((player.inventory.get(itemKey) || 0) < choice.condition.items[itemKey]) return false;
        }
    }
    return true;
}

export function showNarrativeScreen(scenario, player) {
    document.getElementById('narrativeTitle').textContent = scenario.title;
    document.getElementById('narrativeText').textContent = scenario.text;
    
    const choices = scenario.choices;
    choiceButtons.A.textContent = choices[0].text;
    choiceButtons.A.disabled = !isChoiceAvailable(choices[0], player);
    choiceButtons.A.style.display = 'block';
    
    if (choices[1]) {
        choiceButtons.B.textContent = choices[1].text;
        choiceButtons.B.disabled = !isChoiceAvailable(choices[1], player);
        choiceButtons.B.style.display = 'block';
    } else {
        choiceButtons.B.style.display = 'none';
    }
    
    choiceButtons.C.style.display = 'none';
    narrativeScreen.style.display = 'flex';
}

export function hideAllScreens() {
    startScreen.style.display = 'none'; 
    winScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    townScreen.style.display = 'none';
    narrativeScreen.style.display = 'none';
}


export function showWinScreen(player) {
    document.getElementById('winCredits').textContent = player.credits;
    gameContainer.style.display = 'none';
    winScreen.style.display = 'flex';
}

export function showGameOverScreen(player) {
    document.getElementById('finalCredits').textContent = player.credits;
    gameContainer.style.display = 'none';
    gameOverScreen.style.display = 'flex';
}
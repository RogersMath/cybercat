//main.js
import { ITEMS, WIN_CONDITION } from './config.js';
import { 
    initUI, 
    updateUI, 
    updateKeypadLabels,
    showNarrativeScreen, 
    enterTownUI, 
    exitTownUI, 
    showWinScreen, 
    showGameOverScreen, 
    hideAllScreens, 
    showFloatingText 
} from './ui.js';
import { generateWorld, getHex, isEventSpot, removeEventSpot, getAvailableScenarios } from './world.js';
import { initRenderer, render } from './render.js';
import { initAudio, playMusic, playSound } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
    // Game state
    let gameRunning = false;
    let currentView = 'world';
    let moves = 0;
    let player = {};
    let validActions = [];
    let currentSettlement = null;
    let currentScenario = null;

    // Initialize modules
    initUI(handleStartGame, handleAnswer, handleExitTown, handleResolveChoice);
    initRenderer(getGameState);
    
    function getGameState() {
        return { gameRunning, currentView, player, validActions };
    }

    function handleStartGame() {
        // This is our user-interaction moment. Initialize and unlock the AudioContext.
        initAudio(); 
        
        // Now that the context is (hopefully) running, we can play music.
        playMusic();

        player = { pos: { q: 0, r: 0 }, credits: 50, inventory: new Map(), storageUsed: 0, storageMax: 10 };
        moves = 0;
        gameRunning = true;
        currentView = 'world';

        hideAllScreens();
        document.getElementById('gameContainer').style.display = 'block';

        generateWorld();
        generateValidActions();
        updateUI(player, moves);
        render();
    }

    function generateExpression(targetAnswer) {
        const difficulty = Math.random();
        if (difficulty < 0.4) {
            if (Math.random() > 0.5) { const a = Math.floor(Math.random() * (targetAnswer - 1)) + 1; return `${a}+${targetAnswer - a}`; } else { const a = targetAnswer + Math.floor(Math.random() * 8) + 1; return `${a}-${a - targetAnswer}`; }
        } else if (difficulty < 0.8) {
            for (let i = 2; i <= Math.sqrt(targetAnswer); i++) { if (targetAnswer % i === 0 && targetAnswer / i <= 9) return `${i}x${targetAnswer / i}`; }
            const divisor = Math.floor(Math.random() * 8) + 2; return `${targetAnswer * divisor}/${divisor}`;
        } else {
            const a = Math.floor(Math.random() * 3) + 2; const b = Math.floor(Math.random() * 3) + 1; const c = targetAnswer - (a * b);
            if (c >= 0 && c <= 9) return `${a}x${b}+${c}`; const x = Math.floor(Math.random() * (targetAnswer - 1)) + 1; return `${x}+${targetAnswer - x}`;
        }
    }

    function generateValidActions() {
        validActions = [];
        const possibleActions = [];
        const HEX_DIRS = [ { q: 1, r: -1 }, { q: 0, r: -1 }, { q: -1, r: 0 }, { q: 1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 } ];
        
        HEX_DIRS.forEach(dir => {
            const newPos = { q: player.pos.q + dir.q, r: player.pos.r + dir.r };
            const hex = getHex(newPos);
            if (hex) {
                let actionType = 'move';
                if (hex.settlement) actionType = 'settlement';
                else if (isEventSpot(newPos)) actionType = 'event';
                possibleActions.push({ type: actionType, pos: newPos, target: hex.settlement });
            }
        });

        const availableAnswers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        possibleActions.slice(0, 9).forEach((action, index) => {
            validActions.push({ answer: availableAnswers[index], expression: generateExpression(availableAnswers[index]), action });
        });
        
        updateKeypadLabels(validActions);
    }

    function handleAnswer(answer) {
        if (!gameRunning || currentView !== 'world') return;
        const validAction = validActions.find(va => va.answer === answer);
        if (!validAction) {
            showFloatingText('Wrong!', player.pos, '#ff4444');
            playSound('error');
            return;
        }

        executeAction(validAction.action);
        moves++;
        updateUI(player, moves);

        if (moves >= WIN_CONDITION.moves && player.credits < WIN_CONDITION.credits) {
            gameOver();
        } else if (currentView === 'world') {
            generateValidActions();
            render();
        }
    }

    function executeAction(action) {
        player.pos = action.pos;
        showFloatingText('Moved', action.pos, '#6bff73');
        playSound('move');

        switch (action.type) {
            case 'settlement':
                enterTown(action.target);
                break;
            case 'event':
                triggerNarrativeEvent(action.pos);
                break;
        }
    }

    function triggerNarrativeEvent(pos) {
        removeEventSpot(pos);
        currentView = 'narrative';
        playSound('event');

        const scenarioPool = getAvailableScenarios(player);
        currentScenario = scenarioPool[Math.floor(Math.random() * scenarioPool.length)];
        showNarrativeScreen(currentScenario, player);
    }

    function handleResolveChoice(choiceIndex) {
        const choice = currentScenario.choices[choiceIndex];
        if (!choice) return;

        let outcomeText = '';
        if (choice.cost) {
            if (choice.cost.credits) { player.credits -= choice.cost.credits; outcomeText += `-${choice.cost.credits}c `; }
            if (choice.cost.moves) { moves -= choice.cost.moves; outcomeText += `${choice.cost.moves > 0 ? '-' : '+'}${Math.abs(choice.cost.moves)} moves `; }
            if (choice.cost.items) {
                for (const itemKey in choice.cost.items) {
                    const amount = choice.cost.items[itemKey];
                    player.inventory.set(itemKey, (player.inventory.get(itemKey) || 0) - amount);
                    player.storageUsed -= ITEMS[itemKey].size * amount;
                    if (player.inventory.get(itemKey) <= 0) player.inventory.delete(itemKey);
                    outcomeText += `-${amount} ${ITEMS[itemKey].name} `;
                }
            }
            if (choice.cost.randomItem && player.inventory.size > 0) {
                const inventoryKeys = Array.from(player.inventory.keys());
                const itemToLose = inventoryKeys[Math.floor(Math.random() * inventoryKeys.length)];
                player.inventory.set(itemToLose, player.inventory.get(itemToLose) - 1);
                player.storageUsed -= ITEMS[itemToLose].size;
                outcomeText += `Lost 1 ${ITEMS[itemToLose].name}! `;
                if (player.inventory.get(itemToLose) === 0) player.inventory.delete(itemToLose);
            }
        }
        if (choice.reward) {
            if (choice.reward.credits) { player.credits += choice.reward.credits; if (choice.reward.credits > 0) outcomeText += `+${choice.reward.credits}c `; }
            if (choice.reward.storageMax) { player.storageMax = Math.max(1, player.storageMax + choice.reward.storageMax); outcomeText += `${choice.reward.storageMax > 0 ? '+' : ''}${choice.reward.storageMax} Max Storage `; }
            if (choice.reward.items) {
                for (const itemKey in choice.reward.items) {
                    const amount = choice.reward.items[itemKey];
                    const item = ITEMS[itemKey];
                    if (player.storageUsed + (item.size * amount) <= player.storageMax) {
                        player.inventory.set(itemKey, (player.inventory.get(itemKey) || 0) + amount);
                        player.storageUsed += item.size * amount;
                        outcomeText += `+${amount} ${item.name} `;
                    } else { outcomeText += 'Storage Full! '; }
                }
            }
        }
        showFloatingText(outcomeText.trim(), player.pos, '#ffaa00');

        if (currentScenario.title === "A Suspicious Deal") {
            if (Math.random() > 0.6) {
                player.credits += 150;
                showFloatingText("+150c! A lucky find!", player.pos, '#6bff73');
            } else {
                showFloatingText("It was just junk!", player.pos, '#ff4444');
            }
        }

        document.getElementById('narrativeScreen').style.display = 'none';
        currentView = 'world';
        currentScenario = null;
        updateUI(player, moves);
        generateValidActions();
        render();
    }

    function enterTown(settlement) {
        currentView = 'town';
        currentSettlement = settlement;
        playSound('town');

        const hasContraband = (player.inventory.get('catnip') || 0) > 0 || (player.inventory.get('laser') || 0) > 0;
        if (hasContraband && !settlement.contraband && Math.random() < 0.3) {
            let fine = 200;
            ['catnip', 'laser'].forEach(key => {
                const amount = player.inventory.get(key) || 0;
                if (amount > 0) {
                    player.storageUsed -= amount * ITEMS[key].size;
                    player.inventory.delete(key);
                }
            });
            player.credits = Math.max(0, player.credits - fine);
            alert(`CONTRABAND SEIZED! You were fined ${fine} credits.`);
        }
        
        enterTownUI(settlement, player, handleBuyItem, handleSellItem);
    }
    
    function handleExitTown() {
        currentView = 'world';
        currentSettlement = null;
        exitTownUI();
        generateValidActions();
        render();
    }
    
    function handleBuyItem(itemKey, price) {
        const item = ITEMS[itemKey];
        if (player.credits < price) {
            playSound('error');
            return alert("Not enough credits!");
        }
        if (player.storageUsed + item.size > player.storageMax) {
            playSound('error');
            return alert("Not enough storage space!");
        }
        player.credits -= price;
        player.storageUsed += item.size;
        player.inventory.set(itemKey, (player.inventory.get(itemKey) || 0) + 1);
        playSound('buy');
        enterTownUI(currentSettlement, player, handleBuyItem, handleSellItem);
        updateUI(player, moves);
    }

    function handleSellItem(itemKey, price) {
        const item = ITEMS[itemKey];
        player.inventory.set(itemKey, player.inventory.get(itemKey) - 1);
        player.storageUsed -= item.size;
        player.credits += price;
        if (player.inventory.get(itemKey) === 0) player.inventory.delete(itemKey);
        playSound('sell');
        
        enterTownUI(currentSettlement, player, handleBuyItem, handleSellItem);
        updateUI(player, moves);

        if (player.credits >= WIN_CONDITION.credits) {
            winGame();
        }
    }

    function winGame() {
        gameRunning = false;
        showWinScreen(player);
    }

    function gameOver() {
        gameRunning = false;
        showGameOverScreen(player);
    }
});
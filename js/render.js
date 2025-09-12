//render.js
import {
    HEX_SIZE
} from './config.js';
import {
    hexGrid,
    isEventSpot,
    hexInRange
} from './world.js';

let canvas, ctx;
let getGameState;

export function initRenderer(gameStateCallback) {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    getGameState = gameStateCallback;
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

function resizeCanvas() {
    if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        render(); // Re-render on resize
    }
}

function axialToPixel(hex, playerPos) {
    if (!canvas) return { x: 0, y: 0 };
    const relQ = hex.q - playerPos.q;
    const relR = hex.r - playerPos.r;
    const x = HEX_SIZE * (3 / 2 * relQ);
    const y = HEX_SIZE * (Math.sqrt(3) / 2 * (relQ + 2 * relR));
    return {
        x: x + canvas.width / 2,
        y: y + canvas.height / 2
    };
}

function drawHex(center, size, fillColor, strokeColor, lineWidth) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const x = center.x + size * Math.cos(angle);
        const y = center.y + size * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.strokeStyle = strokeColor || '#6bff73';
    ctx.lineWidth = lineWidth || 1;
    ctx.stroke();
}

function drawExpression(expression, center, color) {
    ctx.font = `${HEX_SIZE * 0.5}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 3;
    ctx.fillText(expression, center.x, center.y);
    ctx.shadowBlur = 0;
}

export function render() {
    const {
        gameRunning,
        currentView,
        player,
        validActions
    } = getGameState();

    if (!gameRunning || currentView !== 'world' || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hexInRange(player.pos, 6).forEach(hexPos => {
        const hex = hexGrid.get(`${hexPos.q},${hexPos.r}`);
        if (!hex) return;

        const pixel = axialToPixel(hexPos, player.pos);
        const isPlayer = hexPos.q === player.pos.q && hexPos.r === player.pos.r;

        let fillColor = '#2a2a1a',
            strokeColor = '#6bff73',
            lineWidth = 1;
        if (hex.terrain === 'road') fillColor = '#4a4a2a';
        else if (hex.terrain === 'settlement') {
            fillColor = '#2a4a4a';
            strokeColor = '#ffaa00';
            lineWidth = 2;
        }

        if (isPlayer) {
            strokeColor = '#ff6b73';
            lineWidth = 3;
            ctx.shadowColor = '#ff6b73';
            ctx.shadowBlur = 10;
        }

        drawHex(pixel, HEX_SIZE - 1, fillColor, strokeColor, lineWidth);
        ctx.shadowBlur = 0;

        const validAction = validActions.find(va => va.action.pos.q === hexPos.q && va.action.pos.r === hexPos.r);
        if (!isPlayer && validAction) {
            drawExpression(validAction.expression, pixel, '#ffffff');
        }

        ctx.font = `${HEX_SIZE * 0.8}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (hex.terrain === 'settlement') {
            ctx.fillStyle = '#ffaa00';
            ctx.fillText('🏘️', pixel.x, pixel.y);
        } else if (isEventSpot(hexPos)) {
            ctx.fillStyle = '#aa00ff';
            ctx.fillText('❓', pixel.x, pixel.y);
        }

        if (isPlayer) {
            ctx.font = `${HEX_SIZE * 1.0}px monospace`;
            ctx.fillStyle = '#ffffff';
            ctx.fillText('🐈‍⬛', pixel.x, pixel.y);
        }
    });

    requestAnimationFrame(render);
}
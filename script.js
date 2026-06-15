/**
 * Mathyrinth: Escape del Guardián Desvanecido
 * Código del Núcleo del Sistema - Versión PC (Máx 10 Equipos + Sistema de Muertes)
 */

// Detector de errores general
window.onerror = function(msg, url, linenumber) {
    alert('❌ ¡Error en el juego!\n\nDetalle: ' + msg + '\nLínea: ' + linenumber);
    return false;
};

// ==========================================
// BANCO DE ECUACIONES PERSONALIZABLES
// ==========================================
const BANCO_ECUACIONES = {
    easy: [
        { expression: "X + 35 = -19", result: -54 },
        { expression: "A + (-12) = 16", result: 28 },
        { expression: "3x + 2 = 32", result: 10 },
        { expression: "X : 5 = 16", result: 80 },
        { expression: "2x + 8 = 440", result: 216 },
        { expression: "9x + 9 = 900", result: 99 },
        { expression: "7x - 4 = 171", result: 25 },
        { expression: "4x + 7 = 51", result: 11 },
        { expression: "5x - 12 = 43", result: 11 },
        { expression: "12x - 24 = 120", result: 12 },
        { expression: "2x - 20 = 18", result: 19 },
        { expression: "8x + 16 = 200", result: 23 },
        { expression: "3(x - 4) = 48", result: 20 },
        { expression: "4(x + 5) = 60", result: 10 },
        { expression: "6x + 14 = 98", result: 14 },
        { expression: "3x + 25 = 100", result: 25 },
        { expression: "7x - 9 = 75", result: 12 }
    ],
    medium: [
        { expression: "2x + 4 = x + 10", result: 6 },
        { expression: "3(x - 1) = 9", result: 4 },
        { expression: "x^2 - 4 = 0 (Positivo)", result: 2 },
        { expression: "2x / 3 = 6", result: 9 },
        { expression: "5x - 7 = 3x + 1", result: 4 },
        { expression: "10 - 2x = 4", result: 3 }
    ],
    hard: [
        { expression: "2(x + 3) - 5 = 3(x - 1)", result: 4 },
        { expression: "x/2 + x/3 = 5", result: 6 },
        { expression: "3x + 5 = 2x - 7", result: -12 },
        { expression: "(2x - 4) / 2 = x - 2", result: 0 },
        { expression: "x^2 - 5x + 6 = 0 (Mayor)", result: 3 },
        { expression: "4x - (x + 2) = 10", result: 4 }
    ]
};

const CONFIG = {
    mapSize: 6,               
    maxRounds: 20,            
    probabilidadEvento: 0.65, 
    probabilidadPuertaBloq: 0.25, 
    probabilidadEliminacion: 0.05 
};

// Array de muertes aleatorias para el modal
const CAUSAS_MUERTE = [
    "cayéndose por las escaleras",
    "devorado por las sombras",
    "al activar una trampa de pinchos",
    "por un paro cardíaco del puro susto",
    "aplastado por un derrumbe del techo",
    "al inhalar una espora tóxica",
    "arrastrado por algo en la oscuridad"
];

let gameState = {
    difficulty: 'medium',
    totalTeams: 2,
    teams: [],
    map: {},
    round: 1,
    currentPhase: 'math', 
    priorityQueue: [],    
    currentMovementIndex: 0, 
    ghost: {
        roomKey: null,
        active: false,
        status: "Inactivo"
    },
    logs: [],
    startRoomKey: "0,0",
    exitRoomKey: "5,5" 
};

// ==========================================
// BANCO DE EVENTOS AMPLIADO
// ==========================================
const EVENT_TEMPLATES = [
    { type: 'item', text: "🗝️ {player} encontró una llave tirada entre los escombros.", action: (team) => { team.keys++; } },
    { type: 'item', text: "🔦 {player} encontró una linterna funcional.", action: (team) => { team.items.push("Linterna"); } },
    { type: 'item', text: "🧭 {player} encontró un mapa antiguo manchado.", action: (team) => { team.items.push("Mapa"); } },
    { type: 'buff', text: "🚪 {player} descubrió un pasadizo secreto.", action: (team) => { team.items.push("Pasadizo"); } },
    { type: 'buff', text: "⚡ {player} recuperó el aliento súbitamente, dando ánimos al equipo.", action: (team) => { } },
    { type: 'debuff', text: "😨 {player} entró en pánico tras escuchar susurros a sus espaldas.", action: (team) => { } },
    { type: 'debuff', text: "🕸️ {player} quedó atrapado en telarañas gigantes.", action: (team) => { } },
    { type: 'block', text: "🐕 Una manada de perros salvajes gruñe cerca en la oscuridad.", action: (team) => { } },
    { type: 'block', text: "📚 Una estantería caída impide avanzar con rapidez.", action: (team) => { } },
    { type: 'block', text: "🔥 Un incendio fatuo bloquea el paso temporalmente.", action: (team) => { } },
    { type: 'debuff', text: "🌫️ La niebla se condensa repentinamente, no se ve nada.", action: (team) => { } },
    { type: 'item', text: "🗝️ {player} revisó el bolsillo de una estatua y halló una llave oculta.", action: (team) => { team.keys++; } },
    { type: 'item', text: "🧮 {player} descubrió un viejo ábaco. ¡Se sienten más inteligentes!", action: (team) => { team.items.push("Abaco"); } },
    { type: 'buff', text: "💡 {player} tuvo una epifanía matemática y guio al grupo.", action: (team) => { } },
    { type: 'buff', text: "🛡️ {player} encontró un escudo antiguo. Da sensación de seguridad.", action: (team) => { team.items.push("Escudo"); } },
    { type: 'debuff', text: "🦇 Un enjambre de murciélagos rozó a {player}, causándole terror.", action: (team) => { } },
    { type: 'debuff', text: "🐀 {player} pegó un grito al ver pasar una rata del tamaño de un gato.", action: (team) => { } },
    { type: 'debuff', text: "🥶 Una corriente de aire helado congeló hasta los huesos a {player}.", action: (team) => { } },
    { type: 'block', text: "🪨 Un leve derrumbe del techo asustó a {player} y los retrasó.", action: (team) => { } },
    { type: 'block', text: "🚪 La puerta chirrió tan fuerte que aturdió a {player}.", action: (team) => { } },
    { type: 'debuff', text: "💧 Una gota de agua sucia cayó justo en el ojo de {player}.", action: (team) => { } }
];

const DOM = {
    setupScreen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    endScreen: document.getElementById('end-screen'),
    btnNextSetup: document.getElementById('btn-next-setup'),
    btnStartGame: document.getElementById('btn-start-game'),
    teamsCountInput: document.getElementById('teams-count'),
    difficultySelect: document.getElementById('difficulty-select'),
    teamsDetailsContainer: document.getElementById('teams-details-container'),
    teamsInputsWrapper: document.getElementById('teams-inputs-wrapper'),
    displayRound: document.getElementById('display-round'),
    suddenDeathBadge: document.getElementById('sudden-death-badge'),
    ghostStatusBar: document.getElementById('ghost-status-bar'),
    phaseIndicator: document.getElementById('action-phase-indicator'),
    teamsGameCards: document.getElementById('teams-game-cards'),
    btnAdvancePhase: document.getElementById('btn-advance-phase'),
    dungeonMap: document.getElementById('dungeon-map'),
    currentMovingTeamTxt: document.getElementById('current-moving-team-txt'),
    moveErrorMsg: document.getElementById('move-error-msg'),
    eventLog: document.getElementById('event-log'),
    priorityListDisplay: document.getElementById('priority-list-display'),
    endTitle: document.getElementById('end-title'),
    endStatsContent: document.getElementById('end-stats-content'),
    dirButtons: document.querySelectorAll('.btn-dir'),
    // Elementos del Modal de Muerte
    deathModal: document.getElementById('death-modal'),
    deathTeamName: document.getElementById('death-team-name'),
    deathPlayerName: document.getElementById('death-player-name'),
    deathCause: document.getElementById('death-cause'),
    btnCloseDeathModal: document.getElementById('btn-close-death-modal')
};

// --- LISTENERS MODAL DE MUERTE ---
DOM.btnCloseDeathModal.addEventListener('click', () => {
    DOM.deathModal.classList.add('hidden');
});

function showDeathScreen(teamName, playerName) {
    const randomCause = CAUSAS_MUERTE[Math.floor(Math.random() * CAUSAS_MUERTE.length)];
    DOM.deathTeamName.innerText = `[${teamName}]`;
    DOM.deathPlayerName.innerText = playerName;
    DOM.deathCause.innerText = randomCause;
    DOM.deathModal.classList.remove('hidden');
}

// --- LISTENERS CONFIGURACIÓN ---
DOM.btnNextSetup.addEventListener('click', () => {
    const count = parseInt(DOM.teamsCountInput.value);
    if (count < 2 || count > 10) {
        alert("Soporta únicamente de 2 a 10 equipos simultáneos.");
        return;
    }
    gameState.totalTeams = count;
    DOM.teamsInputsWrapper.innerHTML = "";
    for (let i = 1; i <= count; i++) {
        const block = document.createElement('div');
        block.className = "team-setup-block";
        block.innerHTML = `
            <div class="form-group">
                <label>Nombre del Equipo ${i}:</label>
                <input type="text" id="setup-team-name-${i}" value="Equipo ${i}" required>
            </div>
            <div class="form-group">
                <label>Cantidad de Integrantes (3-5):</label>
                <input type="number" id="setup-team-size-${i}" min="3" max="5" value="3" class="team-size-trigger" data-index="${i}">
            </div>
            <div id="members-names-area-${i}"></div>
        `;
        DOM.teamsInputsWrapper.appendChild(block);
        renderMembersInputs(i, 3);
        block.querySelector('.team-size-trigger').addEventListener('change', (e) => {
            const size = parseInt(e.target.value);
            const idx = e.target.dataset.index;
            renderMembersInputs(idx, size);
        });
    }
    DOM.teamsDetailsContainer.classList.remove('hidden');
});

function renderMembersInputs(teamIdx, size) {
    const area = document.getElementById(`members-names-area-${teamIdx}`);
    area.innerHTML = "";
    if (size < 3) size = 3;
    if (size > 5) size = 5;
    for (let m = 1; m <= size; m++) {
        area.innerHTML += `
            <div class="form-group" style="margin-left: 20px;">
                <input type="text" id="setup-team-${teamIdx}-mem-${m}" value="Miembro ${m}" placeholder="Nombre integrante ${m}" required>
            </div>
        `;
    }
}

// --- BOTÓN TRIGGER JUEGO ---
DOM.btnStartGame.addEventListener('click', () => {
    gameState.difficulty = DOM.difficultySelect.value;
    gameState.teams = [];
    gameState.exitRoomKey = `${CONFIG.mapSize - 1},${CONFIG.mapSize - 1}`;

    for (let i = 1; i <= gameState.totalTeams; i++) {
        const teamName = document.getElementById(`setup-team-name-${i}`).value.trim() || `Equipo ${i}`;
        const size = parseInt(document.getElementById(`setup-team-size-${i}`).value);
        let membersArray = [];
        for (let m = 1; m <= size; m++) {
            const nameEl = document.getElementById(`setup-team-${i}-mem-${m}`);
            if (nameEl) {
                membersArray.push({ name: nameEl.value.trim() || `Miembro ${m}`, alive: true });
            }
        }
        gameState.teams.push({
            id: i - 1, name: teamName, members: membersArray, currentRoomKey: gameState.startRoomKey,
            keys: 0, items: [], mathSolvedCount: 0, mathState: 'hidden', currentEquation: null,
            hasAnsweredThisRound: false, answeredCorrectly: false
        });
    }
    buildProceduralDungeon();
    gameState.round = 1;
    gameState.currentPhase = 'math';
    gameState.priorityQueue = [];
    gameState.map[gameState.startRoomKey].visited = true;
    DOM.setupScreen.classList.add('hidden');
    DOM.gameScreen.classList.remove('hidden');
    logEvent("🏰 ¡Bienvenidos a Mathyrinth! Los equipos están atrapados en la entrada.");
    startMathPhase();
});

function buildProceduralDungeon() {
    gameState.map = {};
    const size = CONFIG.mapSize;
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const key = `${x},${y}`;
            gameState.map[key] = {
                x: x, y: y, type: 'normal',
                connections: { N: null, S: null, E: null, O: null },
                doorLocks: { N: false, S: false, E: false, O: false },
                visited: false, specialChallenge: null
            };
        }
    }
    gameState.map[gameState.startRoomKey].type = 'start';
    gameState.map[gameState.exitRoomKey].type = 'exit';
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const currentKey = `${x},${y}`;
            if (x < size - 1) {
                const nextKey = `${x+1},${y}`;
                if (Math.random() > 0.35 || (y === size - 1)) {
                    gameState.map[currentKey].connections.E = nextKey;
                    gameState.map[nextKey].connections.O = currentKey;
                }
            }
            if (y < size - 1) {
                const nextKey = `${x},${y+1}`;
                if (Math.random() > 0.35 || (x === size - 1)) {
                    gameState.map[currentKey].connections.S = nextKey;
                    gameState.map[nextKey].connections.N = currentKey;
                }
            }
        }
    }
    
    for(let i=0; i<size-1; i++){
        gameState.map[`${i},0`].connections.E = `${i+1},0`;
        gameState.map[`${i+1},0`].connections.O = `${i},0`;
        gameState.map[`${size-1},${i}`].connections.S = `${size-1},${i+1}`;
        gameState.map[`${size-1},${i+1}`].connections.N = `${size-1},${i}`;
    }
    
    const secretKey = "1,2";
    if (gameState.map[secretKey]) {
        gameState.map[secretKey].type = 'secret';
        const origin = "1,1";
        gameState.map[origin].connections.S = secretKey;
        gameState.map[secretKey].connections.N = origin;
        gameState.map[origin].doorLocks.S = "mecanismo"; 
    }
    for (let key in gameState.map) {
        let room = gameState.map[key];
        if (room.type === 'normal' && Math.random() < CONFIG.probabilidadPuertaBloq) {
            if (room.connections.E) {
                room.doorLocks.E = Math.random() > 0.5 ? "llave" : "ecuacion";
                let target = gameState.map[room.connections.E];
                if(target) target.doorLocks.O = room.doorLocks.E;
            }
        }
    }
}

function fetchManualEquation(difficulty) {
    const pool = BANCO_ECUACIONES[difficulty] || BANCO_ECUACIONES['medium'];
    const randomIndex = Math.floor(Math.random() * pool.length);
    const eq = pool[randomIndex];
    return { expression: eq.expression, result: eq.result };
}

function startMathPhase() {
    gameState.currentPhase = 'math';
    gameState.priorityQueue = [];
    DOM.phaseIndicator.innerText = "Fase: Resolución de Ecuaciones";
    DOM.phaseIndicator.style.background = "#3b0764";
    DOM.btnAdvancePhase.innerText = "Pasar a Fase de Movimiento";
    DOM.currentMovingTeamTxt.innerText = "Esperando que el árbitro procese las respuestas...";
    gameState.teams.forEach(team => {
        if (isTeamAlive(team)) {
            team.hasAnsweredThisRound = false;
            team.answeredCorrectly = false;
            team.currentEquation = fetchManualEquation(gameState.difficulty);
            team.mathState = 'hidden'; 
        }
    });
    renderTeamsControlPanel();
    updatePriorityListDisplay();
    renderDungeonMap();
}

function startMovementPhase() {
    if (gameState.priorityQueue.length === 0) {
        logEvent("🔔 Ningún equipo avanzó esta ronda. Turno del Guardián.");
        endRound();
        return;
    }
    gameState.currentPhase = 'movement';
    DOM.phaseIndicator.innerText = "Fase: Movimiento Estratégico (Usá las flechas o WASD)";
    DOM.phaseIndicator.style.background = "#15803d";
    DOM.btnAdvancePhase.innerText = "Terminar Ronda de Movimientos";
    gameState.currentMovementIndex = 0;
    selectTeamForMovement(gameState.priorityQueue[0]);
    renderDungeonMap();
}

function selectTeamForMovement(teamId) {
    const team = gameState.teams[teamId];
    DOM.currentMovingTeamTxt.innerHTML = `Moviendo ahora: <strong style='color:#c084fc;'>${team.name}</strong>`;
    DOM.moveErrorMsg.innerText = "";
    document.querySelectorAll('.team-game-card').forEach(c => c.classList.remove('priority-active'));
    const activeCard = document.getElementById(`game-card-${teamId}`);
    if (activeCard) activeCard.classList.add('priority-active');
}

function renderTeamsControlPanel() {
    DOM.teamsGameCards.innerHTML = "";
    gameState.teams.forEach(team => {
        if (!isTeamAlive(team)) {
            DOM.teamsGameCards.innerHTML += `
                <div class="team-game-card" style="opacity: 0.4; border-left: 4px solid var(--danger);">
                    <div class="team-card-header"><span class="team-name-title">💀 ${team.name}</span><span class="badge" style="background: var(--danger)">ELIMINADO</span></div>
                </div>`;
            return;
        }
        const card = document.createElement('div');
        card.className = "team-game-card";
        card.id = `game-card-${team.id}`;
        card.style.borderLeft = `4px solid var(--accent)`;
        let membersHTML = "";
        team.members.forEach(m => { membersHTML += `<span class="member-tag ${m.alive ? 'alive':'dead'}">${m.alive ? '👤':'💀'} ${m.name}</span>`; });
        let mathHTML = "";
        if (gameState.currentPhase === 'math') {
            if (team.hasAnsweredThisRound) {
                mathHTML = `<p style="color:${team.answeredCorrectly ? 'var(--success)':'var(--danger)'}; font-weight:bold;">${team.answeredCorrectly ? '✅ Correcto' : '❌ Incorrecto'}</p>`;
            } else {
                if (team.mathState === 'hidden') {
                    mathHTML = `<div class="math-control-box"><p style="text-align:center; font-style:italic; font-size:0.85rem;">Ecuación lista en papel</p><div class="math-actions"><button class="btn-primary" onclick="setTeamMathState(${team.id}, 'shown')">Mostrar</button></div></div>`;
                } else if (team.mathState === 'shown') {
                    mathHTML = `<div class="math-control-box"><div class="equation-text">${team.currentEquation.expression}</div><div class="math-actions"><button class="btn-warning" onclick="setTeamMathState(${team.id}, 'hidden')">Ocultar</button><button class="btn-success" onclick="setTeamMathState(${team.id}, 'input')">Resolver</button></div></div>`;
                } else if (team.mathState === 'input') {
                    mathHTML = `<div class="math-control-box"><div class="equation-text" style="font-size:0.95rem;">Resultado esperado</div><div class="inputs-row"><input type="number" id="math-ans-input-${team.id}" placeholder="Resultado"><button class="btn-success" onclick="submitTeamAnswer(${team.id})">OK</button></div><button class="btn-danger full-width" style="margin-top:5px; padding:3px;" onclick="submitTeamFail(${team.id})">Marcar Fallido</button></div>`;
                }
            }
        } else {
            mathHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">Llaves: 🔑 x${team.keys} | Éxitos: 📝 ${team.mathSolvedCount}</p>`;
        }
        card.innerHTML = `<div class="team-card-header"><span class="team-name-title">${team.name}</span><span class="badge" style="background:#475569;">Hab: ${team.currentRoomKey}</span></div><div class="members-list">${membersHTML}</div>${mathHTML}`;
        DOM.teamsGameCards.appendChild(card);
    });
}

function setTeamMathState(teamId, state) {
    gameState.teams[teamId].mathState = state;
    renderTeamsControlPanel();
}

function submitTeamAnswer(teamId) {
    const team = gameState.teams[teamId];
    const inputVal = document.getElementById(`math-ans-input-${team.id}`).value;
    if (inputVal === "") return;
    team.hasAnsweredThisRound = true;
    if (parseInt(inputVal) === team.currentEquation.result) {
        team.answeredCorrectly = true;
        team.mathSolvedCount++;
        gameState.priorityQueue.push(teamId);
        logEvent(`📝 ${team.name} resolvió correctamente.`);
        triggerRandomEvent(team);
    } else {
        team.answeredCorrectly = false;
        logEvent(`❌ ${team.name} falló la ecuación.`);
    }
    updatePriorityListDisplay();
    renderTeamsControlPanel();
}

function submitTeamFail(teamId) {
    const team = gameState.teams[teamId];
    team.hasAnsweredThisRound = true;
    team.answeredCorrectly = false;
    logEvent(`❌ Árbitro invalidó el turno de ${team.name}.`);
    updatePriorityListDisplay();
    renderTeamsControlPanel();
}

function updatePriorityListDisplay() {
    DOM.priorityListDisplay.innerHTML = "";
    if (gameState.priorityQueue.length === 0) {
        DOM.priorityListDisplay.innerHTML = "<li>Ninguno clasificado</li>";
        return;
    }
    gameState.priorityQueue.forEach((teamId) => {
        DOM.priorityListDisplay.innerHTML += `<li><strong>${gameState.teams[teamId].name}</strong></li>`;
    });
}

function renderDungeonMap() {
    DOM.dungeonMap.innerHTML = "";
    const size = CONFIG.mapSize;
    DOM.dungeonMap.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const key = `${x},${y}`;
            const room = gameState.map[key];
            const cell = document.createElement('div');
            cell.className = "map-room";
            let occupants = [];
            gameState.teams.forEach(t => { if (isTeamAlive(t) && t.currentRoomKey === key) occupants.push(`E${t.id + 1}`); });
            if (gameState.ghost.active && gameState.ghost.roomKey === key) occupants.push("👻");
            if (room.visited) { cell.classList.add('visited', 'visible'); } 
            else if (isRoomDiscoveredByProximity(key)) { cell.classList.add('visible'); }
            if (occupants.length > 0 && (room.visited || isRoomDiscoveredByProximity(key))) { cell.classList.add('current-occupation'); }
            let roomIcons = "";
            if (room.type === 'start') roomIcons += "🏁";
            if (room.type === 'exit') roomIcons += "🚪🔑";
            if (room.type === 'secret') roomIcons += "❓";
            cell.innerHTML = `<div class="room-id-lbl">${key} ${roomIcons}</div><div class="room-occupants">${occupants.join(', ')}</div>`;
            DOM.dungeonMap.appendChild(cell);
        }
    }
}

function isRoomDiscoveredByProximity(roomKey) {
    let discovered = false;
    gameState.teams.forEach(t => {
        if (!isTeamAlive(t)) return;
        const currentRoom = gameState.map[t.currentRoomKey];
        for (let d in currentRoom.connections) { if (currentRoom.connections[d] === roomKey) discovered = true; }
    });
    return discovered;
}

DOM.dirButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (gameState.currentPhase !== 'movement') return;
        if (gameState.priorityQueue.length === 0 || gameState.currentMovementIndex >= gameState.priorityQueue.length) return;
        executeMovement(e.target.dataset.dir);
    });
});

window.addEventListener('keydown', (e) => {
    if (gameState.currentPhase !== 'movement') return;
    if (gameState.priorityQueue.length === 0 || gameState.currentMovementIndex >= gameState.priorityQueue.length) return;

    let direction = null;
    switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
            direction = 'N';
            break;
        case 'arrowdown':
        case 's':
            direction = 'S';
            break;
        case 'arrowright':
        case 'd':
            direction = 'E';
            break;
        case 'arrowleft':
        case 'a':
            direction = 'O';
            break;
    }

    if (direction) {
        e.preventDefault(); 
        executeMovement(direction);
    }
});

function executeMovement(dir) {
    DOM.moveErrorMsg.innerText = "";
    const teamId = gameState.priorityQueue[gameState.currentMovementIndex];
    const team = gameState.teams[teamId];
    const currentRoom = gameState.map[team.currentRoomKey];
    const destinationKey = currentRoom.connections[dir];
    if (!destinationKey) { DOM.moveErrorMsg.innerText = "❌ No hay camino hacia allá."; return; }
    const lockType = currentRoom.doorLocks[dir];
    if (lockType) {
        if (lockType === "llave") {
            if (team.keys > 0) { team.keys--; currentRoom.doorLocks[dir] = false; gameState.map[destinationKey].doorLocks[getOppositeDirection(dir)] = false; logEvent(`🔑 ${team.name} usó una llave.`); } 
            else { DOM.moveErrorMsg.innerText = "🔒 Requiere llave."; return; }
        } else if (lockType === "ecuacion" || lockType === "mecanismo") {
            if (team.items.includes("Pasadizo")) { team.items = team.items.filter(i => i !== "Pasadizo"); currentRoom.doorLocks[dir] = false; logEvent(`🚪 Pasadizo usado.`); } 
            else { DOM.moveErrorMsg.innerText = "🧱 Sello activo."; currentRoom.doorLocks[dir] = false; }
        }
    }
    let occupiedByAnother = gameState.teams.some(t => t.id !== team.id && isTeamAlive(t) && t.currentRoomKey === destinationKey);
    if (occupiedByAnother) { DOM.moveErrorMsg.innerText = "⚠ Ocupado por otro equipo."; return; }
    team.currentRoomKey = destinationKey;
    gameState.map[destinationKey].visited = true;
    logEvent(`🏃 ${team.name} avanzó a [${destinationKey}].`);
    if (destinationKey === gameState.exitRoomKey) { triggerEndGame(true, team); return; }
    gameState.currentMovementIndex++;
    if (gameState.currentMovementIndex < gameState.priorityQueue.length) { selectTeamForMovement(gameState.priorityQueue[gameState.currentMovementIndex]); } 
    else { DOM.currentMovingTeamTxt.innerText = "Todos se movieron. Finalice la ronda."; }
    renderDungeonMap();
    renderTeamsControlPanel();
}

function getOppositeDirection(dir) {
    if (dir === 'N') return 'S'; if (dir === 'S') return 'N'; if (dir === 'E') return 'O'; return 'E';
}

DOM.btnAdvancePhase.addEventListener('click', () => {
    if (gameState.currentPhase === 'math') { startMovementPhase(); } else { endRound(); }
});

function triggerRandomEvent(team) {
    if (Math.random() > CONFIG.probabilidadEvento) return;
    const aliveMembers = team.members.filter(m => m.alive);
    if (aliveMembers.length === 0) return;
    const randomMember = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
    
    // SISTEMA DE MUERTE INTEGRADO
    if (Math.random() < CONFIG.probabilidadEliminacion) {
        randomMember.alive = false;
        logEvent(`💀 ¡Grave! ${randomMember.name} se desvaneció.`);
        showDeathScreen(team.name, randomMember.name);
        return;
    }
    
    const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
    template.action(team);
    logEvent(`✨ [Evento] ${template.text.replace("{player}", randomMember.name)} (${team.name})`);
}

function processGhostAI() {
    if (gameState.round <= 2) { gameState.ghost.active = false; DOM.ghostStatusBar.innerText = "El Guardián duerme..."; return; }
    if (gameState.round === 3) { gameState.ghost.active = false; gameState.ghost.roomKey = gameState.exitRoomKey; DOM.ghostStatusBar.innerText = "El ambiente se enfría..."; return; }
    if (gameState.round === 4 && !gameState.ghost.active) { gameState.ghost.active = true; DOM.ghostStatusBar.innerText = "👻 Guardián activo."; logEvent("👻 El Guardián ha despertado."); }
    if (gameState.ghost.active) {
        const currentRoom = gameState.map[gameState.ghost.roomKey];
        let randomFactor = Math.random();
        if (randomFactor < 0.15 && gameState.round <= 20) { logEvent("👻 El Guardián se desorientó."); return; }
        if (randomFactor > 0.88) {
            let coords = gameState.ghost.roomKey.split(',').map(Number);
            let nextX = Math.min(Math.max(coords[0] + (Math.random() > 0.5 ? 1 : -1), 0), CONFIG.mapSize - 1);
            let nextY = Math.min(Math.max(coords[1] + (Math.random() > 0.5 ? 1 : -1), 0), CONFIG.mapSize - 1);
            gameState.ghost.roomKey = `${nextX},${nextY}`; logEvent("👻 El Guardián cruzó un muro."); checkGhostCollisions(); return;
        }
        let validDirections = [];
        for (let d in currentRoom.connections) { if (currentRoom.connections[d] && (!currentRoom.doorLocks[d] || gameState.round > 20)) validDirections.push(currentRoom.connections[d]); }
        if (validDirections.length > 0) { gameState.ghost.roomKey = validDirections[Math.floor(Math.random() * validDirections.length)]; DOM.ghostStatusBar.innerText = "👻 El Guardián se movió."; checkGhostCollisions(); }
    }
}

function checkGhostCollisions() {
    gameState.teams.forEach(team => {
        if (isTeamAlive(team) && team.currentRoomKey === gameState.ghost.roomKey) {
            const alive = team.members.filter(m => m.alive);
            if (alive.length > 0) {
                const victim = alive[Math.floor(Math.random() * alive.length)]; 
                victim.alive = false;
                logEvent(`☠️ ¡EL GUARDIÁN ATACÓ! Eliminó a ${victim.name} en [${team.currentRoomKey}].`);
                // SISTEMA DE MUERTE INTEGRADO
                showDeathScreen(team.name, victim.name);
            }
        }
    });
}

function endRound() {
    processGhostAI();
    if (!gameState.teams.some(t => isTeamAlive(t))) { triggerEndGame(false, null); return; }
    gameState.round++; DOM.displayRound.innerText = gameState.round;
    if (gameState.round > CONFIG.maxRounds) { DOM.suddenDeathBadge.classList.remove('hidden'); logEvent("💀 MUERTE SÚBITA."); }
    startMathPhase();
}

function isTeamAlive(team) { return team.members.some(m => m.alive); }
function logEvent(msg) { gameState.logs.push(msg); const p = document.createElement('p'); p.innerHTML = `[R${gameState.round}] ${msg}`; DOM.eventLog.appendChild(p); DOM.eventLog.parentElement.scrollTop = DOM.eventLog.parentElement.scrollHeight; }

function triggerEndGame(escaped, winningTeam) {
    DOM.gameScreen.classList.add('hidden'); DOM.endScreen.classList.remove('hidden');
    if (escaped && winningTeam) {
        DOM.endTitle.innerText = "🎉 ¡VICTORIA!"; DOM.endTitle.style.color = "var(--success)";
        DOM.endStatsContent.innerHTML = `<div class="stat-line">🏆 <strong>Ganador:</strong> ${winningTeam.name}</div><div class="stat-line">⏳ <strong>Rondas:</strong> ${gameState.round}</div><div class="stat-line">📝 <strong>Aciertos:</strong> ${winningTeam.mathSolvedCount}</div>`;
    } else {
        DOM.endTitle.innerText = "💀 DERROTA TOTAL"; DOM.endTitle.style.color = "var(--danger)";
        DOM.endStatsContent.innerHTML = `<p>El Guardián ganó la partida en la ronda ${gameState.round}.</p>`;
    }
                }

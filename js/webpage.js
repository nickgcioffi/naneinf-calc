const defaultRoster = ["brainstorm", "baron", "blueprint", "mime", "dna"];
let jokerRoster = [...defaultRoster];

function getJokerSlots(state) {
            return 5 + (state.antimatter ? 1 : 0) + (state.ectoplasm ? 1 : 0);
        }

function getActiveRoster(state) {
    return jokerRoster.slice(0, getJokerSlots(state));
}

function addJoker() {
    // Check the current slot limit before adding the selected joker.
    const state = getState();
    if (jokerRoster.length >= getJokerSlots(state)) {
        return;
    }

    jokerRoster.push(getInput("jokerSelect").value);
    calculate();
}

function moveJoker(index, direction) {
    // Calculate the target roster position before swapping jokers.
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= jokerRoster.length) {
        return;
    }

    [jokerRoster[index], jokerRoster[nextIndex]] = [jokerRoster[nextIndex], jokerRoster[index]];
    calculate();
}

function removeJoker(index) {
    jokerRoster.splice(index, 1);
    calculate();
}

document.getElementById("rosterList").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
        return;
    }

    // Button index tells move/remove functions which roster item was clicked.
    const index = Number(button.dataset.index);

    if (button.dataset.action === "left") {
        moveJoker(index, -1);
    }

    if (button.dataset.action === "right") {
        moveJoker(index, 1);
    }

    if (button.dataset.action === "remove") {
        removeJoker(index);
    }
});

document.getElementById("calculateBtn").addEventListener("click", calculate);
document.getElementById("addJokerBtn").addEventListener("click", addJoker);
document.getElementById("copyPlanBtn").addEventListener("click", useGrowthEstimate);
document.getElementById("resetBtn").addEventListener("click", resetValues);

document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", calculate);
    input.addEventListener("change", calculate);
});

calculate();



function getInput(id) {
            return document.getElementById(id);
        }


function getNumber(id) {
    // Reads a number input and falls back to 0 for invalid values.
    const value = Number(getInput(id).value);
    return Number.isFinite(value) && value >= 0 ? value : 0;
}

function getState() {
    // Current calculator state, normalized from the form controls.
    return {
        level: Math.max(1, Math.floor(getNumber("level"))),
        kings: Math.floor(getNumber("kings")),
        steelKings: Math.floor(getNumber("steelKings")),
        hands: Math.max(1, Math.floor(getNumber("hands"))),
        redSeals: getInput("redSeals").checked,
        plasma: getInput("plasma").checked,
        antimatter: getInput("antimatter").checked,
        ectoplasm: getInput("ectoplasm").checked,
        handVouchers: getInput("handVouchers").checked,
        serpent: getInput("serpent").checked
    };
}

    //Handle invalid inputs
function handleError(kings, steelKings, heldCardCapacity) {
    const kingsInput = getInput("kings");
    const kingsLabel = document.querySelector('label[for="kings"]');
    const steelKingsInput = getInput("steelKings");
    const steelKingsLabel = document.querySelector('label[for="steelKings"]');

    const isTooManyKings = kings > heldCardCapacity;
    const isTooManySteelKings = steelKings > kings;

    kingsInput.classList.toggle("input-error", isTooManyKings);
    kingsLabel.classList.toggle("label-error", isTooManyKings);
    steelKingsInput.classList.toggle("input-error", isTooManySteelKings);
    steelKingsLabel.classList.toggle("label-error", isTooManySteelKings);
}


function renderRoster() {
            // Build the editable joker roster and update slot/hand-size feedback.
            const rosterList = document.getElementById("rosterList");
            const state = getState();
            const slots = getJokerSlots(state);

            rosterList.innerHTML = "";

            jokerRoster.forEach((joker, index) => {
                // Create one roster card with move/remove controls.
                const info = jokerInfo[joker];
                const card = document.createElement("div");
                card.className = index >= slots ? "roster-card inactive" : "roster-card";

                card.innerHTML = `
                    <img src="${info.image}" alt="${info.alt}">
                    <div>
                        <span class="roster-name">${index + 1}. ${info.name}</span>
                        <span class="roster-copy">${getCopyDescription(index)}</span>
                    </div>
                    <div class="roster-actions">
                        <button type="button" data-action="left" data-index="${index}" aria-label="Move ${info.name} left">Left</button>
                        <button type="button" data-action="right" data-index="${index}" aria-label="Move ${info.name} right">Right</button>
                        <button type="button" data-action="remove" data-index="${index}" aria-label="Remove ${info.name}">Remove</button>
                    </div>
                `;

                rosterList.appendChild(card);
            });

            document.getElementById("slotOut").textContent =
                `${jokerRoster.length}/${slots} joker slots used. ` +
                `Effective hand size: ${getEffectiveHandSize(state)} cards.`;

            document.getElementById("addJokerBtn").disabled = jokerRoster.length >= slots;
        }

function getCopyDescription(index) {
            const joker = jokerRoster[index];
            const state = getState();
            const roster = getActiveRoster(state);

            if (index >= roster.length) {
                return "inactive until you add a joker slot";
            }

            if (joker === "blueprint") {
                const copied = resolveJoker(index, roster);
                return copied === "none" ? "copies nothing" : `copies ${jokerInfo[copied].name}`;
            }

            if (joker === "brainstorm") {
                const copied = resolveJoker(index, roster);
                return copied === "none" ? "copies nothing" : `copies ${jokerInfo[copied].name}`;
            }

            return "real joker";
        }


function resetValues() {
    const currentDefaults = buildPresets[currentBuild]; // reads fresh every time
    const currentIds = Object.keys(currentDefaults);
    
    currentIds.forEach((id) => {
        const input = getInput(id);
        if (!input) return; // safety check in case a preset key has no matching input
        if (input.type === "checkbox") {
            input.checked = currentDefaults[id];
        } else {
            input.value = currentDefaults[id];
        }
    });
    jokerRoster = [...defaultRoster];
    calculate();
}

function useGrowthEstimate() {
            const state = getState();
            const counts = countEffectiveJokers(state);
            const burglarStartEffects = countBlindStartBurglarEffects(state);
            const handSize = getEffectiveHandSize(state);
            const availableHands = state.hands + (burglarStartEffects * 3);
            const serpentStackedCards = state.serpent ? availableHands * 2 : 0;
            const heldCardCapacity = handSize + serpentStackedCards;
            const dnaGrowth = counts.dna * availableHands;
            const estimatedKings = Math.min(heldCardCapacity, state.startKings + dnaGrowth + serpentStackedCards);

            getInput("kings").value = estimatedKings;
            getInput("steelKings").value = Math.min(getNumber("steelKings"), estimatedKings);
            calculate();
        }

document.getElementById("buildSelect").addEventListener("change", (event) => {
    currentBuild = event.target.value;
    resetValues();
});

// Baron + Mime Mode

// Perkeo Cryptid Mode

// Perkeo Planet Mode

// Freeform Mode
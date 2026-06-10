// Score thresholds and repeated math constants used by the calculator.
const NANEINF_LOG10 = Math.log10(Number.MAX_VALUE);
        const LOG10_15 = Math.log10(1.5);

        // Display data for each joker option in the roster UI.
        const jokerInfo = {
            baron: {
                name: "Baron",
                image: "assets/jokers/Baron.png",
                alt: "Baron Joker"
            },
            mime: {
                name: "Mime",
                image: "assets/jokers/Mime.png",
                alt: "Mime Joker"
            },
            blueprint: {
                name: "Blueprint",
                image: "assets/jokers/Blueprint.png",
                alt: "Blueprint Joker"
            },
            brainstorm: {
                name: "Brainstorm",
                image: "assets/jokers/Brainstorm.png",
                alt: "Brainstorm Joker"
            },
            dna: {
                name: "DNA",
                image: "assets/jokers/DNA.png",
                alt: "DNA Joker"
            },
            burglar: {
                name: "Burglar",
                image: "assets/jokers/Burglar.png",
                alt: "Burglar Joker"
            }
        };

        // Starting joker order, plus the live roster the user can edit.
        const defaultRoster = ["brainstorm", "baron", "blueprint", "mime", "dna"];
        let jokerRoster = [...defaultRoster];

        // Default input values used on first load and when the form is reset.
        const defaults = {
            level:10,
            kings: 12,
            steelKings: 8,
            hands: 4,
            redSeals: false,
            plasma: false,
            antimatter: false,
            ectoplasm: false,
            handVouchers: false,
            serpent: true
        };

        // Input ids are derived from defaults so reset and setup stay in sync.
        const ids = Object.keys(defaults);

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


        function getHighCardStats(level) {
            return {
                chips: 5 + (level - 1) * 10,
                mult: 1 + (level - 1) * 2
            }
        };

        function getEffectiveHandSize(state) {
            return Math.max(1, 8 + (state.handVouchers ? 2 : 0) - (state.ectoplasm ? 1 : 0));
        }

        function getJokerSlots(state) {
            return 5 + (state.antimatter ? 1 : 0) + (state.ectoplasm ? 1 : 0);
        }

        function getActiveRoster(state) {
            return jokerRoster.slice(0, getJokerSlots(state));
        }

        function resolveJoker(index, roster, seen = new Set()) {
            // Follow Blueprint/Brainstorm copy chains until a real joker is found.
            const joker = roster[index];

            if (!joker || seen.has(index)) {
                return "none";
            }

            if (joker === "blueprint") {
                seen.add(index);
                return resolveJoker(index + 1, roster, seen);
            }

            if (joker === "brainstorm") {
                if (index === 0) {
                    return "none";
                }

                seen.add(index);
                return resolveJoker(0, roster, seen);
            }

            return joker;
        }

        function countEffectiveJokers(state) {
            // Count real joker effects after Blueprint and Brainstorm copies resolve.
            const roster = getActiveRoster(state);
            const counts = {
                baron: 0,
                mime: 0,
                dna: 0,
                burglar: 0,
                none: 0
            };

            roster.forEach((joker, index) => {
                const resolved = resolveJoker(index, roster);
                if (counts[resolved] !== undefined) {
                    counts[resolved] += 1;
                }
            });

            return counts;
        }

        function countBlindStartBurglarEffects(state) {
            // Burglar hand bonuses count copy jokers only when a real Burglar exists.
            const roster = getActiveRoster(state);
            const realBurglars = roster.filter((joker) => joker === "burglar").length;
            const copyJokers = roster.filter((joker) => joker === "blueprint" || joker === "brainstorm").length;

            return realBurglars > 0 ? realBurglars + copyJokers : 0;
        }

        function getCopyDescription(index) {
            // Text shown under each roster card to explain what it is copying.
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

        function formatScientific(logScore) {
            if (!Number.isFinite(logScore)) {
                return "naneinf";
            }

            if (logScore >= NANEINF_LOG10) {
                return "naneinf";
            }

            if (logScore < 6) {
                return Math.round(Math.pow(10, logScore)).toLocaleString();
            }

            // Split the log score into mantissa/exponent notation.
            const exponent = Math.floor(logScore);
            const mantissa = Math.pow(10, logScore - exponent);
            return `${mantissa.toFixed(3)}e${exponent}`;
        }

        function log10Add(leftLog, rightLog) {
            // Adds two log10 values without converting huge scores back to normal numbers.
            const larger = Math.max(leftLog, rightLog);
            const smaller = Math.min(leftLog, rightLog);
            return larger + Math.log10(1 + Math.pow(10, smaller - larger));
        }

        function calculate() {
            // Gather all current inputs and derived joker/hand limits for scoring.
            const state = getState();
            const highCard = getHighCardStats(state.level);
            const counts = countEffectiveJokers(state);
            const burglarStartEffects = countBlindStartBurglarEffects(state);
            const handSize = getEffectiveHandSize(state);
            const availableHands = state.hands + (burglarStartEffects * 3);
            const serpentStackedCards = state.serpent ? availableHands * 2 : 0;
            const heldCardCapacity = handSize + serpentStackedCards;
            handleError(state.kings, state.steelKings, heldCardCapacity);

            const activeKings = Math.min(state.kings, heldCardCapacity);
            const steelKings = Math.min(state.steelKings, activeKings);
            const baronEffects = counts.baron;
            const mimeEffects = counts.mime;
            const redSealRetriggers = state.redSeals ? 1 : 0;
            const heldCardTriggers = 1 + mimeEffects + redSealRetriggers;

            // Convert held kings, Baron, Mime, steel, and red seals into total retriggers.
            const baronTriggers = activeKings * baronEffects * heldCardTriggers;
            const steelTriggers = steelKings * heldCardTriggers;
            const totalTriggers = baronTriggers + steelTriggers;

            // Calculate the score in log10 space so very large numbers stay manageable.
            const logChips = Math.log10(highCard.chips);
            const logFinalMult = Math.log10(highCard.mult) + totalTriggers * LOG10_15;
            const logScore = state.plasma
                ? 2 * (log10Add(logChips, logFinalMult) - Math.log10(2))
                : logChips + logFinalMult;
            const gap = Math.max(0, NANEINF_LOG10 - logScore);
            const progress = Math.max(0, Math.min(100, (logScore / NANEINF_LOG10) * 100));

            // Estimate how many kings DNA and Serpent could leave you holding later.
            const dnaGrowth = counts.dna * availableHands;
            const estimatedKings = Math.min(heldCardCapacity, state.kings + dnaGrowth + serpentStackedCards);

            document.getElementById("scoreOut").textContent = formatScientific(logScore);
            document.getElementById("logOut").textContent = logScore.toFixed(2);
            document.getElementById("gapOut").textContent = gap === 0 ? "there" : `${gap.toFixed(2)} orders`;
            document.getElementById("triggerOut").textContent = totalTriggers.toLocaleString();
            document.getElementById("meterFill").style.width = `${progress}%`;

            document.getElementById("summaryOut").textContent =
                `Effective kings held: ${activeKings}/${heldCardCapacity}. Estimated king growth: ${estimatedKings} kings after ${availableHands} hand(s). ` +
                `Blind-start Burglar effects: ${burglarStartEffects}. Effective scoring jokers: ${baronEffects} Baron, ${mimeEffects} Mime, ${counts.dna} DNA. ` +
                `Held-card triggers per king: ${heldCardTriggers}.`;

            document.getElementById("warningOut").textContent =
                logScore >= NANEINF_LOG10
                    ? "The calculator expects this setup to cross JavaScript's infinity line. That is naneinf territory."
                    : `You need about ${gap.toFixed(2)} more powers of ten to reach the naneinf neighborhood.`;

            document.getElementById("formulaOut").textContent =
                state.plasma
                    ? `final mult = ${highCard.mult} * 1.5^${totalTriggers}; log10(score) = 2 * log10((${highCard.chips} + final mult) / 2)`
                    : `log10(score) = log10(${highCard.chips}) + log10(${highCard.mult}) + ` +
                        `(${activeKings} kings * ${baronEffects} Baron effects * ${heldCardTriggers} held-card triggers + ` +
                        `${steelKings} steel kings * ${heldCardTriggers} held-card triggers) * log10(1.5)`;

            renderRoster();
        }

        function useGrowthEstimate() {
            // Reuse the growth math to fill the current king count input.
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

        function resetValues() {
            ids.forEach((id) => {
                // Reset each control based on whether it is a checkbox or text/number input.
                const input = getInput(id);
                if (input.type === "checkbox") {
                    input.checked = defaults[id];
                } else {
                    input.value = defaults[id];
                }
            });
            jokerRoster = [...defaultRoster];
            calculate();
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
            // One click handler manages all roster buttons by reading data attributes.
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

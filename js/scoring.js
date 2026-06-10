// Score thresholds and repeated math constants used by the calculator.
const NANEINF_LOG10 = Math.log10(Number.MAX_VALUE);
const LOG10_15 = Math.log10(1.5);


let currentBuild = "highCard";

const buildPresets = {
    highCard: {
        level:10,
        kings: 12,
        steelKings: 8,
        hands: 4,
        redSeals: false,
        plasma: true,
        antimatter: false,
        ectoplasm: false,
        //Update this to be handsize one and two
        handVouchers: false,
        serpent: true
    },
    cryptid: {
        level:4,
        kings: 7,
        steelKings: 7,
        hands: 4,
        redSeals: false,
        plasma: false,
        antimatter: false,
        ectoplasm: true,
        //Update this to be handsize one and two
        handVouchers: false,
        serpent: false
    },
    // Planet Assumes Flush Five for now
    planet: {
        level:10,
        redSeals: true,
        plasma: false,
        antimatter: false,
        ectoplasm: false,
        //Update this to be handsize one and two
        handVouchers: false,
        serpent: false
    },
    freeform: {
        level:10,
        kings: 8,
        steelKings: 0,
        hands: 4,
        redSeals: false,
        plasma: false,
        antimatter: false,
        ectoplasm: false,
        //Update this to be handsize one and two
        handVouchers: false,
        serpent: false
    }


}

const ids = Object.keys(buildPresets[currentBuild]);

// Calculator Stuff
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



        // Recursion
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
// ~~~~~~~ Baron + Mime High Card ~~~~~~~~~~~


// High Card Math

function getHighCardStats(level) {
            return {
                chips: 5 + (level - 1) * 10,
                mult: level
            }
        };

        function getEffectiveHandSize(state) {
            return Math.max(1, 8 + (state.handVouchers ? 2 : 0) - (state.ectoplasm ? 1 : 0));
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

// Burgular Hands
function countBlindStartBurglarEffects(state) {
            // Burglar hand bonuses count copy jokers only when a real Burglar exists.
            const roster = getActiveRoster(state);
            const realBurglars = roster.filter((joker) => joker === "burglar").length;
            const copyJokers = roster.filter((joker) => joker === "blueprint" || joker === "brainstorm").length;

            return realBurglars > 0 ? realBurglars + copyJokers : 0;
        }


// ~~~~~~ Perkeo + Cryptid ~~~~~~~~~~

// ~~~~~ START OF PERKEO x SPECIFIC HAND ~~~~~

// Perkeo + Pluto Planet

// Perkeo + Eris Planet (For the Flush Five Build)

// ~~~~~ END OF PERKEO x SPECIFIC HAND ~~~~~

// ~~~~~ START OF PERKEO x SPECIFIC JOKER ~~~~~

// Stuntman + (Perkeo * Ankh)

// Stencil Joker + (Perkeo --> Ankh / Ectoplasm)

// Wee Joker + (Perkeo --> Ankh / Ectoplasm)

// ~~~~~ END OF PERKEO x SPECIFIC HAND ~~~~~

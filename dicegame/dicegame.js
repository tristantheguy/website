var dice = [4, 6, 8, 10, 12, 20];
var mode = "easy";
var currentDie = 0;
var wins = 0;
var losses = 0;
var score = 0;
var rolls = 0;
var session = 0;
var high = 0;

var SKILL_TREE_UNLOCK_ROLLS = 25;
var EASY_MODE_SKILL_POINT_SCORE_RATE = 250;
var NORMAL_MODE_SKILL_POINT_SCORE_RATE = 100;
var SKILLS = [
    { id: "luckyEdge", name: "Lucky Edge", cost: 1, description: "15% chance to add +1 to your roll" },
    { id: "weightedToss", name: "Weighted Toss", cost: 2, description: "10% chance to add +2 to your roll" },
    { id: "secondChance", name: "Second Chance", cost: 3, description: "10% chance to reroll once after a failed roll" }
];

var ROLL_COOLDOWN_MS = 320;
var isRollCoolingDown = false;

var progression = loadProgression();
var debugState = {
    enabled: false,
    forcedNextRoll: null,
    forcedSkillTrigger: false
};

function getDefaultProgression() {
    return {
        totalRolls: 0,
        lifetimeScoreForSkillPoints: 0,
        skillPoints: 0,
        spentSkillPoints: 0,
        ownedSkills: [],
        selectedSkill: ""
    };
}

function loadProgression() {
    var savedProgression = localStorage.getItem("diceGameProgression");
    if (!savedProgression) {
        return getDefaultProgression();
    }

    try {
        var parsed = JSON.parse(savedProgression);
        var progressionState = {
            totalRolls: typeof parsed.totalRolls === "number" ? parsed.totalRolls : 0,
            lifetimeScoreForSkillPoints: typeof parsed.lifetimeScoreForSkillPoints === "number" ? parsed.lifetimeScoreForSkillPoints : 0,
            skillPoints: typeof parsed.skillPoints === "number" ? parsed.skillPoints : 0,
            spentSkillPoints: typeof parsed.spentSkillPoints === "number" ? parsed.spentSkillPoints : 0,
            ownedSkills: Array.isArray(parsed.ownedSkills) ? parsed.ownedSkills : [],
            selectedSkill: typeof parsed.selectedSkill === "string" ? parsed.selectedSkill : ""
        };

        if ((!parsed.ownedSkills || parsed.ownedSkills.length === 0) && Array.isArray(parsed.unlockedSkills) && parsed.unlockedSkills.length > 0) {
            progressionState.ownedSkills = parsed.unlockedSkills.filter(function (skillId) {
                return !!getSkillById(skillId);
            });
            progressionState.spentSkillPoints = progressionState.ownedSkills.reduce(function (total, skillId) {
                var skill = getSkillById(skillId);
                return total + (skill ? skill.cost : 0);
            }, 0);
        }

        return progressionState;
    } catch (error) {
        return getDefaultProgression();
    }
}

function saveProgression() {
    localStorage.setItem("diceGameProgression", JSON.stringify(progression));
}

function getSkillById(skillId) {
    return SKILLS.find(function (skill) {
        return skill.id === skillId;
    });
}

function isSkillOwned(skillId) {
    return progression.ownedSkills.indexOf(skillId) !== -1;
}

function normalizeProgression() {
    progression.totalRolls = Math.max(0, Number(progression.totalRolls) || 0);
    progression.lifetimeScoreForSkillPoints = Math.max(0, Number(progression.lifetimeScoreForSkillPoints) || 0);
    progression.skillPoints = Math.max(0, Number(progression.skillPoints) || 0);
    progression.spentSkillPoints = Math.max(0, Number(progression.spentSkillPoints) || 0);

    progression.ownedSkills = (Array.isArray(progression.ownedSkills) ? progression.ownedSkills : []).filter(function (skillId, index, list) {
        return !!getSkillById(skillId) && list.indexOf(skillId) === index;
    });

    var minimumSpentFromOwned = progression.ownedSkills.reduce(function (total, skillId) {
        var skill = getSkillById(skillId);
        return total + (skill ? skill.cost : 0);
    }, 0);

    if (progression.spentSkillPoints < minimumSpentFromOwned) {
        progression.spentSkillPoints = minimumSpentFromOwned;
    }

    if (progression.selectedSkill && !isSkillOwned(progression.selectedSkill)) {
        progression.selectedSkill = "";
    }
}

function getSkillPointRateForMode(gameMode) {
    return gameMode === "normal" ? NORMAL_MODE_SKILL_POINT_SCORE_RATE : EASY_MODE_SKILL_POINT_SCORE_RATE;
}

function awardSkillPointsFromScoreGain(scoreGained) {
    var safeGain = Math.max(0, Math.floor(Number(scoreGained) || 0));
    if (safeGain <= 0) {
        return 0;
    }

    var previousLifetimeScore = progression.lifetimeScoreForSkillPoints;
    var currentLifetimeScore = previousLifetimeScore + safeGain;
    var skillPointRate = getSkillPointRateForMode(mode);
    var previousSkillPointTotal = Math.floor(previousLifetimeScore / skillPointRate);
    var nextSkillPointTotal = Math.floor(currentLifetimeScore / skillPointRate);
    var pointsEarned = Math.max(0, nextSkillPointTotal - previousSkillPointTotal);

    progression.lifetimeScoreForSkillPoints = currentLifetimeScore;
    if (pointsEarned > 0) {
        progression.skillPoints += pointsEarned;
    }

    normalizeProgression();
    saveProgression();

    return pointsEarned;
}

function setRunCompleteMessage(message) {
    var runCompleteMessage = document.getElementById("run-complete-message");
    if (runCompleteMessage) {
        runCompleteMessage.innerHTML = message;
    }
}

function getModeLabel() {
    return mode === "normal" ? "Normal" : "Easy";
}

function setStatusMessage(message, tone) {
    var statusMessage = document.getElementById("status-message");
    if (!statusMessage) {
        return;
    }

    statusMessage.innerHTML = message;
    statusMessage.className = "";
    if (tone) {
        statusMessage.classList.add("status-" + tone);
    }
}

function updateGameDisplay(rollMessage) {
    document.getElementById("mode").innerHTML = "Current mode: " + getModeLabel();
    document.getElementById("roll").innerHTML = rollMessage || "Required roll: " + dice[currentDie];
    document.getElementById("score").innerHTML = "Score: " + score;
    document.getElementById("total").innerHTML = "Rolls: " + rolls;
    document.getElementById("session").innerHTML = "Session Rolls: " + session;
    document.getElementById("wins").innerHTML = "wins: " + wins;
    document.getElementById("losses").innerHTML = mode === "normal" ? "losses: " + losses : "";
    document.getElementById("high").innerHTML = mode === "normal" ? "Highest Die rolled: " + dice[high] : "";
}

function toggleInfoPanel() {
    var infoPanel = document.getElementById("info-panel");
    var infoButton = document.getElementById("info-toggle");
    if (!infoPanel || !infoButton) {
        return;
    }

    var opening = infoPanel.style.display === "none";
    infoPanel.style.display = opening ? "block" : "none";
    infoButton.setAttribute("aria-expanded", opening ? "true" : "false");
}

function triggerRollCooldown() {
    var rollButton = document.getElementById("roll-button");
    isRollCoolingDown = true;
    if (rollButton) {
        rollButton.disabled = true;
    }

    window.setTimeout(function () {
        isRollCoolingDown = false;
        if (rollButton) {
            rollButton.disabled = false;
        }
    }, ROLL_COOLDOWN_MS);
}

function completeRun() {
    var finalScore = score;

    wins += 1;
    setRunCompleteMessage("Run complete! Skill points are now earned continuously from score during each run.");
    setStatusMessage("Run complete! Start another run to keep earning score-based skill points.", "success");
    submitScore(finalScore);

    currentDie = 0;
    rolls = 0;
    session = 0;
    losses = 0;
    high = 0;
    score = 0;

    updateGameDisplay();
    updateSkillTreeUI();
}

function canBuySkill(skillId) {
    var skill = getSkillById(skillId);
    if (!skill || isSkillOwned(skillId)) {
        return false;
    }

    return progression.skillPoints >= skill.cost;
}

function buySkill(skillId) {
    var skill = getSkillById(skillId);
    if (!skill || !canBuySkill(skillId)) {
        return;
    }

    progression.ownedSkills.push(skillId);
    progression.skillPoints = Math.max(0, progression.skillPoints - skill.cost);
    progression.spentSkillPoints += skill.cost;
    normalizeProgression();
    saveProgression();
    updateSkillTreeUI();
    setDevStatus("Purchased " + skill.name + " for " + skill.cost + " skill point(s).");
}

function toggleSkillTree() {
    if (progression.totalRolls < SKILL_TREE_UNLOCK_ROLLS) {
        return;
    }

    var panel = document.getElementById("skill-tree-panel");
    panel.classList.toggle("open");
    updateSkillTreeUI();
}

function selectSkill(skillId) {
    if (!isSkillOwned(skillId)) {
        return;
    }

    progression.selectedSkill = progression.selectedSkill === skillId ? "" : skillId;
    saveProgression();
    updateSkillTreeUI();
    updateSkillStatusMessage("No skill effect this roll.");
}

function renderSkills() {
    var skillsContainer = document.getElementById("skills-container");
    skillsContainer.innerHTML = "";

    SKILLS.forEach(function (skill) {
        var skillCard = document.createElement("div");
        skillCard.className = "skill-card";
        var owned = isSkillOwned(skill.id);
        var selected = progression.selectedSkill === skill.id && owned;
        var canBuy = canBuySkill(skill.id);

        skillCard.classList.add(owned ? "owned" : "locked");
        if (selected) {
            skillCard.classList.add("selected");
        }

        var stateText = owned ? (selected ? "Selected" : "Owned") : "Not owned";

        skillCard.innerHTML = "<h4>" + skill.name + "</h4>" +
            "<p>" + skill.description + "</p>" +
            "<p><strong>Cost:</strong> " + skill.cost + " skill point(s)</p>" +
            "<p><strong>Status:</strong> " + stateText + "</p>";

        var actionButton = document.createElement("button");
        if (!owned) {
            actionButton.textContent = canBuy ? "Buy" : "Need " + skill.cost + " SP";
            actionButton.disabled = !canBuy;
            actionButton.onclick = function () {
                buySkill(skill.id);
            };
        } else {
            actionButton.textContent = selected ? "Selected" : "Select";
            actionButton.disabled = selected;
            actionButton.onclick = function () {
                selectSkill(skill.id);
            };
        }

        skillCard.appendChild(actionButton);
        skillsContainer.appendChild(skillCard);
    });
}

function updateSkillTreeUI() {
    normalizeProgression();

    var skillTreeToggle = document.getElementById("skill-tree-toggle");
    var skillTreePanel = document.getElementById("skill-tree-panel");
    var totalRollsText = document.getElementById("skill-tree-total-rolls");
    var skillPointsText = document.getElementById("skill-tree-skill-points");
    var lifetimeScoreText = document.getElementById("skill-tree-lifetime-score");
    var ownedSkillsText = document.getElementById("skill-tree-owned-skills");
    var selectedSkillText = document.getElementById("skill-tree-selected-skill");

    var shouldShowSkillTree = progression.totalRolls >= SKILL_TREE_UNLOCK_ROLLS;
    skillTreeToggle.style.display = shouldShowSkillTree ? "block" : "none";
    skillTreePanel.style.display = shouldShowSkillTree ? "block" : "none";

    if (!shouldShowSkillTree) {
        skillTreePanel.classList.remove("open");
    }

    totalRollsText.innerHTML = "Total rolls (all time): " + progression.totalRolls;
    skillPointsText.innerHTML = "Available Skill Points: " + progression.skillPoints + " (Spent: " + progression.spentSkillPoints + ")";
    lifetimeScoreText.innerHTML = "Lifetime score for skill point progression: " + progression.lifetimeScoreForSkillPoints;
    ownedSkillsText.innerHTML = "Owned skills: " + (progression.ownedSkills.length ? progression.ownedSkills.map(function (skillId) { return getSkillById(skillId).name; }).join(", ") : "None");
    selectedSkillText.innerHTML = "Selected skill: " + (progression.selectedSkill ? getSkillById(progression.selectedSkill).name : "None");

    renderSkills();
    updateSkillStatusMessage();
    populateDevSkillSelect();
}

function updateSkillStatusMessage(lastEffectMessage) {
    var activeSkillElement = document.getElementById("active-skill");
    var activationMessageElement = document.getElementById("skill-activation-message");
    var selectedSkill = getSkillById(progression.selectedSkill);

    activeSkillElement.innerHTML = "Active Skill: " + (selectedSkill ? selectedSkill.name : "None");
    if (typeof lastEffectMessage === "string") {
        activationMessageElement.innerHTML = "Last Skill Effect: " + lastEffectMessage;
    }
}

function showFloatingSkillEffect(message) {
    var floatingSkillEffect = document.getElementById("floating-skill-effect");
    if (!floatingSkillEffect || !message) {
        return;
    }

    floatingSkillEffect.textContent = message;
    floatingSkillEffect.classList.remove("animate");

    window.requestAnimationFrame(function () {
        floatingSkillEffect.classList.add("animate");
    });
}

function shouldActivateSkill(chance, eligibleForForcedTrigger) {
    if (eligibleForForcedTrigger && debugState.forcedSkillTrigger) {
        debugState.forcedSkillTrigger = false;
        return true;
    }

    return Math.random() < chance;
}

function getRandomRollForDie(dieSize) {
    return Math.floor(Math.random() * dieSize) + 1;
}

function getBaseRoll(dieSize) {
    if (debugState.forcedNextRoll !== null) {
        var forced = Math.max(1, Math.min(dieSize, Number(debugState.forcedNextRoll)));
        debugState.forcedNextRoll = null;
        return forced;
    }

    return getRandomRollForDie(dieSize);
}

function resetCurrentRunState(keepMode) {
    currentDie = 0;
    wins = 0;
    losses = 0;
    score = 0;
    rolls = 0;
    session = 0;
    high = 0;

    if (!keepMode) {
        mode = "easy";
    }
}

function syncDevInputs() {
    var totalRollInput = document.getElementById("dev-total-rolls-input");
    var skillPointInput = document.getElementById("dev-set-skill-points-input");

    if (totalRollInput) {
        totalRollInput.value = progression.totalRolls;
    }

    if (skillPointInput) {
        skillPointInput.value = progression.skillPoints;
    }
}

function resetPlayerProgress(skipConfirm) {
    if (!skipConfirm) {
        var confirmed = window.confirm("Are you sure you want to reset all local progress and upgrades for this player?");
        if (!confirmed) {
            return;
        }
    }

    progression = getDefaultProgression();
    localStorage.removeItem("diceGameProgression");
    saveProgression();

    resetCurrentRunState(false);

    debugState.forcedNextRoll = null;
    debugState.forcedSkillTrigger = false;

    updateGameDisplay();
    setStatusMessage("Progress reset. Choose a mode and roll to begin.", "info");
    updateSkillStatusMessage("No skill effect this roll.");
    updateSkillTreeUI();
    syncDevInputs();
    setDevStatus("Local player progress and run state reset.");
}

function rollDice() {
    if (isRollCoolingDown) {
        return;
    }

    triggerRollCooldown();

    var requiredRoll = dice[currentDie];
    var initialRoll = getBaseRoll(requiredRoll);
    var finalRoll = initialRoll;
    var skillActivationMessage = "No skill effect this roll.";
    normalizeProgression();
    var selectedSkillId = progression.selectedSkill;
    var selectedSkillIsUnlocked = isSkillOwned(selectedSkillId);

    if (selectedSkillIsUnlocked && selectedSkillId === "luckyEdge") {
        if (shouldActivateSkill(0.15, true)) {
            finalRoll += 1;
            skillActivationMessage = "Lucky Edge activated! +1";
            showFloatingSkillEffect(skillActivationMessage);
        }
    }

    if (selectedSkillIsUnlocked && selectedSkillId === "weightedToss") {
        if (shouldActivateSkill(0.10, true)) {
            finalRoll += 2;
            skillActivationMessage = "Weighted Toss activated! +2";
            showFloatingSkillEffect(skillActivationMessage);
        }
    }

    var failedRoll = finalRoll < requiredRoll;
    if (selectedSkillIsUnlocked && selectedSkillId === "secondChance" && failedRoll) {
        if (shouldActivateSkill(0.10, true)) {
            skillActivationMessage = "Second Chance activated! Rerolling...";
            showFloatingSkillEffect(skillActivationMessage);
            finalRoll = getRandomRollForDie(requiredRoll);
            failedRoll = finalRoll < requiredRoll;
        }
    }

    rolls += 1;
    session += 1;
    progression.totalRolls += 1;
    normalizeProgression();
    saveProgression();

    var pointsAdded = finalRoll;
    if (mode == "normal") {
        pointsAdded *= Math.trunc(Math.ceil(session / 100)) * (Math.abs(losses - (losses * (wins + 1))) + 1);
    }

    var scoreBeforeRoll = score;
    if (dice[currentDie] == 4 & mode == "normal") {
        score += pointsAdded;
    } else if (dice[currentDie] == 6 & mode == "normal") {
        score += pointsAdded * 2;
    } else if (dice[currentDie] == 8 & mode == "normal") {
        score += pointsAdded * 4;
    } else if (dice[currentDie] == 10 & mode == "normal") {
        score += pointsAdded * 8;
    } else if (dice[currentDie] == 12 & mode == "normal") {
        score += pointsAdded * 16;
    } else if (dice[currentDie] == 20 & mode == "normal") {
        score += pointsAdded * 128;
    } else {
        score += finalRoll;
    }

    var scoreGained = score - scoreBeforeRoll;
    var skillPointsEarnedFromRoll = awardSkillPointsFromScoreGain(scoreGained);
    var nextThreshold = getSkillPointRateForMode(mode) - (progression.lifetimeScoreForSkillPoints % getSkillPointRateForMode(mode));
    if (nextThreshold === getSkillPointRateForMode(mode)) {
        nextThreshold = 0;
    }

    if (finalRoll >= requiredRoll) {
        currentDie += 1;

        if (currentDie > high) {
            high = currentDie;
        }

        if (currentDie >= dice.length) {
            completeRun();
            updateSkillStatusMessage(skillActivationMessage);
            setDevStatus("Run complete. Final roll: " + finalRoll + ".");
            return;
        }

        updateGameDisplay("You rolled a " + finalRoll + " (required: " + requiredRoll + ")");
        if (skillPointsEarnedFromRoll > 0) {
            setStatusMessage("Great roll! You earned " + skillPointsEarnedFromRoll + " skill point" + (skillPointsEarnedFromRoll === 1 ? "" : "s") + " from score.", "success");
            setRunCompleteMessage("Skill point gained from score! Keep rolling to earn more.");
        } else {
            setStatusMessage("Great roll! Keep climbing. " + nextThreshold + " more score for next skill point.", "success");
        }
    } else {
        if (mode == "normal") {
            currentDie = 0;
            losses += 1;
            updateGameDisplay("You rolled a " + finalRoll + " (required: " + requiredRoll + ")");
            if (skillPointsEarnedFromRoll > 0) {
                setStatusMessage("You rolled a " + finalRoll + ". Back to start, but you earned " + skillPointsEarnedFromRoll + " skill point" + (skillPointsEarnedFromRoll === 1 ? "" : "s") + " from score.", "warning");
                setRunCompleteMessage("You earned a skill point from score even though the run failed.");
            } else {
                setStatusMessage("You rolled a " + finalRoll + ". Not high enough. Back to the beginning.", "warning");
            }
        } else {
            updateGameDisplay("You rolled a " + finalRoll + " (required: " + requiredRoll + ")");
            if (skillPointsEarnedFromRoll > 0) {
                setStatusMessage("You rolled a " + finalRoll + ". Not high enough, but you earned " + skillPointsEarnedFromRoll + " skill point" + (skillPointsEarnedFromRoll === 1 ? "" : "s") + " from score.", "warning");
                setRunCompleteMessage("Skill point gained from score! Failed rolls do not remove earned progression.");
            } else {
                setStatusMessage("You rolled a " + finalRoll + ". Not high enough. Roll again.", "warning");
            }
        }
    }

    updateSkillTreeUI();
    updateSkillStatusMessage(skillActivationMessage);
    setDevStatus("Roll complete. Final roll: " + finalRoll + ".");
}

function setEasyMode() {
    mode = "easy";
    setRunCompleteMessage("Easy mode: safer, slower progression (1 skill point per 250 score earned). Skill points are awarded during the run.");
    currentDie = 0;
    score = 0;
    rolls = 0;
    session = 0;
    wins = 0;
    high = 0;
    updateGameDisplay();
    setStatusMessage("Easy mode enabled. Failed rolls let you try the same die again.", "info");
    updateSkillStatusMessage("No skill effect this roll.");
    return;
}

function setNormalMode() {
    mode = "normal";
    setRunCompleteMessage("Normal mode: riskier, faster progression (1 skill point per 100 score earned). Skill points are awarded during the run.");
    currentDie = 0;
    score = 0;
    rolls = 0;
    session = 0;
    wins = 0;
    losses = 0;
    high = 0;
    updateGameDisplay();
    setStatusMessage("Normal mode enabled. Failed rolls send you back to the first die.", "info");
    updateSkillStatusMessage("No skill effect this roll.");
    return;
}

function openDeveloperMenu() {
    debugState.enabled = true;
    document.getElementById("developer-menu").style.display = "block";
    populateDevSkillSelect();
    syncDevInputs();
    setDevStatus("Developer menu opened.");
}

function closeDeveloperMenu() {
    document.getElementById("developer-menu").style.display = "none";
    debugState.enabled = false;
}

function setDevStatus(message) {
    var status = document.getElementById("dev-status-message");
    if (status) {
        status.innerHTML = message;
    }
}

function populateDevSkillSelect() {
    var select = document.getElementById("dev-active-skill-select");
    if (!select) {
        return;
    }

    select.innerHTML = "";
    var noneOption = document.createElement("option");
    noneOption.value = "";
    noneOption.textContent = "None";
    select.appendChild(noneOption);

    SKILLS.forEach(function (skill) {
        var option = document.createElement("option");
        option.value = skill.id;
        option.textContent = skill.name;
        select.appendChild(option);
    });

    select.value = progression.selectedSkill;
}

function devSetTotalRolls() {
    var value = Number(document.getElementById("dev-total-rolls-input").value);
    progression.totalRolls = Math.max(0, value || 0);
    normalizeProgression();
    saveProgression();
    updateSkillTreeUI();
    syncDevInputs();
    setDevStatus("Set total rolls to " + progression.totalRolls + ".");
}

function devAddRolls(amount) {
    progression.totalRolls += amount;
    normalizeProgression();
    saveProgression();
    updateSkillTreeUI();
    syncDevInputs();
    setDevStatus("Added " + amount + " rolls.");
}


function devAddSkillPoints() {
    var value = Number(document.getElementById("dev-add-skill-points-input").value);
    var pointsToAdd = Math.max(0, value || 0);
    if (pointsToAdd <= 0) {
        setDevStatus("Add skill points value must be at least 1.");
        return;
    }

    progression.skillPoints += pointsToAdd;
    normalizeProgression();
    saveProgression();
    updateSkillTreeUI();
    syncDevInputs();
    setDevStatus("Added " + pointsToAdd + " skill point(s).");
}

function devSetSkillPoints() {
    var targetPoints = Number(document.getElementById("dev-set-skill-points-input").value);
    targetPoints = Math.max(0, targetPoints || 0);

    progression.skillPoints = targetPoints;
    normalizeProgression();
    saveProgression();
    updateSkillTreeUI();
    syncDevInputs();
    setDevStatus("Set available skill points to " + progression.skillPoints + ".");
}

function devResetProgression() {
    resetPlayerProgress(true);
    setDevStatus("Progression reset.");
}

function devUnlockAllSkills() {
    progression.ownedSkills = SKILLS.map(function (skill) { return skill.id; });
    progression.spentSkillPoints = progression.ownedSkills.reduce(function (total, skillId) {
        var skill = getSkillById(skillId);
        return total + (skill ? skill.cost : 0);
    }, 0);
    progression.skillPoints = Math.max(progression.skillPoints, 0);
    normalizeProgression();
    saveProgression();
    updateSkillTreeUI();
    syncDevInputs();
    setDevStatus("All skills purchased/unlocked.");
}

function devClearUnlockedSkills() {
    progression.spentSkillPoints = 0;
    progression.ownedSkills = [];
    progression.selectedSkill = "";
    normalizeProgression();
    saveProgression();
    updateSkillTreeUI();
    syncDevInputs();
    setDevStatus("Owned skills cleared.");
}

function devSetActiveSkill() {
    var selected = document.getElementById("dev-active-skill-select").value;
    if (selected && !isSkillOwned(selected)) {
        setDevStatus("Cannot select a locked skill.");
        return;
    }

    progression.selectedSkill = selected;
    saveProgression();
    updateSkillTreeUI();
    setDevStatus("Active skill updated.");
}

function devSetForcedRoll() {
    var value = Number(document.getElementById("dev-force-roll-input").value);
    if (!value || value < 1) {
        setDevStatus("Forced roll must be at least 1.");
        return;
    }

    debugState.forcedNextRoll = value;
    setDevStatus("Next roll forced to " + value + " (clamped to current die size).");
}

function devForceNextSkillTrigger() {
    debugState.forcedSkillTrigger = true;
    setDevStatus("Next eligible skill trigger forced.");
}

function devClearForcedRoll() {
    debugState.forcedNextRoll = null;
    setDevStatus("Forced roll cleared.");
}

function devClearForcedTrigger() {
    debugState.forcedSkillTrigger = false;
    setDevStatus("Forced skill trigger cleared.");
}

function devSetScore() {
    var value = Number(document.getElementById("dev-score-input").value);
    score = value || 0;
    updateGameDisplay();
    setDevStatus("Score set to " + score + ".");
}

function devResetRunStats() {
    resetCurrentRunState(true);
    updateGameDisplay();
    setStatusMessage("Run stats reset.", "info");
    setDevStatus("Current run stats reset.");
}

window.onload = function () {
    normalizeProgression();
    saveProgression();
    updateGameDisplay();
    setStatusMessage("Choose a mode and roll to begin.", "info");
    setRunCompleteMessage("Easy mode: safer, slower progression (1 skill point per 250 score earned). Skill points are awarded during the run.");
    updateSkillTreeUI();
    updateSkillStatusMessage("No skill effect this roll.");
};

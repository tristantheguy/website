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
var SKILLS = [
    { id: "luckyEdge", name: "Lucky Edge", unlockAt: 25, description: "15% chance to add +1 to your roll" },
    { id: "weightedToss", name: "Weighted Toss", unlockAt: 75, description: "10% chance to add +2 to your roll" },
    { id: "secondChance", name: "Second Chance", unlockAt: 150, description: "10% chance to reroll once after a failed roll" }
];

var progression = loadProgression();
var debugState = {
    enabled: false,
    forcedNextRoll: null,
    forcedSkillTrigger: false
};

function loadProgression() {
    var savedProgression = localStorage.getItem("diceGameProgression");
    if (!savedProgression) {
        return {
            totalRolls: 0,
            unlockedSkills: [],
            selectedSkill: ""
        };
    }

    try {
        var parsed = JSON.parse(savedProgression);
        return {
            totalRolls: typeof parsed.totalRolls === "number" ? parsed.totalRolls : 0,
            unlockedSkills: Array.isArray(parsed.unlockedSkills) ? parsed.unlockedSkills : [],
            selectedSkill: typeof parsed.selectedSkill === "string" ? parsed.selectedSkill : ""
        };
    } catch (error) {
        return {
            totalRolls: 0,
            unlockedSkills: [],
            selectedSkill: ""
        };
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

function isSkillUnlocked(skillId) {
    return progression.unlockedSkills.indexOf(skillId) !== -1;
}

function unlockSkillsIfEligible() {
    var unlockedAny = false;
    SKILLS.forEach(function (skill) {
        if (progression.totalRolls >= skill.unlockAt && !isSkillUnlocked(skill.id)) {
            progression.unlockedSkills.push(skill.id);
            unlockedAny = true;
        }
    });

    if (unlockedAny) {
        saveProgression();
    }
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
    if (!isSkillUnlocked(skillId)) {
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
        var unlocked = isSkillUnlocked(skill.id);
        var selected = progression.selectedSkill === skill.id && unlocked;

        skillCard.classList.add(unlocked ? "unlocked" : "locked");
        if (selected) {
            skillCard.classList.add("selected");
        }

        var stateText = unlocked ? (selected ? "Selected" : "Unlocked (click to select)") : "Locked";
        var progressText = unlocked ? "Unlocked at " + skill.unlockAt + " total rolls" : "Progress: " + progression.totalRolls + " / " + skill.unlockAt;

        skillCard.innerHTML = "<h4>" + skill.name + "</h4>" +
            "<p>" + skill.description + "</p>" +
            "<p><strong>Status:</strong> " + stateText + "</p>" +
            "<p>" + progressText + "</p>";

        if (unlocked) {
            skillCard.onclick = function () {
                selectSkill(skill.id);
            };
        }

        skillsContainer.appendChild(skillCard);
    });
}

function updateSkillTreeUI() {
    unlockSkillsIfEligible();

    var skillTreeToggle = document.getElementById("skill-tree-toggle");
    var skillTreePanel = document.getElementById("skill-tree-panel");
    var totalRollsText = document.getElementById("skill-tree-total-rolls");

    var shouldShowSkillTree = progression.totalRolls >= SKILL_TREE_UNLOCK_ROLLS;
    skillTreeToggle.style.display = shouldShowSkillTree ? "block" : "none";
    skillTreePanel.style.display = shouldShowSkillTree ? "block" : "none";

    if (!shouldShowSkillTree) {
        skillTreePanel.classList.remove("open");
    }

    totalRollsText.innerHTML = "Total rolls (all time): " + progression.totalRolls;

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

function rollDice() {
    if (currentDie >= dice.length) {
        alert("Congratulations! You have rolled all of the dice in " + rolls + " rolls!");
        currentDie = 0;
        if (mode == "easy") {
            score = 0;
        }
        rolls = 0;
        wins += 1;
        high = dice.indexOf(dice[currentDie]);
        document.getElementById("roll").innerHTML = "";
        document.getElementById("total").innerHTML = "Rolls: " + rolls;
        document.getElementById("session").innerHTML = "Session Rolls: " + session;
        document.getElementById("wins").innerHTML = "wins: " + wins;
        document.getElementById("high").innerHTML = "Highest Die rolled: " + dice[high];
        document.getElementById("score").innerHTML = score;
        submitScore(score);
        return;
    }

    var requiredRoll = dice[currentDie];
    var initialRoll = getBaseRoll(requiredRoll);
    var finalRoll = initialRoll;
    var skillActivationMessage = "No skill effect this roll.";
    var selectedSkillId = progression.selectedSkill;
    var selectedSkillIsUnlocked = isSkillUnlocked(selectedSkillId);

    if (selectedSkillIsUnlocked && selectedSkillId === "luckyEdge") {
        if (shouldActivateSkill(0.15, true)) {
            finalRoll += 1;
            skillActivationMessage = "Lucky Edge activated! +1 roll";
        }
    }

    if (selectedSkillIsUnlocked && selectedSkillId === "weightedToss") {
        if (shouldActivateSkill(0.10, true)) {
            finalRoll += 2;
            skillActivationMessage = "Weighted Toss activated! +2 roll";
        }
    }

    var failedRoll = finalRoll < requiredRoll;
    if (selectedSkillIsUnlocked && selectedSkillId === "secondChance" && failedRoll) {
        if (shouldActivateSkill(0.10, true)) {
            skillActivationMessage = "Second Chance activated! Rerolling...";
            finalRoll = getRandomRollForDie(requiredRoll);
            failedRoll = finalRoll < requiredRoll;
        }
    }

    rolls += 1;
    session += 1;
    progression.totalRolls += 1;
    unlockSkillsIfEligible();
    saveProgression();

    var pointsAdded = finalRoll;
    if (mode == "normal") {
        pointsAdded *= Math.trunc(Math.ceil(session / 100)) * (Math.abs(losses - (losses * (wins + 1))) + 1);
    }

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

    if (finalRoll >= requiredRoll) {
        currentDie += 1;

        if (currentDie > high) {
            high = currentDie;
        }

        if (currentDie >= dice.length) {
            document.getElementById("roll").innerHTML = "congrats";
            document.getElementById("total").innerHTML = "Rolls: " + rolls;
            document.getElementById("session").innerHTML = "Session Rolls: " + session;
            document.getElementById("wins").innerHTML = "Wins: " + wins;
            document.getElementById("high").innerHTML = "Highest Die rolled: " + dice[high];
        }
    } else {
        if (mode == "normal") {
            alert("You rolled a " + finalRoll + ", which is not high enough. You have been sent back to the beginning.");
            currentDie = 0;
            losses += 1;
            document.getElementById("losses").innerHTML = "losses: " + losses;
        } else {
            alert("You rolled a " + finalRoll + ", which is not high enough. Roll again.");
        }
    }

    document.getElementById("roll").innerHTML = "You rolled a " + finalRoll + " (required: " + requiredRoll + ")";
    document.getElementById("score").innerHTML = "Score: " + score;
    document.getElementById("total").innerHTML = "Rolls: " + rolls;
    document.getElementById("session").innerHTML = "Session Rolls: " + session;
    document.getElementById("wins").innerHTML = "wins: " + wins;
    document.getElementById("high").innerHTML = "Highest Die rolled: " + dice[high];

    updateSkillTreeUI();
    updateSkillStatusMessage(skillActivationMessage);
    setDevStatus("Roll complete. Final roll: " + finalRoll + ".");
}

function setEasyMode() {
    mode = "easy";
    document.getElementById("mode").innerHTML = "Current mode: Easy";
    currentDie = 0;
    score = 0;
    rolls = 0;
    session = 0;
    wins = 0;
    high = dice.indexOf(dice[currentDie]);
    document.getElementById("roll").innerHTML = "";
    document.getElementById("total").innerHTML = "Rolls: " + rolls;
    document.getElementById("session").innerHTML = "Session Rolls: " + session;
    document.getElementById("wins").innerHTML = "wins: " + wins;
    document.getElementById("losses").innerHTML = "";
    document.getElementById("high").innerHTML = "";
    updateSkillStatusMessage("No skill effect this roll.");
    return;
}

function setNormalMode() {
    mode = "normal";
    document.getElementById("mode").innerHTML = "Current mode: Normal";
    currentDie = 0;
    score = 0;
    rolls = 0;
    session = 0;
    wins = 0;
    losses = 0;
    high = dice.indexOf(dice[currentDie]);
    document.getElementById("roll").innerHTML = "";
    document.getElementById("total").innerHTML = "Rolls: " + rolls;
    document.getElementById("session").innerHTML = "Session Rolls: " + session;
    document.getElementById("wins").innerHTML = "wins: " + wins;
    document.getElementById("losses").innerHTML = "losses: " + losses;
    document.getElementById("high").innerHTML = "Highest Die rolled: " + dice[high];
    updateSkillStatusMessage("No skill effect this roll.");
    return;
}

function openDeveloperMenu() {
    debugState.enabled = true;
    document.getElementById("developer-menu").style.display = "block";
    populateDevSkillSelect();
    document.getElementById("dev-total-rolls-input").value = progression.totalRolls;
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
    unlockSkillsIfEligible();
    saveProgression();
    updateSkillTreeUI();
    setDevStatus("Set total rolls to " + progression.totalRolls + ".");
}

function devAddRolls(amount) {
    progression.totalRolls += amount;
    unlockSkillsIfEligible();
    saveProgression();
    updateSkillTreeUI();
    document.getElementById("dev-total-rolls-input").value = progression.totalRolls;
    setDevStatus("Added " + amount + " rolls.");
}

function devResetProgression() {
    progression.totalRolls = 0;
    progression.unlockedSkills = [];
    progression.selectedSkill = "";
    saveProgression();
    updateSkillTreeUI();
    document.getElementById("dev-total-rolls-input").value = progression.totalRolls;
    setDevStatus("Progression reset.");
}

function devUnlockAllSkills() {
    progression.unlockedSkills = SKILLS.map(function (skill) { return skill.id; });
    saveProgression();
    updateSkillTreeUI();
    setDevStatus("All skills unlocked.");
}

function devClearUnlockedSkills() {
    progression.unlockedSkills = [];
    progression.selectedSkill = "";
    saveProgression();
    updateSkillTreeUI();
    setDevStatus("Unlocked skills cleared.");
}

function devSetActiveSkill() {
    var selected = document.getElementById("dev-active-skill-select").value;
    if (selected && !isSkillUnlocked(selected)) {
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
    document.getElementById("score").innerHTML = "Score: " + score;
    setDevStatus("Score set to " + score + ".");
}

function devResetRunStats() {
    currentDie = 0;
    rolls = 0;
    session = 0;
    wins = 0;
    losses = 0;
    high = 0;
    document.getElementById("roll").innerHTML = "Required roll: " + dice[currentDie];
    document.getElementById("total").innerHTML = "Rolls: " + rolls;
    document.getElementById("session").innerHTML = "Session Rolls: " + session;
    document.getElementById("wins").innerHTML = "wins: " + wins;
    document.getElementById("losses").innerHTML = mode === "normal" ? "losses: " + losses : "";
    document.getElementById("high").innerHTML = mode === "normal" ? "Highest Die rolled: " + dice[high] : "";
    setDevStatus("Current run stats reset.");
}

window.onload = function () {
    document.getElementById("mode").innerHTML = "Current mode: " + mode;
    document.getElementById("roll").innerHTML = "Required roll: " + dice[currentDie];
    document.getElementById("score").innerHTML = "Score: " + score;
    document.getElementById("total").innerHTML = "Rolls: " + rolls;
    document.getElementById("session").innerHTML = "Session Rolls: " + session;
    document.getElementById("wins").innerHTML = "wins: " + wins;
    updateSkillTreeUI();
    updateSkillStatusMessage("No skill effect this roll.");
};

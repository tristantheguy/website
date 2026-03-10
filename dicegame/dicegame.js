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
    { id: "luckyEdge", name: "Lucky Edge", cost: 1, description: "15% chance to add +1 to your roll", type: "root" },
    { id: "sharperEdge", name: "Sharper Edge", cost: 1, description: "Lucky Edge trigger chance +5% (20% chance for +1)", type: "branch", parentSkill: "luckyEdge", branchGroup: "luckyEdgeBranch" },
    { id: "heavyEdge", name: "Heavy Edge", cost: 1, description: "Lucky Edge adds +2 instead of +1 (15% chance)", type: "branch", parentSkill: "luckyEdge", branchGroup: "luckyEdgeBranch" },
    { id: "keenEdge", name: "Keen Edge", cost: 1, description: "Sharper Edge improves Lucky Edge to 30% chance for +1", type: "branch", parentSkill: "sharperEdge" },
    { id: "brutalEdge", name: "Brutal Edge", cost: 1, description: "Heavy Edge becomes 15% chance for +3", type: "branch", parentSkill: "heavyEdge", branchGroup: "heavyEdgeTier3" },
    { id: "reliableEdge", name: "Reliable Edge", cost: 1, description: "Heavy Edge becomes 20% chance for +2", type: "branch", parentSkill: "heavyEdge", branchGroup: "heavyEdgeTier3" },
    { id: "momentum", name: "Momentum", cost: 2, description: "+10% score from rolls", type: "root" },
    { id: "greaterMomentum", name: "Greater Momentum", cost: 1, description: "Momentum bonus +5% (total +15% score)", type: "branch", parentSkill: "momentum", branchGroup: "momentumBranch" },
    { id: "criticalMomentum", name: "Critical Momentum", cost: 1, description: "1% chance to double roll score (keeps Momentum +10%)", type: "branch", parentSkill: "momentum", branchGroup: "momentumBranch" },
    { id: "overflowMomentum", name: "Overflow Momentum", cost: 1, description: "Greater Momentum adds +5% more score (total +20%)", type: "branch", parentSkill: "greaterMomentum" },
    { id: "burstMomentum", name: "Burst Momentum", cost: 1, description: "5% chance to add +3 to your roll", type: "branch", parentSkill: "criticalMomentum", branchGroup: "criticalMomentumTier3" },
    { id: "deadlyMomentum", name: "Deadly Momentum", cost: 1, description: "Critical Momentum multiplier increases to 2.2x", type: "branch", parentSkill: "criticalMomentum", branchGroup: "criticalMomentumTier3" },
    { id: "secondChance", name: "Second Chance", cost: 3, description: "10% chance to reroll once after a failed roll", type: "root" },
    { id: "saferChance", name: "Safer Chance", cost: 1, description: "Second Chance trigger chance +5% (15% total)", type: "branch", parentSkill: "secondChance", branchGroup: "secondChanceBranch" },
    { id: "echoChance", name: "Echo Chance", cost: 1, description: "1% chance for one extra reroll if Second Chance reroll also fails", type: "branch", parentSkill: "secondChance", branchGroup: "secondChanceBranch" },
    { id: "steadierChance", name: "Steadier Chance", cost: 1, description: "Safer Chance improves Second Chance to 25% reroll chance", type: "branch", parentSkill: "saferChance" },
    { id: "tripleEcho", name: "Triple Echo", cost: 1, description: "After Echo Chance reroll fails, 5% chance for one final reroll", type: "branch", parentSkill: "echoChance", branchGroup: "echoChanceTier3" },
    { id: "doubleRoll", name: "Double Roll", cost: 1, description: "15% chance to roll two rerolls and keep the better result", type: "branch", parentSkill: "echoChance", branchGroup: "echoChanceTier3" }
];

var ROLL_COOLDOWN_MS = 320;
var isRollCoolingDown = false;
var SKILL_GRAPH_NODE_SIZE = 86;
var SKILL_GRAPH_MIN_WIDTH = 960;
var SKILL_GRAPH_MAX_WIDTH = 1320;
var SKILL_GRAPH_DEFAULT_WIDTH = 1200;
var SKILL_GRAPH_HEIGHT = 680;
var selectedSkillId = null;
var SKILL_GRAPH_LAYOUT = {};

function buildSkillGraphLayout(graphWidth) {
    var centerX = {
        luckyEdge: Math.round(graphWidth * 0.25),
        momentum: Math.round(graphWidth * 0.5),
        secondChance: Math.round(graphWidth * 0.75)
    };
    var tierTwoBranchOffset = Math.round(graphWidth * 0.065);
    var tierThreeWideOffset = Math.round(graphWidth * 0.13);
    var tierThreeMidOffset = Math.round(graphWidth * 0.065);
    var halfNode = SKILL_GRAPH_NODE_SIZE / 2;

    return {
        luckyEdge: { x: centerX.luckyEdge - halfNode, y: 120 },
        sharperEdge: { x: centerX.luckyEdge - tierTwoBranchOffset - halfNode, y: 320 },
        heavyEdge: { x: centerX.luckyEdge + tierTwoBranchOffset - halfNode, y: 320 },
        keenEdge: { x: centerX.luckyEdge - tierThreeWideOffset - halfNode, y: 540 },
        brutalEdge: { x: centerX.luckyEdge - tierThreeMidOffset + tierTwoBranchOffset - halfNode, y: 540 },
        reliableEdge: { x: centerX.luckyEdge + tierThreeMidOffset + tierTwoBranchOffset - halfNode, y: 540 },

        momentum: { x: centerX.momentum - halfNode, y: 120 },
        greaterMomentum: { x: centerX.momentum - tierTwoBranchOffset - halfNode, y: 320 },
        criticalMomentum: { x: centerX.momentum + tierTwoBranchOffset - halfNode, y: 320 },
        overflowMomentum: { x: centerX.momentum - tierTwoBranchOffset - halfNode, y: 540 },
        burstMomentum: { x: centerX.momentum + tierTwoBranchOffset - tierThreeMidOffset - halfNode, y: 540 },
        deadlyMomentum: { x: centerX.momentum + tierTwoBranchOffset + tierThreeMidOffset - halfNode, y: 540 },

        secondChance: { x: centerX.secondChance - halfNode, y: 120 },
        saferChance: { x: centerX.secondChance - tierTwoBranchOffset - halfNode, y: 320 },
        echoChance: { x: centerX.secondChance + tierTwoBranchOffset - halfNode, y: 320 },
        steadierChance: { x: centerX.secondChance - tierTwoBranchOffset - halfNode, y: 540 },
        tripleEcho: { x: centerX.secondChance + tierTwoBranchOffset - tierThreeMidOffset - halfNode, y: 540 },
        doubleRoll: { x: centerX.secondChance + tierTwoBranchOffset + tierThreeMidOffset - halfNode, y: 540 }
    };
}

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
        ownedSkills: []
    };
}

function migrateLegacySkillId(skillId) {
    if (skillId === "weightedToss") {
        return "momentum";
    }

    return skillId;
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
            ownedSkills: Array.isArray(parsed.ownedSkills) ? parsed.ownedSkills.map(migrateLegacySkillId) : []
        };

        if ((!parsed.ownedSkills || parsed.ownedSkills.length === 0) && Array.isArray(parsed.unlockedSkills) && parsed.unlockedSkills.length > 0) {
            progressionState.ownedSkills = parsed.unlockedSkills.map(migrateLegacySkillId).filter(function (skillId) {
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

function getOwnedSkillInBranchGroup(branchGroup) {
    return progression.ownedSkills.find(function (ownedSkillId) {
        var skill = getSkillById(ownedSkillId);
        return skill && skill.branchGroup === branchGroup;
    }) || null;
}

function isSkillLockedByBranchChoice(skillId) {
    var skill = getSkillById(skillId);
    if (!skill || !skill.branchGroup) {
        return false;
    }

    var ownedBranchSkillId = getOwnedSkillInBranchGroup(skill.branchGroup);
    return !!ownedBranchSkillId && ownedBranchSkillId !== skillId;
}

function normalizeProgression() {
    progression.totalRolls = Math.max(0, Number(progression.totalRolls) || 0);
    progression.lifetimeScoreForSkillPoints = Math.max(0, Number(progression.lifetimeScoreForSkillPoints) || 0);
    progression.skillPoints = Math.max(0, Number(progression.skillPoints) || 0);
    progression.spentSkillPoints = Math.max(0, Number(progression.spentSkillPoints) || 0);

    progression.ownedSkills = (Array.isArray(progression.ownedSkills) ? progression.ownedSkills : []).filter(function (skillId, index, list) {
        return !!getSkillById(skillId) && list.indexOf(skillId) === index;
    });

    progression.ownedSkills = progression.ownedSkills.filter(function (skillId) {
        var skill = getSkillById(skillId);
        if (!skill || !skill.parentSkill) {
            return true;
        }

        return progression.ownedSkills.indexOf(skill.parentSkill) !== -1;
    });

    var ownedBranchByGroup = {};
    progression.ownedSkills = progression.ownedSkills.filter(function (skillId) {
        var skill = getSkillById(skillId);
        if (!skill || !skill.branchGroup) {
            return true;
        }

        if (ownedBranchByGroup[skill.branchGroup]) {
            return false;
        }

        ownedBranchByGroup[skill.branchGroup] = skillId;
        return true;
    });

    var minimumSpentFromOwned = progression.ownedSkills.reduce(function (total, skillId) {
        var skill = getSkillById(skillId);
        return total + (skill ? skill.cost : 0);
    }, 0);

    if (progression.spentSkillPoints < minimumSpentFromOwned) {
        progression.spentSkillPoints = minimumSpentFromOwned;
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

    if (skill.parentSkill && !isSkillOwned(skill.parentSkill)) {
        return false;
    }

    if (isSkillLockedByBranchChoice(skillId)) {
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

function isSkillTreePanelOpen() {
    var panel = document.getElementById("skill-tree-panel");
    return !!panel && panel.classList.contains("open");
}

function getVisibleSkills() {
    return SKILLS.filter(function (skill) {
        return skill.type === "root" || isSkillOwned(skill.parentSkill);
    });
}

function getSkillStatusInfo(skill) {
    var owned = isSkillOwned(skill.id);
    var lockedByBranchChoice = isSkillLockedByBranchChoice(skill.id);
    var parentMissing = !!skill.parentSkill && !isSkillOwned(skill.parentSkill);
    var canBuy = canBuySkill(skill.id);

    if (owned) {
        return {
            label: "Owned",
            stateClass: "owned",
            message: "This skill is active and already owned.",
            canBuy: false
        };
    }

    if (lockedByBranchChoice) {
        return {
            label: "Unavailable (Branch Locked)",
            stateClass: "branch-locked",
            message: "Another skill in this branch path is already owned.",
            canBuy: false
        };
    }

    if (parentMissing) {
        return {
            label: "Locked",
            stateClass: "locked",
            message: "Buy the parent skill to reveal and unlock this branch.",
            canBuy: false
        };
    }

    if (canBuy) {
        return {
            label: "Available",
            stateClass: "available",
            message: "This skill is available to buy.",
            canBuy: true
        };
    }

    return {
        label: "Locked",
        stateClass: "locked",
        message: "Not enough skill points to buy this skill.",
        canBuy: false
    };
}

function renderSkills() {
    var viewport = document.getElementById("skill-tree-viewport");
    var canvas = document.getElementById("skill-tree-canvas");
    var connectionLayer = document.getElementById("skill-tree-connections");
    var nodeLayer = document.getElementById("skill-tree-node-layer");
    if (!viewport || !canvas || !connectionLayer || !nodeLayer) {
        return;
    }

    var viewportWidth = viewport.clientWidth || SKILL_GRAPH_DEFAULT_WIDTH;
    var graphWidth = Math.max(SKILL_GRAPH_MIN_WIDTH, Math.min(SKILL_GRAPH_MAX_WIDTH, viewportWidth - 36));
    SKILL_GRAPH_LAYOUT = buildSkillGraphLayout(graphWidth);

    var visibleSkills = getVisibleSkills();
    var visibleSkillMap = {};
    visibleSkills.forEach(function (skill) {
        visibleSkillMap[skill.id] = true;
    });

    if (selectedSkillId && !visibleSkillMap[selectedSkillId]) {
        selectedSkillId = null;
    }

    nodeLayer.innerHTML = "";
    connectionLayer.innerHTML = "";
    canvas.style.width = graphWidth + "px";
    canvas.style.height = SKILL_GRAPH_HEIGHT + "px";

    connectionLayer.setAttribute("width", String(graphWidth));
    connectionLayer.setAttribute("height", String(SKILL_GRAPH_HEIGHT));
    connectionLayer.setAttribute("viewBox", "0 0 " + graphWidth + " " + SKILL_GRAPH_HEIGHT);
    connectionLayer.setAttribute("preserveAspectRatio", "none");

    var renderedNodeElements = {};

    visibleSkills.forEach(function (skill) {
        var renderedNode = renderSingleSkillNode(skill);
        nodeLayer.appendChild(renderedNode);
        renderedNodeElements[skill.id] = renderedNode;
    });

    visibleSkills.forEach(function (skill) {
        if (skill.parentSkill && visibleSkillMap[skill.parentSkill]) {
            renderConnectorLine(connectionLayer, skill.parentSkill, skill.id, renderedNodeElements[skill.parentSkill], renderedNodeElements[skill.id]);
        }
    });
    renderSkillDetailPanel();
}

function renderSingleSkillNode(skill) {
        var skillNode = document.createElement("button");
        skillNode.type = "button";
        skillNode.className = "skill-node";
        var status = getSkillStatusInfo(skill);
        var nodePosition = SKILL_GRAPH_LAYOUT[skill.id] || { x: 0, y: 0 };

        skillNode.style.left = nodePosition.x + "px";
        skillNode.style.top = nodePosition.y + "px";
        skillNode.classList.add(status.stateClass);
        if (selectedSkillId === skill.id) {
            skillNode.classList.add("selected");
        }

        skillNode.textContent = skill.name;
        skillNode.setAttribute("aria-label", skill.name + " - " + status.label);
        skillNode.dataset.skillId = skill.id;
        skillNode.dataset.tooltip = skill.name + "\n" + skill.description + "\nStatus: " + status.label;

        skillNode.addEventListener("mouseenter", function (event) {
            showSkillTooltip(event.currentTarget);
        });
        skillNode.addEventListener("mousemove", function (event) {
            updateSkillTooltipPosition(event.clientX, event.clientY);
        });
        skillNode.addEventListener("mouseleave", hideSkillTooltip);
        skillNode.addEventListener("focus", function (event) {
            showSkillTooltip(event.currentTarget);
        });
        skillNode.addEventListener("blur", hideSkillTooltip);
        skillNode.addEventListener("click", function () {
            selectedSkillId = skill.id;
            renderSkills();
        });

        return skillNode;
}

function renderSkillDetailPanel() {
    var detailPanel = document.getElementById("skill-detail-panel");
    if (!detailPanel) {
        return;
    }

    if (!selectedSkillId) {
        detailPanel.innerHTML = '<p class="skill-detail-empty">Click a skill node to view details.</p>';
        return;
    }

    var skill = getSkillById(selectedSkillId);
    if (!skill) {
        detailPanel.innerHTML = '<p class="skill-detail-empty">Click a skill node to view details.</p>';
        return;
    }

    var status = getSkillStatusInfo(skill);
    var html = "<h4>" + skill.name + "</h4>" +
        "<p>" + skill.description + "</p>" +
        "<p><strong>Cost:</strong> " + skill.cost + " skill point(s)</p>" +
        "<p><strong>Status:</strong> " + status.label + "</p>";

    if (status.canBuy) {
        html += '<button id="skill-detail-buy-button" type="button">Buy Skill</button>';
    } else {
        html += "<p class=\"skill-detail-message\">" + status.message + "</p>";
    }

    detailPanel.innerHTML = html;

    var buyButton = document.getElementById("skill-detail-buy-button");
    if (buyButton) {
        buyButton.addEventListener("click", function () {
            buySkill(skill.id);
        });
    }
}

function showSkillTooltip(skillNode) {
    var tooltip = document.getElementById("skill-node-tooltip");
    if (!tooltip || !skillNode) {
        return;
    }

    tooltip.textContent = skillNode.dataset.tooltip || "";
    tooltip.setAttribute("aria-hidden", "false");
    tooltip.classList.add("visible");

    var rect = skillNode.getBoundingClientRect();
    updateSkillTooltipPosition(rect.right, rect.top);
}

function updateSkillTooltipPosition(clientX, clientY) {
    var tooltip = document.getElementById("skill-node-tooltip");
    if (!tooltip || !tooltip.classList.contains("visible")) {
        return;
    }

    var offset = 14;
    tooltip.style.left = clientX + offset + "px";
    tooltip.style.top = clientY + offset + "px";
}

function hideSkillTooltip() {
    var tooltip = document.getElementById("skill-node-tooltip");
    if (!tooltip) {
        return;
    }

    tooltip.classList.remove("visible");
    tooltip.setAttribute("aria-hidden", "true");
}

function renderConnectorLine(svgElement, parentSkillId, childSkillId, parentNode, childNode) {
    if (!parentNode || !childNode) {
        return;
    }

    var parentOwned = isSkillOwned(parentSkillId);
    var childOwned = isSkillOwned(childSkillId);
    var childUnavailable = isSkillLockedByBranchChoice(childSkillId);
    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.setAttribute("x1", String(parentNode.offsetLeft + (parentNode.offsetWidth / 2)));
    line.setAttribute("y1", String(parentNode.offsetTop + (parentNode.offsetHeight / 2)));
    line.setAttribute("x2", String(childNode.offsetLeft + (childNode.offsetWidth / 2)));
    line.setAttribute("y2", String(childNode.offsetTop + (childNode.offsetHeight / 2)));

    if (parentOwned && childOwned) {
        line.classList.add("path-active");
    } else if (childUnavailable) {
        line.classList.add("path-disabled");
    }

    svgElement.appendChild(line);
}

function updateSkillTreeUI() {
    normalizeProgression();

    var skillTreeToggle = document.getElementById("skill-tree-toggle");
    var skillTreePanel = document.getElementById("skill-tree-panel");
    var totalRollsText = document.getElementById("skill-tree-total-rolls");
    var skillPointsText = document.getElementById("skill-tree-skill-points");
    var lifetimeScoreText = document.getElementById("skill-tree-lifetime-score");
    var ownedSkillsText = document.getElementById("skill-tree-owned-skills");

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

    renderSkills();

    updateSkillStatusMessage();
}

function updateSkillStatusMessage(lastEffectMessage) {
    var activeSkillElement = document.getElementById("active-skill");
    var activationMessageElement = document.getElementById("skill-activation-message");
    var activeSkills = progression.ownedSkills.map(function (skillId) {
        var skill = getSkillById(skillId);
        return skill ? skill.name : "";
    }).filter(Boolean);

    activeSkillElement.innerHTML = "Active Skills: " + (activeSkills.length ? activeSkills.join(", ") : "None");
    if (typeof lastEffectMessage === "string") {
        activationMessageElement.innerHTML = "Last Skill Effect: " + lastEffectMessage;
    }
}

function showFloatingText(message, anchorElement, type) {
    if (!message || !anchorElement) {
        return;
    }

    var anchorRect = anchorElement.getBoundingClientRect();
    var particle = document.createElement("span");
    var randomAngle = (-130 + (Math.random() * 80)) * (Math.PI / 180);
    var randomDistance = 70 + Math.random() * 130;
    var randomDuration = 750 + Math.random() * 650;
    var randomScale = 0.92 + Math.random() * 0.22;
    var xTravel = Math.cos(randomAngle) * randomDistance;
    var yTravel = Math.sin(randomAngle) * randomDistance;

    particle.className = "floating-text floating-text-" + (type || "skill");
    particle.textContent = message;
    particle.style.left = (anchorRect.left + (anchorRect.width / 2) + ((Math.random() * 24) - 12)) + "px";
    particle.style.top = (anchorRect.top + (anchorRect.height * 0.35) + ((Math.random() * 18) - 9)) + "px";
    particle.style.setProperty("--float-x", xTravel.toFixed(2) + "px");
    particle.style.setProperty("--float-y", yTravel.toFixed(2) + "px");
    particle.style.setProperty("--float-duration", randomDuration.toFixed(0) + "ms");
    particle.style.setProperty("--float-scale", randomScale.toFixed(2));
    document.body.appendChild(particle);

    particle.addEventListener("animationend", function () {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
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

function getRerollForFailedCheck(requiredRoll) {
    var firstReroll = getRandomRollForDie(requiredRoll);
    if (isSkillOwned("doubleRoll") && shouldActivateSkill(0.15, false)) {
        var secondReroll = getRandomRollForDie(requiredRoll);
        showFloatingText("Double Roll!", document.getElementById("roll-button"), "skill");
        return Math.max(firstReroll, secondReroll);
    }

    return firstReroll;
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
    var skillActivationMessages = [];
    normalizeProgression();
    var hasLuckyEdge = isSkillOwned("luckyEdge");
    var hasSecondChance = isSkillOwned("secondChance");
    var hasMomentum = isSkillOwned("momentum");

    if (hasLuckyEdge) {
        var luckyEdgeBonus = 1;
        var luckyEdgeChance = 0.15;

        if (isSkillOwned("heavyEdge")) {
            luckyEdgeBonus = isSkillOwned("brutalEdge") ? 3 : 2;
            luckyEdgeChance = isSkillOwned("reliableEdge") ? 0.20 : 0.15;
        } else if (isSkillOwned("sharperEdge")) {
            luckyEdgeChance = isSkillOwned("keenEdge") ? 0.30 : 0.20;
        }

        if (shouldActivateSkill(luckyEdgeChance, true)) {
            finalRoll += luckyEdgeBonus;
            skillActivationMessages.push("Lucky Edge +" + luckyEdgeBonus);
            showFloatingText("Lucky Edge +" + luckyEdgeBonus, document.getElementById("roll-button"), "skill");
        }
    }

    var failedRoll = finalRoll < requiredRoll;
    if (hasSecondChance && failedRoll) {
        var secondChanceChance = isSkillOwned("steadierChance") ? 0.25 : (isSkillOwned("saferChance") ? 0.15 : 0.10);

        if (shouldActivateSkill(secondChanceChance, true)) {
            skillActivationMessages.push("Second Chance!");
            showFloatingText("Second Chance!", document.getElementById("roll-button"), "skill");
            finalRoll = getRerollForFailedCheck(requiredRoll);
            failedRoll = finalRoll < requiredRoll;

            if (failedRoll && isSkillOwned("echoChance") && shouldActivateSkill(0.01, true)) {
                skillActivationMessages.push("Echo Chance!");
                showFloatingText("Echo Chance!", document.getElementById("roll-button"), "skill");
                finalRoll = getRerollForFailedCheck(requiredRoll);
                failedRoll = finalRoll < requiredRoll;

                if (failedRoll && isSkillOwned("tripleEcho") && shouldActivateSkill(0.05, false)) {
                    skillActivationMessages.push("Triple Echo!");
                    showFloatingText("Triple Echo!", document.getElementById("roll-button"), "skill");
                    finalRoll = getRandomRollForDie(requiredRoll);
                    failedRoll = finalRoll < requiredRoll;
                }
            }
        }
    }

    if (hasMomentum && isSkillOwned("burstMomentum") && shouldActivateSkill(0.05, true)) {
        finalRoll += 3;
        skillActivationMessages.push("Burst Momentum +3");
        showFloatingText("Burst Momentum +3", document.getElementById("roll-button"), "skill");
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

    if (hasMomentum) {
        var baseScoreGained = score - scoreBeforeRoll;
        if (baseScoreGained > 0) {
            var momentumRate = isSkillOwned("greaterMomentum") ? 0.15 : 0.10;
            if (isSkillOwned("overflowMomentum")) {
                momentumRate = 0.20;
            }
            var momentumBonus = Math.round(baseScoreGained * momentumRate);
            if (momentumBonus > 0) {
                score += momentumBonus;
                skillActivationMessages.push("Momentum +" + Math.round(momentumRate * 100) + "% Score");
                showFloatingText("Momentum +" + Math.round(momentumRate * 100) + "% Score", document.getElementById("roll-button"), "skill");
            }

            if (isSkillOwned("criticalMomentum") && shouldActivateSkill(0.01, true)) {
                var criticalMomentumBonus = Math.round((score - scoreBeforeRoll) * (isSkillOwned("deadlyMomentum") ? 1.2 : 1));
                if (criticalMomentumBonus > 0) {
                    score += criticalMomentumBonus;
                    skillActivationMessages.push("Critical Momentum x" + (isSkillOwned("deadlyMomentum") ? "2.2" : "2") + "!");
                    showFloatingText("Critical Momentum x" + (isSkillOwned("deadlyMomentum") ? "2.2" : "2") + "!", document.getElementById("roll-button"), "skill");
                }
            }
        }
    }

    var scoreGained = score - scoreBeforeRoll;
    if (scoreGained > 0) {
        showFloatingText("+" + scoreGained, document.getElementById("score") || document.getElementById("roll-button"), "score");
    }

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
            updateSkillStatusMessage(skillActivationMessages.length ? skillActivationMessages.join(", ") : "No skill effect this roll.");
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
    updateSkillStatusMessage(skillActivationMessages.length ? skillActivationMessages.join(", ") : "No skill effect this roll.");
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
    progression.ownedSkills = SKILLS.map(function (skill) {
        return skill.id;
    });
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
    normalizeProgression();
    saveProgression();
    updateSkillTreeUI();
    syncDevInputs();
    setDevStatus("Owned skills cleared.");
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

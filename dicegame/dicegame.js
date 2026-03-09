// define variables to store the list of dice and the mode
var dice = [4, 6, 8, 10, 12, 20];
var mode = "easy";
var currentDie = 0;
var wins = 0;
var losses = 0;
var score = 0;
var rolls = 0;
var session = 0;
var high = 0;

var POWERUP_ID_LOADED_DICE = "loadedDice";
var POWERUP_UNLOCK_ROLLS = 50;
var progression = loadProgression();

function loadProgression() {
    var savedProgression = localStorage.getItem("diceGameProgression");
    if (!savedProgression) {
        return {
            totalRolls: 0,
            unlockedPowerups: [],
            selectedPowerup: ""
        };
    }

    try {
        var parsed = JSON.parse(savedProgression);
        return {
            totalRolls: typeof parsed.totalRolls === "number" ? parsed.totalRolls : 0,
            unlockedPowerups: Array.isArray(parsed.unlockedPowerups) ? parsed.unlockedPowerups : [],
            selectedPowerup: typeof parsed.selectedPowerup === "string" ? parsed.selectedPowerup : ""
        };
    } catch (error) {
        return {
            totalRolls: 0,
            unlockedPowerups: [],
            selectedPowerup: ""
        };
    }
}

function saveProgression() {
    localStorage.setItem("diceGameProgression", JSON.stringify(progression));
}

function unlockPowerupsIfEligible() {
    if (progression.totalRolls >= POWERUP_UNLOCK_ROLLS && progression.unlockedPowerups.indexOf(POWERUP_ID_LOADED_DICE) === -1) {
        progression.unlockedPowerups.push(POWERUP_ID_LOADED_DICE);
        saveProgression();
    }
}

function isPowerupUnlocked(powerupId) {
    return progression.unlockedPowerups.indexOf(powerupId) !== -1;
}

function togglePowerupsMenu() {
    var panel = document.getElementById("powerups-panel");
    panel.classList.toggle("open");
    updatePowerupsUI();
}

function selectPowerup(powerupId) {
    if (!isPowerupUnlocked(powerupId)) {
        return;
    }

    progression.selectedPowerup = progression.selectedPowerup === powerupId ? "" : powerupId;
    saveProgression();
    updatePowerupsUI();
}

function updatePowerupsUI() {
    var powerupCard = document.getElementById("loaded-dice-powerup");
    var progressText = document.getElementById("loaded-dice-progress");
    var statusText = document.getElementById("loaded-dice-status");
    var totalRollsText = document.getElementById("powerups-total-rolls");
    var activationMessage = document.getElementById("powerup-activation-message");

    unlockPowerupsIfEligible();

    var unlocked = isPowerupUnlocked(POWERUP_ID_LOADED_DICE);
    var selected = progression.selectedPowerup === POWERUP_ID_LOADED_DICE;

    powerupCard.classList.remove("locked", "unlocked", "selected");
    powerupCard.classList.add(unlocked ? "unlocked" : "locked");

    if (selected) {
        powerupCard.classList.add("selected");
    }

    totalRollsText.innerHTML = "Total rolls (all time): " + progression.totalRolls;

    if (unlocked) {
        statusText.innerHTML = selected ? "Selected" : "Unlocked (click to select)";
        progressText.innerHTML = "Unlocks at 50 total rolls";
    } else {
        statusText.innerHTML = "Locked";
        progressText.innerHTML = "Unlocks at 50 total rolls<br>Current progress: " + progression.totalRolls + " / 50";
    }

    if (!selected) {
        activationMessage.innerHTML = "";
    }
}

function showPowerupActivationMessage(message) {
    var activationMessage = document.getElementById("powerup-activation-message");
    activationMessage.innerHTML = message;
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

    var roll = Math.floor(Math.random() * dice[currentDie]) + 1;

    if (progression.selectedPowerup === POWERUP_ID_LOADED_DICE && isPowerupUnlocked(POWERUP_ID_LOADED_DICE)) {
        roll = dice[currentDie];
        showPowerupActivationMessage("Loaded Dice activated! Maximum roll!");
    } else {
        showPowerupActivationMessage("");
    }

    var pointsAdded = roll;
    rolls += 1;
    session += 1;
    progression.totalRolls += 1;
    unlockPowerupsIfEligible();
    saveProgression();
    updatePowerupsUI();

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
        score += roll;
    }

    if (roll >= dice[currentDie]) {
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
            alert("You rolled a " + roll + ", which is not high enough. You have been sent back to the beginning.");
            currentDie = 0;
            losses += 1;
            document.getElementById("roll").innerHTML = "Required roll: " + dice[currentDie];
            document.getElementById("total").innerHTML = "Rolls: " + rolls;
            document.getElementById("session").innerHTML = "Session Rolls: " + session;
            document.getElementById("wins").innerHTML = "wins: " + wins;
            document.getElementById("losses").innerHTML = "losses: " + losses;
            document.getElementById("high").innerHTML = "Highest Die rolled: " + dice[high];
        } else {
            alert("You rolled a " + roll + ", which is not high enough. Roll again.");
        }
    }

    document.getElementById("roll").innerHTML = "You rolled a " + roll + " (required: " + dice[currentDie] + ")";
    document.getElementById("score").innerHTML = "Score: " + score;
    document.getElementById("total").innerHTML = "Rolls: " + rolls;
    document.getElementById("session").innerHTML = "Session Rolls: " + session;
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
    document.getElementById("roll").innerHTML = "";
    document.getElementById("total").innerHTML = "Rolls: " + rolls;
    document.getElementById("session").innerHTML = "Session Rolls: " + session;
    document.getElementById("wins").innerHTML = "wins: " + wins;
    document.getElementById("losses").innerHTML = "losses: " + losses;
    document.getElementById("high").innerHTML = "Highest Die rolled: " + dice[high];
    return;
}

window.onload = function () {
    document.getElementById("mode").innerHTML = "Current mode: " + mode;
    document.getElementById("roll").innerHTML = "Required roll: " + dice[currentDie];
    document.getElementById("score").innerHTML = "Score: " + score;
    document.getElementById("total").innerHTML = "Rolls: " + rolls;
    document.getElementById("session").innerHTML = "Session Rolls: " + session;
    document.getElementById("wins").innerHTML = "wins: " + wins;
    updatePowerupsUI();
};

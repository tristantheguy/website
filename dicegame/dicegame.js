
        // define variables to store the list of dice and the mode
        var dice = [4, 6, 8, 10, 12, 20];
        var mode = "easy"; // define a variable to keep track of the current die that the player is on
        var currentDie = 0;
        var wins = 0; //defines variable to store amount of times won
        var losses = 0; //defines value to sotre losses
        // define a variable to store the player's current score
        var score = 0;

        // define a variable to store the number of rolls that the player has taken
        var rolls = 0;

        //defines a variable to store how many times you have rolled forever
        var session = 0;

        //defines highest variable to store die rolled this sessioon

        var high = 0;
        // define a function to roll the dice
        function rollDice() {
			
			            // if the player has rolled all of the dice, display a congratulations message and reset the game
            if (currentDie >= dice.length) {
                alert("Congratulations! You have rolled all of the dice in " + rolls + " rolls!");
                currentDie = 0;
                if (mode == "easy") { score = 0;}
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

            // roll the current die
            var roll = Math.floor(Math.random() * dice[currentDie]) + 1;
            var pointsAdded = roll;
			 rolls += 1;
             session += 1;
            if (mode == "normal") {
                pointsAdded *= Math.trunc(Math.ceil(session / 100)) * (Math.abs(losses - (losses * (wins + 1))) + 1);
            }

            // check the value of dice[currentDie] and increment the score accordingly
            if (dice[currentDie] == 4 & mode=="normal") {
                score += pointsAdded;
            } else if (dice[currentDie] == 6 & mode=="normal") {
                score += pointsAdded * 2;
            } else if (dice[currentDie] == 8 & mode=="normal") {
                score += pointsAdded * 4;
            } else if (dice[currentDie] == 10 & mode=="normal") {
                score += pointsAdded * 8;
            } else if (dice[currentDie] == 12 & mode=="normal") {
                score += pointsAdded * 16;
            } else if (dice[currentDie] == 20 & mode=="normal") {
                score += pointsAdded * 128;
            } else {score += roll}
			
			            // if the roll is equal to or higher than the required number to move on to the next die, increment the current die and add the roll to the player's score
            if (roll >= dice[currentDie]) {
                currentDie += 1;

               
                if (currentDie > high) {
                    high = currentDie;
                }
                // if the player has rolled a 20 on the final die, clear the "required" text from the page and display the total number of rolls
                if (currentDie >= dice.length) {
                    document.getElementById("roll").innerHTML = "congrats";
                    document.getElementById("total").innerHTML = "Rolls: " + rolls;
                    document.getElementById("session").innerHTML = "Session Rolls: " + session;
                    document.getElementById("wins").innerHTML = "Wins: " + wins;
                    document.getElementById("high").innerHTML = "Highest Die rolled: " + dice[high];
                }
            }
            // if the roll is not high enough, display a message and let the player roll again
            else {
                // if the mode is "normal", reset the game
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
                   
                }
                // if the mode is "easy", just display a message and let the player roll again
                else {
                    
                    alert("You rolled a " + roll + ", which is not high enough. Roll again.");
                }
            }

            // increment the number of rolls that the player has taken
          

            // update the display to show the player's roll, score and the required number for the current die
            document.getElementById("roll").innerHTML = "You rolled a " + roll + " (required: " + dice[currentDie] + ")";
            document.getElementById("score").innerHTML = "Score: " + score;
            document.getElementById("total").innerHTML = "Rolls: " + rolls;
            document.getElementById("session").innerHTML = "Session Rolls: " + session;
			  
			 
        } // define a function to set the mode to easy
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

        // define a function to set the mode to normal
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

        // when the page loads, display the required roll for the first die
        window.onload = function() {
            document.getElementById("mode").innerHTML = "Current mode: " + mode;
            document.getElementById("roll").innerHTML = "Required roll: " + dice[currentDie];
            document.getElementById("score").innerHTML = "Score: " + score;
            document.getElementById("total").innerHTML = "Rolls: " + rolls;
            document.getElementById("session").innerHTML = "Session Rolls: " + session;
            document.getElementById("wins").innerHTML = "wins: " + wins;

        }

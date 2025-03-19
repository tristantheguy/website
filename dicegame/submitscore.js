function submitScore() {
    // Get the player's name and score
    var name = document.getElementById("name").value;
    document.getElementById("score").value = score;
    // Send a request to the server to insert the data into the database
    fetch('submit.php', {
        method: 'POST',
        body: JSON.stringify({ name: name, score: score }),
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.text())
        .then(data => {
            console.log(data);
        });
}
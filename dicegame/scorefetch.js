fetch('leaderboard.php')
.then(response => response.text())
.then(data => {
    document.getElementById("leaderboard").innerHTML = data;
})
.catch(error => {
    console.error('Error fetching leaderboard:', error);
});
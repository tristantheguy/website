<?php
  // Connect to the database
  $host = "localhost";
  $username = "1150214";
  $password = "Goose99seven";
  $dbname = "1150214db2";
  $conn = mysqli_connect($host, $username, $password, $dbname);

  // Select data from the leaderboard table
  $query = "SELECT name, score FROM leaderboard ORDER BY score DESC";
  $result = mysqli_query($conn, $query);

  // Check if there are any rows in the result set
  if(mysqli_num_rows($result) > 0) {
    // Create a table to display the leaderboard data
    echo "<table>";
    echo "<tr>";
    echo "<th>name</th>";
    echo "<th>Score</th>";
    echo "</tr>";

    // Output data of each row
    while($row = mysqli_fetch_assoc($result)) {
      echo "<tr>";
      echo "<td>" . $row['name'] . "</td>";
      echo "<td>" . $row['score'] . "</td>";
      echo "</tr>";
    }
    echo "</table>";
  } else {
    echo "No scores have been submitted yet.";
  }
  mysqli_close($conn);
?>

<?php
  header("Access-Control-Allow-Origin: *");
  
  // Connect to the database
  $host = "localhost";
  $username = "1150214";
  $password = "Goose99seven";
  $dbname = "1150214db2";
  $conn = mysqli_connect($host, $username, $password, $dbname);
  
  // Retrieve the data from the form
  $data = json_decode(file_get_contents('php://input'), true);
  $name = $data['name'];
  $score = $data['score'];
  
  // Insert the data into the database
  $query = "INSERT INTO leaderboard (name, score) VALUES ('$name', '$score')";
  mysqli_query($conn, $query);
  
  // Close the connection
  mysqli_close($conn);
?>
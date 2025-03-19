<?php
  // Connect to the database
  $host = "localhost";
  $username = "1150214";
  $password = "Goose99seven";
  $dbname = "1150214";
  $conn = mysqli_connect($host, $username, $password, $dbname);

  // Check connection
  if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
  }

  // Get the message data from the form
  $username = mysqli_real_escape_string($conn, $_POST["username"]);
  $message = mysqli_real_escape_string($conn, $_POST["message"]);

  // Insert the message into the 'messages' table
  $sql = "INSERT INTO messages (username, message) VALUES ('$username', '$message')";
  if (mysqli_query($conn, $sql)) {
    // Redirect to the 'message.php' page
    header("Location: http://www.marksnpcgenerator.ga/message.php");
    exit;
  } else {
    echo "Error: " . $sql . "<br>" . mysqli_error($conn);
  }

  // Close connection
  mysqli_close($conn);
?>

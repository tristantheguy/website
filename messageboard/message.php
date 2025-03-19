<html>
  <head>
    <title>Message Board</title>
    <meta http-equiv="refresh" content="-1">
  </head>
  <head1> 
  <button onclick="location.href='hostindex.html'">Return to Homepage</button>
  </head1>
  <body>
    <!-- Form for posting a new message -->
    <form action="post_message.php" method="post">
      <label for="username">Username:</label><br>
      <input type="text" id="username" name="username"><br>
      <label for="message">Message:</label><br>
      <textarea id="message" name="message"></textarea><br>
      <input type="submit" value="Submit">
    </form>

    <!-- Display messages from the 'messages' table -->
    <h2>Messages</h2>
    <div id="messages">
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

        // Retrieve and display messages from the 'messages' table
        $sql = "SELECT * FROM messages ORDER BY id DESC";
        $result = mysqli_query($conn, $sql);
        if (mysqli_num_rows($result) > 0) {
          while($row = mysqli_fetch_assoc($result)) {
            echo "<p><strong>" . $row["username"] . "</strong>: " . $row["message"] . "</p>";
          }
        } else {
          echo "<p>No messages yet.</p>";
        }

        // Close connection
        mysqli_close($conn);
      ?>
    </div>
  </body>
<div style="position: relative;background-color: blue; width: 600px; height: 800px;">    

    <div style="position: absolute; bottom: 5px; background-color: green">
    TEST (C) 2010
    </div>
</div>
</html>

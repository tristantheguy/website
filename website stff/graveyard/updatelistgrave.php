<?php
// Connect to the database
$link = mysqli_connect("localhost", "1150214", "Goose99seven", "1150214");

// Get the character from the POST request
$character = mysqli_real_escape_string($link, $_POST["character"]);

// Update the count and character list in the database
$query = "UPDATE characters SET count=count+1, characters=CONCAT(characters, ',$character')";
mysqli_query($link, $query);

mysqli_close($link);
?>

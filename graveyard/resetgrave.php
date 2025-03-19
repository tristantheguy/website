<?php
// Connect to the database
$link = mysqli_connect("localhost", "1150214", "Goose99seven", "1150214");

// Reset the count and character list in the database
$query = "UPDATE characters SET count=0, characters=''";
mysqli_query($link, $query);

mysqli_close($link);
?>

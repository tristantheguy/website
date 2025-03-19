<?php
// Connect to the database
$link = mysqli_connect("localhost", "1150214", "Goose99seven", "1150214");

// Get the current count and character list
$query = "SELECT * FROM characters";
$result = mysqli_query($link, $query);
$row = mysqli_fetch_assoc($result);

$count = $row["count"];
$characters = explode(",", $row["characters"]);

echo json_encode(array("count" => $count, "characters" => $characters));

mysqli_close($link);
?>

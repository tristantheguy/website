// JavaScript
var form = document.getElementById("form");
var counter = document.getElementById("counter");
var resetButton = document.getElementById("reset-button");
var characters = document.getElementById("characters");

// Get the current count and character list from the server
function getData() {
  fetch("getcurrentgrave.php")
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      counter.innerHTML = data.count;
      data.characters.forEach(function(character) {
        var listItem = document.createElement("li");
        listItem.innerHTML = character;
        characters.appendChild(listItem);
      });
    });
}
getData();

// Add a new character to the list and update the count on the server
form.addEventListener("submit", function(event) {
  event.preventDefault();

  var name = document.getElementById("name").value;
  var characterClass = document.getElementById("class").value;
  var level = document.getElementById("level").value;
  var death = document.getElementById("death").value;

  var character = `${name} - ${characterClass} - Level ${level} - Died ${death}`;

  fetch("updatelistgrave.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `character=${character}`
  }).then(function() {
    getData();
  });
});

// Reset the counter
resetButton.addEventListener("click", function() {
  fetch("resetgrave.php", { method: "POST" }).then(function() {
    getData();
  });
});

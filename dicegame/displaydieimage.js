function displayDieImage(currentDie, roll){
    //create an image element
    var img = document.createElement("img");
    //set the source of the image based on the die and roll
    img.src = `diceImages/d${dice[currentDie]}-${roll}.png`;
    //append the image to the body of the HTML
    document.body.appendChild(img);
}

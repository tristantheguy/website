async function predictPrice() {
  const item = document.getElementById('item').value;
  const prediction = await getPricePrediction(item);
  document.getElementById('prediction').innerHTML = prediction;
}

async function getPricePrediction(item) {
  const response = await fetch(`/predict?item=${item}`);
  const prediction = await response.text();
  return prediction;
}
import { CAPACITIES, INITIAL, pour, solved } from './puzzle.mjs';
let amounts = [...INITIAL];
let history = [];
let selected = null;
let released = false;
const names = ['Elder', 'Heartwood', 'Seedling'];
const vats = document.querySelector('#vats');
const status = document.querySelector('#status');
const undo = document.querySelector('#undo');
const lever = document.querySelector('#lever');
const treasure = document.querySelector('#treasure');
const message = document.querySelector('#treasure-message');
for (const [i, capacity] of CAPACITIES.entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'vat-button';
  button.innerHTML = `<span class="vat-name">${names[i]}</span><span class="capacity">${capacity}-measure vat</span><span class="vessel" aria-hidden="true"><span class="vat-rim"></span><span class="vat-window"><span class="liquid"><span class="surface"></span></span><span class="measure-lines"></span></span><span class="vat-band band-top"></span><span class="vat-band band-bottom"></span><span class="carving">${['VIII', 'V', 'III'][i]}</span></span><span class="quantity"></span><span class="selection-label" aria-hidden="true">Select source</span>`;
  button.addEventListener('click', () => select(i));
  vats.append(button);
}
const buttons = [...vats.children];
function render() {
  buttons.forEach((button, i) => {
    button.classList.toggle('selected', selected === i);
    button.classList.toggle('destination', selected !== null && selected !== i && amounts[i] < CAPACITIES[i]);
    button.setAttribute('aria-pressed', String(selected === i));
    button.setAttribute('aria-label', `${names[i]} vat: ${amounts[i]} of ${CAPACITIES[i]} measures. ${selected === i ? 'Selected source; activate to cancel.' : selected === null ? 'Select as source.' : 'Pour here.'}`);
    button.querySelector('.liquid').classList.toggle('empty', amounts[i] === 0);
    button.querySelector('.liquid').style.height = `${amounts[i] / CAPACITIES[i] * 100}%`;
    button.querySelector('.quantity').textContent = `${amounts[i]} / ${CAPACITIES[i]}`;
    button.querySelector('.selection-label').textContent = selected === i ? 'Source selected' : selected !== null ? 'Pour here' : 'Select source';
  });
  document.querySelector('#moves').textContent = history.length;
  undo.disabled = history.length === 0;
  lever.disabled = !solved(amounts) || released;
  document.querySelector('#lever-state').textContent = released ? 'Released' : solved(amounts) ? 'Awakened' : 'Locked';
  treasure.classList.toggle('ready', solved(amounts));
  treasure.classList.toggle('released', released);
  message.textContent = released ? 'Golden light spills into the vault. The roots retreat, and the treasure is yours.' : solved(amounts) ? 'The offering is accepted. Pull the lever to claim the treasure.' : 'The roots hold fast. Make the offering to awaken the lever.';
}
function select(i) {
  if (selected === null) {
    if (amounts[i] === 0) { status.textContent = `${names[i]} is empty. Select a vat containing sap.`; return; }
    selected = i;
    status.textContent = `${names[i]} selected. Choose a destination, or tap it again to cancel.`;
  } else if (selected === i) {
    selected = null;
    status.textContent = 'Selection cleared. Select a vat to pour.';
  } else {
    const source = selected;
    const next = pour(amounts, source, i);
    const transferred = amounts[source] - next[source];
    selected = null;
    if (transferred > 0) {
      history.push([...amounts]);
      amounts = next;
      released = false;
      status.textContent = solved(amounts) ? 'The offering is balanced. The treasure lever has awakened.' : `${transferred} ${transferred === 1 ? 'measure' : 'measures'} poured from ${names[source]} to ${names[i]}.`;
    } else status.textContent = `${names[i]} is full. No sap was transferred.`;
  }
  render();
}
undo.addEventListener('click', () => {
  if (!history.length) return;
  amounts = history.pop(); selected = null; released = false;
  status.textContent = 'Last transfer undone. Select a vat to continue.';
  render();
});
document.querySelector('#reset').addEventListener('click', () => {
  amounts = [...INITIAL]; history = []; selected = null; released = false;
  status.textContent = 'Puzzle reset. Select a vat to begin.';
  render();
});
lever.addEventListener('click', () => {
  if (!solved(amounts) || released) return;
  released = true;
  status.textContent = 'The vault opens. Vaultroot’s treasure is released!';
  render();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && selected !== null) {
    selected = null; status.textContent = 'Selection cleared.'; render();
  }
});
render();

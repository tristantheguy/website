const API_URL = window.LYRA_TASKS_API || 'https://tasks.tristans-website.com/api/lyra-tasks';
const REFRESH_MS = 20000;
const statuses = ['active', 'waiting', 'needs_judgment', 'blocked', 'done'];

function fmt(value) {
  if (!value || value === 'null') return '—';
  return value;
}

function friendlyStatus(status) {
  switch (status) {
    case 'active': return 'Active';
    case 'waiting': return 'Waiting';
    case 'needs_judgment': return 'Needs judgment';
    case 'blocked': return 'Blocked';
    case 'done': return 'Done';
    default: return status || 'Unknown';
  }
}

function renderSummary(counts = {}) {
  const row = document.getElementById('summaryRow');
  row.innerHTML = '';
  const items = [
    ['All tasks', counts.total ?? 0],
    ['Active now', counts.active ?? 0],
    ['Waiting', counts.waiting ?? 0],
    ['Needs judgment', counts.needs_judgment ?? 0],
    ['Blocked', counts.blocked ?? 0],
    ['Finished', counts.done ?? 0]
  ];
  for (const [label, value] of items) {
    const chip = document.createElement('div');
    chip.className = 'summary-chip';
    chip.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    row.appendChild(chip);
  }
}

function taskCard(task) {
  const card = document.createElement('article');
  card.className = 'task-card';
  const reason = task.judgment_reason || task.blocker;
  const retry = task.retry_after && task.retry_after !== 'null' ? task.retry_after : null;
  const kicker = task.status === 'done'
    ? 'Finished work'
    : task.status === 'waiting'
      ? 'Paused for now'
      : task.status === 'needs_judgment'
        ? 'Needs a decision'
        : task.status === 'blocked'
          ? 'Blocked'
          : 'In progress';
  card.innerHTML = `
    <div class="task-status-pill ${task.status}">${friendlyStatus(task.status)}</div>
    <div class="task-kicker">${kicker}</div>
    <h3>${task.title || task.id}</h3>
    <div class="task-block">
      <div class="label">Next step</div>
      <div>${fmt(task.next_step)}</div>
    </div>
    ${reason ? `<div class="task-block"><div class="label">What needs attention</div><div>${reason}</div></div>` : ''}
    <div class="task-meta">
      <div><span>Last run</span><div>${fmt(task.last_run)}</div></div>
      <div><span>Passes</span><div>${fmt(task.run_count)}</div></div>
      ${retry ? `<div><span>Retry after</span><div>${fmt(retry)}</div></div>` : ''}
    </div>
  `;
  return card;
}

function renderTasks(payload) {
  renderSummary(payload.counts || {});
  document.getElementById('lastUpdated').textContent = payload.generated_at ? new Date(payload.generated_at).toLocaleString() : '—';

  const focusTask = ((payload.grouped && payload.grouped.active) || [])[0]
    || ((payload.grouped && payload.grouped.waiting) || [])[0]
    || ((payload.grouped && payload.grouped.needs_judgment) || [])[0]
    || null;
  document.getElementById('focusTitle').textContent = focusTask ? (focusTask.title || focusTask.id) : 'Nothing urgent is active right now';
  document.getElementById('focusText').textContent = focusTask
    ? (focusTask.next_step || 'No next step is recorded right now.')
    : 'The board will keep updating automatically when task state changes.';

  for (const status of statuses) {
    const mount = document.getElementById(status);
    mount.innerHTML = '';
    const tasks = (payload.grouped && payload.grouped[status]) || [];
    if (!tasks.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Nothing in this section right now.';
      mount.appendChild(empty);
      continue;
    }
    for (const task of tasks) mount.appendChild(taskCard(task));
  }
}

async function load() {
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderTasks(data);
  } catch (err) {
    document.getElementById('lastUpdated').textContent = `error: ${err.message}`;
  }
}

load();
setInterval(load, REFRESH_MS);

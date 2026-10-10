import test from 'node:test';
import assert from 'node:assert/strict';
import { CAPACITIES, INITIAL, pour, solved } from '../dnd/hollow-crown/puzzle.mjs';
test('pours stop at a full destination or an empty source without mutating input', () => {
  assert.deepEqual(pour(INITIAL, 0, 1), [3, 5, 0]);
  assert.deepEqual(pour([3, 5, 0], 0, 2), [0, 5, 3]);
  assert.deepEqual(INITIAL, [8, 0, 0]);
});
test('same vat, empty source, full destination and invalid selections do nothing', () => {
  for (const [state, from, to] of [[INITIAL, 0, 0], [INITIAL, 1, 2], [[3, 5, 0], 0, 1], [INITIAL, -1, 1], [INITIAL, 0, 3]]) {
    assert.deepEqual(pour(state, from, to), state);
  }
});
test('every reachable transfer conserves sap, respects capacities, and the target is reachable', () => {
  const queue = [[...INITIAL]];
  const seen = new Set();
  let found = false;
  while (queue.length) {
    const state = queue.shift();
    const key = state.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    found ||= solved(state);
    for (let from = 0; from < 3; from++) for (let to = 0; to < 3; to++) {
      const next = pour(state, from, to);
      assert.equal(next.reduce((a, b) => a + b, 0), 8);
      next.forEach((n, i) => assert.ok(Number.isInteger(n) && n >= 0 && n <= CAPACITIES[i]));
      if (from !== to && next.join(',') !== key) assert.ok(next[from] === 0 || next[to] === CAPACITIES[to]);
      if (!seen.has(next.join(','))) queue.push(next);
    }
  }
  assert.ok(found);
  assert.ok(seen.size > 10);
  assert.equal(solved([4, 4, 0]), true);
  assert.equal(solved([4, 1, 3]), false);
});

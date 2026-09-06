/**
 * Interaction smoke test.
 *
 * Mounts the real application in jsdom and walks the learner journey by
 * clicking the actual controls: visit every view, move a slider, recalculate,
 * break the instance, reset. It fails on any React error, any console error,
 * and on a few things that must be true of the rendered output.
 *
 * Run with:  npm run smoke
 */

import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

const g = globalThis as Record<string, unknown>;
const define = (key: string, value: unknown): void => {
  Object.defineProperty(globalThis, key, {
    value,
    writable: true,
    configurable: true,
  });
};

define('window', dom.window);
define('document', dom.window.document);
define('navigator', dom.window.navigator);
define('HTMLElement', dom.window.HTMLElement);
define('Element', dom.window.Element);
define('Node', dom.window.Node);
define('Event', dom.window.Event);
define('MouseEvent', dom.window.MouseEvent);
define('getComputedStyle', dom.window.getComputedStyle);
g.requestAnimationFrame = (cb: FrameRequestCallback) =>
  dom.window.setTimeout(() => cb(Date.now()), 0) as unknown as number;
g.cancelAnimationFrame = (id: number) => dom.window.clearTimeout(id);
g.IS_REACT_ACT_ENVIRONMENT = true;

const consoleErrors: string[] = [];
const originalError = console.error;
console.error = (...args: unknown[]) => {
  consoleErrors.push(args.map(String).join(' '));
  originalError(...args);
};

const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const { createElement } = await import('react');
const { default: App } = await import('../app/App');

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    originalError(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const container = dom.window.document.getElementById('root')!;
const root = createRoot(container);

await act(async () => {
  root.render(createElement(App));
});

const text = (): string => container.textContent ?? '';
const html = (): string => container.innerHTML;

function findButton(label: string): HTMLButtonElement {
  const buttons = [...container.querySelectorAll('button')] as HTMLButtonElement[];
  const match = buttons.find((b) => (b.textContent ?? '').includes(label));
  if (!match) throw new Error(`No button containing "${label}"`);
  return match;
}

async function click(label: string): Promise<void> {
  const button = findButton(label);
  await act(async () => {
    button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
}

/** Selects the radio whose label contains `label`. */
async function choose(label: string): Promise<void> {
  const labels = [...container.querySelectorAll('label')] as HTMLLabelElement[];
  const match = labels.find((l) => (l.textContent ?? '').includes(label));
  if (!match) throw new Error(`No radio labelled "${label}"`);
  const input = match.querySelector('input[type="radio"]') as HTMLInputElement | null;
  if (!input) throw new Error(`Label "${label}" has no radio`);
  await act(async () => {
    input.click();
  });
}

async function setRange(id: string, value: number): Promise<void> {
  const input = container.querySelector(`#${id}`) as HTMLInputElement | null;
  if (!input) throw new Error(`No range input #${id}`);
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      dom.window.HTMLInputElement.prototype,
      'value',
    )!.set!;
    setter.call(input, String(value));
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
}

console.log('\nMount');
check('the app renders', text().includes('ConstraintRoute'));
check('it opens on a solved plan, not a blank canvas', text().includes('Depot →'));
check('the baseline distance is shown', text().includes('230.3'), text().slice(0, 200));

console.log('\nEvery view renders');
for (const label of [
  'Workstation',
  'Before / after',
  'Why it changed',
  'Breaking point',
  'BDH & research',
  'Learning check',
  'Overview',
]) {
  await click(label);
  check(`"${label}" renders without crashing`, container.childElementCount > 0);
}

console.log('\nNo dead controls');
{
  await click('Workstation');
  const buttons = [...container.querySelectorAll('button')] as HTMLButtonElement[];
  const unlabelled = buttons.filter((b) => (b.textContent ?? '').trim() === '' && !b.getAttribute('aria-label'));
  check('every button has an accessible label', unlabelled.length === 0, `${unlabelled.length} unlabelled`);
  const enabled = buttons.filter((b) => !b.disabled);
  check('the workstation has working controls', enabled.length > 0);
}

console.log('\nThe core experiment');
await click('Workstation');
check(
  'Recalculate is disabled while nothing has changed',
  findButton('Recalculate').disabled,
);

await setRange('capacity-v1', 60);
check('the slider edit shows as pending', text().includes('Not yet applied'));
check(
  'the plan has not changed yet',
  text().includes('230.3') && !text().includes('251.68'),
);
check(
  'Recalculate becomes available',
  !findButton('Recalculate').disabled,
);

await choose('The plan changes but still works');
await click('Recalculate');

check('the new distance appears', text().includes('251.68'), 'expected 251.68');
check('the workstation reports the change since the last run', text().includes('+21.38'), text().slice(0, 300));
check('the prediction was scored', text().includes('You called it'));
check('a customer is reported as moved', text().includes('changed vehicle'));

await click('Before / after');
check('the before/after shows the constraint edit', text().includes('100 kg'));
check('it shows both distances', text().includes('230.3') && text().includes('251.68'));
check(
  'the old plan is reported as now illegal',
  text().includes('breaks the limit'),
);

await click('Why it changed');
check('the explanation names the real change', text().includes('60 kg'));
check('the violated inequality is shown', text().includes('90 kg > 60 kg'), text().slice(0, 400));
check('the objective step is shown', text().includes('What it cost'));

console.log('\nBreaking it');
await click('Breaking point');
await click('Shrink both vehicles to 30 kg');
check('infeasibility is reached', text().includes('No feasible solution'));
check('the real totals are shown', text().includes('125 kg') && text().includes('60 kg'));
check('the shortfall is computed', text().includes('65 kg'));
check(
  'the reason is explained, not just announced',
  text().includes('cannot be loaded onto any vehicle'),
);

console.log('\nReset');
await click('Restore the baseline capacities');
check('feasibility returns', !text().includes('No feasible solution'));
await click('Workstation');
await click('Reset');
check('reset restores the baseline plan', text().includes('230.3') && !text().includes('251.68'));
check('reset clears the pending edits', !text().includes('Not yet applied'));

console.log('\nHonesty checks on rendered copy');
await click('BDH & research');
const research = text();
check('BDH is named correctly', research.includes('Dragon Hatchling'));
check(
  'the fabricated name is gone',
  !research.includes('Bilinear Dynamic Hypergraph'),
);
check('the solver is disclaimed as not BDH', research.includes('Our solver is not BDH'));
check(
  'the Sudoku figure is labelled developer-reported',
  research.includes('Reported by the developer'),
);
check('primary sources are linked', research.includes('arXiv:2509.26507'));

const full = html();
check('no LLM or AI-assistant language in the UI', !/chatbot|AI assistant|confidence score/i.test(full));

console.log('\nReact console');
const realErrors = consoleErrors.filter(
  (e) => !e.includes('not wrapped in act') && !e.includes('ReactDOMTestUtils'),
);
check('React logged no errors', realErrors.length === 0, realErrors[0]?.slice(0, 200));

await act(async () => {
  root.unmount();
});

console.log(`\n${'='.repeat(60)}`);
console.log(`${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  for (const failure of failures) console.log(`  - ${failure}`);
}
console.log('='.repeat(60));

if (failed > 0) process.exitCode = 1;

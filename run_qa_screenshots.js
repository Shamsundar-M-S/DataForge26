import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootScreenshotsDir = path.resolve(__dirname, '..', 'screenshots');
const crScreenshotsDir = path.resolve(__dirname, 'screenshots');

[rootScreenshotsDir, crScreenshotsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function saveScreenshot(page, name) {
  const filename = `${name}.png`;
  const path1 = path.join(rootScreenshotsDir, filename);
  const path2 = path.join(crScreenshotsDir, filename);

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300); // Allow sfx/animations to settle

  await page.screenshot({ path: path1, fullPage: true });
  await page.screenshot({ path: path2, fullPage: true });
  console.log(`[CAPTURED] ${filename}`);
}

async function safeClick(page, selector, options = {}) {
  try {
    const loc = page.locator(selector).first();
    if (await loc.count() > 0) {
      await loc.click({ timeout: 5000, ...options });
    }
  } catch (err) {
    console.warn(`Click warning for ${selector}:`, err.message);
  }
}

async function runQA() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  const baseUrl = 'http://localhost:3000';

  console.log('Starting Visual QA Regression Crawl at 1920x1080...');

  // 1. OVERVIEW PAGE
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await saveScreenshot(page, 'overview-main');

  // Keyboard accessibility focus state
  await page.keyboard.press('Tab');
  await saveScreenshot(page, 'overview-skip-to-content-focused');

  // 2. WORKSTATION PAGE
  await safeClick(page, 'button:has-text("Start the experiment")');
  await saveScreenshot(page, 'workstation-main');

  // Customer Selection on SVG canvas in baseline feasible mode
  await safeClick(page, 'g.cursor-pointer', { force: true });
  await saveScreenshot(page, 'workstation-customer-selected');

  // Scenario 2: Tighten one capacity
  await safeClick(page, 'button:has-text("Tighten one capacity")');
  await saveScreenshot(page, 'workstation-scenario-tighten-capacity');

  // Scenario 3: Raise one demand
  await safeClick(page, 'button:has-text("Raise one demand")');
  await saveScreenshot(page, 'workstation-scenario-raise-demand');

  // Reset workstation back to baseline
  await safeClick(page, 'button:has-text("Reset")');
  await saveScreenshot(page, 'workstation-main-reset');

  // Draft edits (move slider without recalculate)
  const v1Slider = page.locator('#capacity-v1');
  if (await v1Slider.count() > 0) {
    await v1Slider.fill('60');
    await v1Slider.dispatchEvent('change');
  }
  await saveScreenshot(page, 'workstation-unapplied-draft-edits');

  // Select Prediction radio option
  const predictionRadios = page.locator('input[name="prediction"]');
  if (await predictionRadios.count() > 0) {
    await predictionRadios.first().check().catch(() => {});
  }
  await saveScreenshot(page, 'workstation-prediction-selected-uncalculated');

  // Click Recalculate
  await safeClick(page, 'button:has-text("Recalculate")');
  await saveScreenshot(page, 'workstation-reassignment-warning');
  await saveScreenshot(page, 'workstation-prediction-outcome');

  // Check previous plan overlay toggle
  const overlayCheckbox = page.locator('input[type="checkbox"]').first();
  if (await overlayCheckbox.count() > 0) {
    await overlayCheckbox.check({ force: true }).catch(() => {});
    await saveScreenshot(page, 'workstation-previous-plan-overlay');
  }

  // Break it scenario (Infeasible failure state)
  await safeClick(page, 'button:has-text("Break it")');
  await safeClick(page, 'button:has-text("Recalculate")');
  await saveScreenshot(page, 'workstation-infeasible-failure-state');

  // 3. BEFORE / AFTER PAGE
  await safeClick(page, 'nav button:has-text("Before / after")');
  await saveScreenshot(page, 'before-after-main');

  const beforeAfterOverlay = page.locator('input[type="checkbox"]').first();
  if (await beforeAfterOverlay.count() > 0) {
    await beforeAfterOverlay.check({ force: true }).catch(() => {});
    await saveScreenshot(page, 'before-after-previous-plan-overlay');
  }

  // 4. EXPLANATION PAGE
  await safeClick(page, 'nav button:has-text("Why it changed")');
  await saveScreenshot(page, 'explanation-main');

  // 5. BREAKING POINT PAGE
  await safeClick(page, 'nav button:has-text("Breaking point")');
  await saveScreenshot(page, 'breaking-point-infeasible-state');

  // Restore baseline capacities
  await safeClick(page, 'button:has-text("Restore the baseline capacities")');
  await saveScreenshot(page, 'breaking-point-restored-satisfiable');

  // Shrink capacities shortcut
  await safeClick(page, 'button:has-text("Shrink both vehicles to 30 kg and recalculate")');
  await saveScreenshot(page, 'breaking-point-shrunk-infeasible');

  // 6. RESEARCH PAGE
  await safeClick(page, 'nav button:has-text("BDH & research")');
  await saveScreenshot(page, 'research-main');

  // Sudoku Micro-Demo Candidates
  await safeClick(page, 'button:has-text("2")');
  await saveScreenshot(page, 'research-sudoku-candidate-2-valid');

  await safeClick(page, 'button:has-text("4")');
  await saveScreenshot(page, 'research-sudoku-candidate-4-conflict');

  await safeClick(page, 'button:has-text("1")');
  await saveScreenshot(page, 'research-sudoku-candidate-1-conflict');

  await safeClick(page, 'button:has-text("3")');
  await saveScreenshot(page, 'research-sudoku-candidate-3-conflict');

  // 7. LEARNING CHECK PAGE
  await safeClick(page, 'nav button:has-text("Learning check")');
  await saveScreenshot(page, 'learning-check-main');

  // Answer first question
  const firstRadio = page.locator('input[type="radio"]').first();
  if (await firstRadio.count() > 0) {
    await firstRadio.check({ force: true }).catch(() => {});
    await saveScreenshot(page, 'learning-check-partial-answers');
  }

  // Answer all questions
  const qNames = ['q-reassignment', 'q-break', 'q-prediction', 'q-capacity', 'q-bdh'];
  for (const name of qNames) {
    const r = page.locator(`input[name="${name}"]`).first();
    if (await r.count() > 0) {
      await r.check({ force: true }).catch(() => {});
    }
  }
  await saveScreenshot(page, 'learning-check-all-completed');

  // Clear answers
  await safeClick(page, 'button:has-text("Clear answers")');
  await saveScreenshot(page, 'learning-check-cleared');

  await browser.close();
  console.log('QA Visual Regression Crawl completed successfully!');
}

runQA().catch((err) => {
  console.error('QA Script error:', err);
  process.exit(1);
});

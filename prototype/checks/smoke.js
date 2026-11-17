// Run with playwright-cli run-code --filename prototype/checks/smoke.js.
async page => {
  const baseURL = new URL('.', page.url()).href;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const assert = (condition, message) => { if (!condition) throw new Error(message); };

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['', 'overview', 'new', 'result', 'history', 'settings']) {
      await page.goto(baseURL + (route ? '#app/' + route : ''));
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => Promise.all([...document.images].filter(img => img.loading !== 'lazy' && img.hasAttribute('src'))
        .map(img => img.decode().catch(() => {}))));
      const layout = await page.evaluate(() => ({
        fits: document.documentElement.scrollWidth <= innerWidth + 1,
        imagesLoaded: [...document.images].filter(img => img.loading !== 'lazy' && img.hasAttribute('src'))
          .every(img => img.complete && img.naturalWidth > 0),
        headings: [...document.querySelectorAll('h1')].filter(h => h.getBoundingClientRect().width > 0).length
      }));
      assert(layout.fits, `Horizontal overflow: ${width}px, ${route || 'landing'}`);
      assert(layout.imagesLoaded, `Missing image: ${width}px, ${route || 'landing'}`);
      assert(layout.headings === 1, `Expected one visible page title: ${route || 'landing'}`);
    }
  }

  await page.goto(baseURL);
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => document.activeElement?.classList.contains('skip-link')), 'Initial keyboard focus skipped the skip link');
  await page.getByRole('button', { name: 'Explorar protótipo', exact: true }).first().click();
  assert(await page.evaluate(() => document.activeElement?.tagName === 'H1'), 'Page title did not receive focus');
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await skip.focus();
  await page.keyboard.press('Enter');
  assert(await page.evaluate(() => document.activeElement?.id === 'app-main'), 'Skip link missed the active main');
  assert(page.url().endsWith('#app/new'), 'Skip link changed the current route');

  await page.getByRole('tab', { name: 'Texto', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  assert(await page.getByRole('tab', { name: 'Link', exact: true }).getAttribute('aria-selected') === 'true', 'Keyboard tabs failed');
  await page.keyboard.press('Home');
  await page.getByRole('button', { name: 'Revisar conteúdo' }).click();
  assert(await page.getByRole('dialog').isVisible(), 'Content preview did not open');
  await page.keyboard.press('Escape');
  assert(!await page.getByRole('dialog').isVisible(), 'Escape did not close the preview');

  await page.getByRole('textbox', { name: 'Conteúdo para analisar' }).fill('Uma afirmação sem evidências.');
  await page.getByRole('button', { name: 'Revisar conteúdo' }).click();
  await page.getByRole('button', { name: 'Ver relatório de exemplo' }).click();
  await page.waitForURL('**/#app/result');
  assert((await page.locator('#report-status').textContent()).includes('Inconclusivo'), 'Unknown input received a fabricated verdict');
  assert(await page.locator('.source-item').isHidden(), 'Unknown input received a fabricated source');

  await page.getByRole('button', { name: 'Configurações', exact: true }).click();
  await page.getByRole('switch', { name: 'Reduzir animações' }).click();
  assert(await page.getByRole('switch').getAttribute('aria-checked') === 'true', 'Motion preference did not change');
  await page.getByRole('button', { name: 'Voltar para o site', exact: true }).click();
  assert(await page.evaluate(() => document.activeElement?.id === 'hero-heading'), 'Return to site lost focus');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  assert(await page.locator('.investigation').isVisible(), 'Reduced motion hides the visual');
  assert(await page.locator('.hero-copy').evaluate(el => getComputedStyle(el).animationName) === 'none', 'Hero entrance ignores reduced motion');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const fallbackContext = await page.context().browser().newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const fallbackPage = await fallbackContext.newPage();
    await fallbackPage.route('https://fonts.**/*', route => route.abort());
    await fallbackPage.goto(baseURL);
    assert(await fallbackPage.getByRole('heading', { level: 1 }).isVisible(), 'Landing needs JavaScript to render');
    assert(await fallbackPage.locator('.investigation').isVisible(), 'Visual needs JavaScript to render');
    assert(await fallbackPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Fallback font causes overflow');
  } finally {
    await fallbackContext.close();
  }
  assert(errors.length === 0, errors.join('\n'));
  console.log('PASS: 24 layouts, assets, route focus, skip link, keyboard tabs, dialog, unverified input, reduced motion and font/JS fallback.');
}

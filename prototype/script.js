/**
 * AutenticAI — visual prototype only.
 * No backend, real fact-checking, user account, tracking, OCR or upload.
 * The DOM interactions below illustrate a possible product flow.
 */
(() => {
  'use strict';

  const landing = document.getElementById('landing-view');
  const app = document.getElementById('app-view');
  const skipLink = document.querySelector('.skip-link');
  const pages = [...document.querySelectorAll('.app-page')];
  const navButtons = [...document.querySelectorAll('[data-app-nav]')];
  const previewDialog = document.getElementById('preview-dialog');
  const processingMask = document.getElementById('processing-mask');
  const toastStack = document.getElementById('toast-stack');
  const claimText = document.getElementById('claim-text');
  const claimURL = document.getElementById('claim-url');
  const claimImage = document.getElementById('claim-image');
  const previewText = document.getElementById('preview-content-text');
  const previewImage = document.getElementById('preview-image');
  const previewImageHolder = document.getElementById('preview-image-holder');
  const contentTabs = [...document.querySelectorAll('[data-content-tab]')];
  const sourceItem = document.querySelector('.source-item');
  let activeContent = 'text';
  let pending = null;
  let imageObjectURL = null;
  let processingTimer = null;

  document.querySelectorAll('h1').forEach(heading => { heading.tabIndex = -1; });
  skipLink.addEventListener('click', event => {
    event.preventDefault();
    const main = document.querySelector(skipLink.getAttribute('href'));
    main.tabIndex = -1;
    main.focus();
  });

  const samples = {
    moon: {
      claim: 'A Lua emite luz própria.',
      status: 'Contradito', statusStyle: 'danger',
      explanation: 'A superfície da Lua reflete a luz do Sol.',
      sourceTitle: 'NASA | Lua'
    },
    sun: {
      claim: 'O Sol é uma estrela.',
      status: 'Sustentado', statusStyle: 'success',
      explanation: 'O Sol é a estrela no centro do Sistema Solar.',
      sourceTitle: 'NASA | Sol'
    }
  };

  const viewTitles = {
    overview: 'Visão geral', new: 'Nova análise', result: 'Relatório de exemplo',
    history: 'Histórico de exemplo', settings: 'Configurações'
  };

  function normalize(text) {
    return String(text || '').trim().toLocaleLowerCase('pt-BR')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[.!?\s]+$/g, '').replace(/\s+/g, ' ');
  }

  function scrollTop() { window.scrollTo(0, 0); }

  function navigate(page, updateURL = true) {
    if (!viewTitles[page]) page = 'new';
    landing.hidden = true;
    app.hidden = false;
    document.body.classList.add('app-active');
    for (const panel of pages) panel.hidden = panel.dataset.page !== page;
    for (const button of navButtons) {
      const current = button.dataset.appNav === page;
      button.classList.toggle('is-active', current);
      if (current) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    skipLink.setAttribute('href', '#app-main');
    document.title = `${viewTitles[page]} | AutenticAI`;
    if (updateURL && location.hash !== '#app/' + page) history.pushState(null, '', '#app/' + page);
    scrollTop();
    app.querySelector('.app-page:not([hidden]) h1').focus({ preventScroll: true });
  }

  function goHome(updateURL = true) {
    const returningFromApp = !app.hidden;
    landing.hidden = false;
    app.hidden = true;
    document.body.classList.remove('app-active');
    skipLink.setAttribute('href', '#main-content');
    document.title = 'AutenticAI | Protótipo';
    if (updateURL && location.hash.startsWith('#app/')) history.pushState(null, '', location.pathname + location.search);
    scrollTop();
    if (returningFromApp || updateURL) landing.querySelector('h1').focus({ preventScroll: true });
    updateScrollMeter();
  }

  function handleURL() {
    if (location.hash.startsWith('#app/')) {
      navigate(location.hash.split('/')[1] || 'new', false);
    } else {
      goHome(false);
      if (location.hash && location.hash.length > 1) {
        const id = location.hash.slice(1);
        const target = document.getElementById(id);
        if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'auto' }));
      }
    }
  }

  document.querySelectorAll('[data-open-app]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.openApp === 'result') setReport(samples.moon);
      navigate(button.dataset.openApp || 'new');
    });
  });
  document.querySelectorAll('[data-go-home]').forEach(button => button.addEventListener('click', () => goHome()));
  navButtons.forEach(button => button.addEventListener('click', () => navigate(button.dataset.appNav)));
  window.addEventListener('popstate', handleURL);
  window.addEventListener('hashchange', () => {
    if (location.hash.startsWith('#app/')) handleURL();
  });

  function updateScrollMeter() {
    const meter = document.getElementById('scroll-meter-line');
    if (landing.hidden) { meter.style.width = '0%'; return; }
    const range = document.documentElement.scrollHeight - window.innerHeight;
    const percent = range > 0 ? Math.min(100, Math.max(0, (window.scrollY / range) * 100)) : 0;
    meter.style.width = percent.toFixed(2) + '%';
  }
  window.addEventListener('scroll', updateScrollMeter, { passive: true });
  window.addEventListener('resize', updateScrollMeter, { passive: true });

  function notify(message) {
    const element = document.createElement('div');
    element.className = 'toast';
    element.textContent = message;
    element.setAttribute('role', 'status');
    toastStack.appendChild(element);
    window.setTimeout(() => { if (element.isConnected) element.remove(); }, 4300);
  }

  function setContentTab(which, moveFocus = false) {
    if (!['text', 'link', 'image'].includes(which)) return;
    activeContent = which;
    contentTabs.forEach(button => {
      const selected = button.dataset.contentTab === which;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && moveFocus) button.focus();
    });
    ['text', 'link', 'image'].forEach(kind => {
      document.getElementById('panel-' + kind).hidden = kind !== which;
    });
  }
  contentTabs.forEach((button, index) => {
    button.addEventListener('click', () => setContentTab(button.dataset.contentTab));
    button.addEventListener('keydown', event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      let next = index;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = contentTabs.length - 1;
      else next = (index + (event.key === 'ArrowRight' ? 1 : -1) + contentTabs.length) % contentTabs.length;
      setContentTab(contentTabs[next].dataset.contentTab, true);
    });
  });

  function updateCount() {
    document.getElementById('character-counter').textContent = `${claimText.value.length.toLocaleString('pt-BR')} caracteres`;
  }
  claimText.addEventListener('input', updateCount);
  updateCount();

  function useSample(key, openReport = false) {
    const sample = samples[key];
    if (!sample) return;
    if (openReport) {
      setReport(sample);
      navigate('result');
    } else {
      claimText.value = sample.claim;
      updateCount();
      setContentTab('text');
      navigate('new');
      claimText.focus({ preventScroll: true });
    }
  }
  document.querySelectorAll('[data-fill-sample]').forEach(button => button.addEventListener('click', () => useSample(button.dataset.fillSample)));
  document.querySelectorAll('[data-history-sample]').forEach(button => button.addEventListener('click', () => useSample(button.dataset.historySample, true)));

  claimImage.addEventListener('change', () => {
    const file = claimImage.files?.[0];
    if (imageObjectURL) URL.revokeObjectURL(imageObjectURL);
    imageObjectURL = null;
    if (!file) { document.getElementById('selected-file').textContent = ''; return; }
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) {
      claimImage.value = '';
      document.getElementById('selected-file').textContent = '';
      notify('Escolha uma imagem PNG, JPG ou WebP de até 8 MB.');
      return;
    }
    imageObjectURL = URL.createObjectURL(file);
    document.getElementById('selected-file').textContent = `Selecionado: ${file.name}`;
  });

  function gatherInput() {
    if (activeContent === 'text') {
      const text = claimText.value.trim();
      if (!text) { claimText.focus(); notify('Insira um texto antes de continuar.'); return null; }
      return { type: 'text', text };
    }
    if (activeContent === 'link') {
      const text = claimURL.value.trim();
      try {
        const url = new URL(text);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocolo');
      } catch {
        claimURL.focus(); notify('Informe um endereço completo começando com https:// ou http://.'); return null;
      }
      return { type: 'link', text };
    }
    if (!claimImage.files?.[0]) { notify('Selecione uma imagem para ver a prévia local.'); return null; }
    return { type: 'image', text: claimImage.files[0].name };
  }

  document.getElementById('analysis-form').addEventListener('submit', event => {
    event.preventDefault();
    pending = gatherInput();
    if (!pending) return;
    previewText.textContent = pending.text;
    if (pending.type === 'image' && imageObjectURL) {
      previewImage.src = imageObjectURL;
      previewImageHolder.hidden = false;
    } else {
      previewImage.removeAttribute('src');
      previewImageHolder.hidden = true;
    }
    if (typeof previewDialog.showModal === 'function') previewDialog.showModal();
    else previewDialog.setAttribute('open', '');
  });

  function closePreview() { previewDialog.close(); }
  document.getElementById('close-preview').addEventListener('click', closePreview);
  document.getElementById('cancel-preview').addEventListener('click', closePreview);
  previewDialog.addEventListener('click', event => { if (event.target === previewDialog) closePreview(); });

  function setReport(report) {
    const isExample = Boolean(report);
    const selected = report || {
      claim: pending ? pending.text : 'Conteúdo não analisado',
      status: 'Inconclusivo', statusStyle: 'muted',
      explanation: 'O protótipo não analisou este conteúdo.',
      sourceTitle: ''
    };
    const claimLabel = selected.claim.length > 600 ? selected.claim.slice(0, 600) + '…' : selected.claim;
    document.getElementById('report-claim').textContent = '“' + claimLabel + '”';
    const statusEl = document.getElementById('report-status');
    statusEl.className = `semantic-tag semantic-tag--${selected.statusStyle}`;
    statusEl.innerHTML = '<span aria-hidden="true"></span>';
    statusEl.append(document.createTextNode(' ' + selected.status));
    document.getElementById('report-explanation').textContent = selected.explanation;
    sourceItem.hidden = !isExample;
    document.getElementById('source-title').textContent = selected.sourceTitle;
    document.getElementById('report-empty-sources').hidden = isExample;
  }

  document.getElementById('confirm-preview').addEventListener('click', () => {
    if (!pending) return;
    const content = pending;
    closePreview();
    processingMask.hidden = false;
    let sample = null;
    if (content.type === 'text') {
      sample = Object.values(samples).find(s => normalize(s.claim) === normalize(content.text)) || null;
    }
    window.clearTimeout(processingTimer);
    processingTimer = window.setTimeout(() => {
      setReport(sample);
      processingMask.hidden = true;
      navigate('result');
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduce-motion') ? 150 : 1100);
  });

  const reducedToggle = document.getElementById('reduced-motion-toggle');
  reducedToggle.addEventListener('click', () => {
    const next = reducedToggle.getAttribute('aria-checked') !== 'true';
    reducedToggle.setAttribute('aria-checked', String(next));
    document.body.classList.toggle('reduce-motion', next);
  });
  document.getElementById('clear-demo-button').addEventListener('click', () => {
    notify('O protótipo não salva registros pessoais.');
  });

  // Demo paths use browser history but no network requests.
  setReport(samples.moon);
  handleURL();
  updateScrollMeter();
})();

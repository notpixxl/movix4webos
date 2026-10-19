/**
 * Movix TV Client - Logique de lancement instantané webOS
 * Résolution dynamique de miroir et redirection automatique immédiate
 */

(function () {
  'use strict';

  var RESOLVER_URL = 'https://movix.online';
  var DEFAULT_FALLBACKS = [
    'https://movix.dog',
    'https://movixstream.com',
    'https://movix.online'
  ];

  var state = {
    resolvedUrl: localStorage.getItem('movix_active_url') || DEFAULT_FALLBACKS[0],
    displayMode: localStorage.getItem('movix_display_mode') || 'direct',
    isCancelled: false
  };

  // Éléments DOM
  var dom = {
    statusText: document.getElementById('status-text'),
    progressBar: document.getElementById('progress-bar'),
    urlDisplay: document.getElementById('target-url-display'),
    settingsModal: document.getElementById('settings-modal'),
    customUrlInput: document.getElementById('custom-url-input'),
    modeSelect: document.getElementById('mode-select'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnCancelSettings: document.getElementById('btn-cancel-settings'),
    splashContainer: document.getElementById('splash-container'),
    iframeContainer: document.getElementById('iframe-container'),
    appFrame: document.getElementById('app-frame'),
    osdBar: document.getElementById('osd-bar'),
    osdUrl: document.getElementById('osd-current-url'),
    btnOsdFullscreen: document.getElementById('btn-osd-fullscreen'),
    btnOsdReload: document.getElementById('btn-osd-reload'),
    btnOsdHome: document.getElementById('btn-osd-home')
  };

  function updateStatus(text, progressPercent, urlText) {
    if (dom.statusText) dom.statusText.textContent = text;
    if (dom.progressBar && typeof progressPercent === 'number') {
      dom.progressBar.style.width = progressPercent + '%';
    }
    if (dom.urlDisplay && urlText) {
      dom.urlDisplay.textContent = urlText;
    }
  }

  /**
   * Résolution et lancement automatique immédiat
   */
  async function resolveAndAutoLaunch() {
    var cached = state.resolvedUrl;
    updateStatus('Connexion à ' + cached.replace('https://', '') + '...', 60, cached);

    // Tentative rapide de vérification de miroir frais (timeout court 800ms)
    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, 800);

    try {
      var response = await fetch(RESOLVER_URL, {
        method: 'GET',
        headers: { 'Accept': 'text/html,application/xhtml+xml' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        var html = await response.text();
        var match = html.match(/(?:active\s+est\s+<a[^>]*href=["']?(https?:\/\/[a-z0-9\-.]+)["']?|active\s+est\s+([a-z0-9\-.]+\.[a-z]{2,8})|https:\/\/(movix\.[a-z0-9\-]+))/i);
        if (match) {
          var detectedDomain = match[1] || match[2] || match[3];
          if (detectedDomain && !detectedDomain.startsWith('http')) {
            detectedDomain = 'https://' + detectedDomain;
          }
          if (detectedDomain && detectedDomain.endsWith('/')) {
            detectedDomain = detectedDomain.slice(0, -1);
          }
          if (detectedDomain && detectedDomain.indexOf('movix') !== -1) {
            state.resolvedUrl = detectedDomain;
            localStorage.setItem('movix_active_url', detectedDomain);
          }
        }
      }
    } catch (err) {
      // Ignorer : le miroir par défaut / cache est prêt immédiatement
    }

    // Si l'utilisateur n'a pas ouvert le modal de réglages pendant les 800ms, lancer tout de suite
    if (!state.isCancelled) {
      updateStatus('Chargement du catalogue...', 100, state.resolvedUrl);
      setTimeout(launch, 150);
    }
  }

  function launch() {
    var targetUrl = state.resolvedUrl;
    console.log('[MovixTV] Lancement automatique vers :', targetUrl);

    if (state.displayMode === 'direct') {
      window.location.replace(targetUrl);
    } else {
      if (dom.splashContainer) dom.splashContainer.style.display = 'none';
      if (dom.iframeContainer) {
        dom.iframeContainer.style.display = 'block';
        dom.osdUrl.textContent = targetUrl;
        dom.appFrame.src = targetUrl;
      }
    }
  }

  function openSettings() {
    state.isCancelled = true;
    if (dom.customUrlInput) dom.customUrlInput.value = state.resolvedUrl;
    if (dom.modeSelect) dom.modeSelect.value = state.displayMode;
    if (dom.settingsModal) {
      dom.settingsModal.style.display = 'flex';
      dom.customUrlInput.focus();
    }
  }

  function closeSettings() {
    if (dom.settingsModal) dom.settingsModal.style.display = 'none';
    state.isCancelled = false;
    launch();
  }

  function saveSettings() {
    var newUrl = dom.customUrlInput.value.trim();
    if (newUrl) {
      if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
        newUrl = 'https://' + newUrl;
      }
      state.resolvedUrl = newUrl;
      localStorage.setItem('movix_active_url', newUrl);
    }
    state.displayMode = dom.modeSelect.value;
    localStorage.setItem('movix_display_mode', state.displayMode);
    closeSettings();
  }

  function bindUIEvents() {
    var btnLaunch = document.getElementById('btn-launch-direct');
    if (btnLaunch) btnLaunch.addEventListener('click', launch);

    var btnSettings = document.getElementById('btn-settings');
    if (btnSettings) btnSettings.addEventListener('click', openSettings);

    if (dom.btnCancelSettings) dom.btnCancelSettings.addEventListener('click', closeSettings);
    if (dom.btnSaveSettings) dom.btnSaveSettings.addEventListener('click', saveSettings);

    // Raccourci télécommande : Touche Jaune (405) pour paramètres
    window.addEventListener('keydown', function (e) {
      var key = e.keyCode || e.which;
      if (key === 405) { // Yellow button
        openSettings();
      }
    });
  }

  window.addEventListener('DOMContentLoaded', function () {
    bindUIEvents();
    resolveAndAutoLaunch();
  });

})();

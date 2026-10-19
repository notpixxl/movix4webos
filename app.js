/**
 * Movix TV Client - Logique d'orchestration webOS
 * Résolution dynamique de miroir, gestion des modes et télécommande
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
    displayMode: localStorage.getItem('movix_display_mode') || 'direct', // 'direct' ou 'wrapper'
    countdownTimer: null,
    countdownSeconds: 3,
    isResolving: true
  };

  // Éléments DOM
  var dom = {
    statusText: document.getElementById('status-text'),
    progressBar: document.getElementById('progress-bar'),
    urlDisplay: document.getElementById('target-url-display'),
    spinner: document.getElementById('loader-spinner'),
    btnLaunch: document.getElementById('btn-launch-direct'),
    btnSwitchMode: document.getElementById('btn-switch-mode'),
    btnSettings: document.getElementById('btn-settings'),
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
   * Résolution dynamique de l'instance Movix active
   */
  async function resolveActiveInstance() {
    updateStatus('Interrogation de movix.online...', 30, state.resolvedUrl);

    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, 4000);

    try {
      var response = await fetch(RESOLVER_URL, {
        method: 'GET',
        headers: { 'Accept': 'text/html,application/xhtml+xml' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        var html = await response.text();
        updateStatus('Analyse des redirections officielles...', 65);

        // 1. Chercher dans le JSON-LD ou le texte "active est movix.xyz"
        var match = html.match(/(?:active\s+est\s+<a[^>]*href=["']?(https?:\/\/[a-z0-9\-.]+)["']?|active\s+est\s+([a-z0-9\-.]+\.[a-z]{2,8})|https:\/\/(movix\.[a-z0-9\-]+))/i);
        var detectedDomain = null;

        if (match) {
          detectedDomain = match[1] || match[2] || match[3];
          if (detectedDomain && !detectedDomain.startsWith('http')) {
            detectedDomain = 'https://' + detectedDomain;
          }
          if (detectedDomain && detectedDomain.endsWith('/')) {
            detectedDomain = detectedDomain.slice(0, -1);
          }
        }

        if (detectedDomain && detectedDomain.indexOf('movix') !== -1) {
          state.resolvedUrl = detectedDomain;
          localStorage.setItem('movix_active_url', detectedDomain);
          console.log('[MovixTV] Nouvelle instance officielle résolue :', detectedDomain);
        }
      }
    } catch (err) {
      console.warn('[MovixTV] movix.online non joignable directement, miroir par défaut utilisé :', err);
    }

    state.isResolving = false;
    updateStatus('Instance prête !', 100, state.resolvedUrl);
    startLaunchCountdown();
  }

  /**
   * Compte à rebours avant lancement automatique
   */
  function startLaunchCountdown() {
    if (state.countdownTimer) clearInterval(state.countdownTimer);

    dom.btnLaunch.focus();

    state.countdownTimer = setInterval(function () {
      if (dom.settingsModal.style.display === 'flex') return; // Pause si modal ouvert

      state.countdownSeconds--;
      if (state.countdownSeconds > 0) {
        dom.btnLaunch.innerHTML = '<span>▶ Lancer Maintenant (' + state.countdownSeconds + 's)</span>';
      } else {
        clearInterval(state.countdownTimer);
        launch();
      }
    }, 1000);
  }

  /**
   * Lancement du client selon le mode configuré
   */
  function launch() {
    if (state.countdownTimer) clearInterval(state.countdownTimer);

    var targetUrl = state.resolvedUrl;
    console.log('[MovixTV] Lancement vers :', targetUrl, 'Mode :', state.displayMode);

    if (state.displayMode === 'direct') {
      // MODE PLEIN ÉCRAN DIRECT (Recommandé) :
      // Navigue directement vers l'instance Movix active
      updateStatus('Chargement du streaming plein écran...', 100, targetUrl);
      window.location.replace(targetUrl);
    } else {
      // MODE WRAPPER IFRAME :
      dom.splashContainer.style.display = 'none';
      dom.iframeContainer.style.display = 'block';
      dom.osdUrl.textContent = targetUrl;
      dom.appFrame.src = targetUrl;

      // Afficher brièvement l'OSD en haut
      showOsdTemporarily();
    }
  }

  function showOsdTemporarily() {
    dom.osdBar.classList.add('visible');
    setTimeout(function () {
      dom.osdBar.classList.remove('visible');
    }, 4000);
  }

  /**
   * Gestion des paramètres
   */
  function openSettings() {
    if (state.countdownTimer) clearInterval(state.countdownTimer);
    dom.customUrlInput.value = state.resolvedUrl;
    dom.modeSelect.value = state.displayMode;
    dom.settingsModal.style.display = 'flex';
    dom.customUrlInput.focus();
  }

  function closeSettings() {
    dom.settingsModal.style.display = 'none';
    dom.btnLaunch.focus();
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
    launch();
  }

  // Écouteurs d'événements
  function bindUIEvents() {
    dom.btnLaunch.addEventListener('click', function () {
      launch();
    });

    dom.btnSwitchMode.addEventListener('click', function () {
      state.displayMode = (state.displayMode === 'direct') ? 'wrapper' : 'direct';
      localStorage.setItem('movix_display_mode', state.displayMode);
      dom.btnSwitchMode.querySelector('span').textContent = 
        (state.displayMode === 'direct') ? '☷ Mode Wrapper' : '▣ Mode Plein Écran';
    });

    dom.btnSettings.addEventListener('click', openSettings);
    dom.btnCancelSettings.addEventListener('click', closeSettings);
    dom.btnSaveSettings.addEventListener('click', saveSettings);

    // OSD wrapper buttons
    if (dom.btnOsdFullscreen) {
      dom.btnOsdFullscreen.addEventListener('click', function () {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      });
    }

    if (dom.btnOsdReload) {
      dom.btnOsdReload.addEventListener('click', function () {
        dom.appFrame.src = state.resolvedUrl;
      });
    }

    if (dom.btnOsdHome) {
      dom.btnOsdHome.addEventListener('click', function () {
        dom.iframeContainer.style.display = 'none';
        dom.splashContainer.style.display = 'flex';
        state.countdownSeconds = 5;
        startLaunchCountdown();
      });
    }

    // Détection souris/pointeur en haut de l'écran pour OSD
    window.addEventListener('mousemove', function (e) {
      if (dom.iframeContainer.style.display === 'block') {
        if (e.clientY < 50) {
          dom.osdBar.classList.add('visible');
        } else if (e.clientY > 100) {
          dom.osdBar.classList.remove('visible');
        }
      }
    });

    // Raccourci télécommande : Touche Jaune (405) pour paramètres
    window.addEventListener('keydown', function (e) {
      var key = e.keyCode || e.which;
      if (key === 405) { // Yellow button
        openSettings();
      } else if (key === 403) { // Red button
        resolveActiveInstance();
      }
    });
  }

  // Initialisation au chargement de la page
  window.addEventListener('DOMContentLoaded', function () {
    bindUIEvents();
    resolveActiveInstance();
  });

})();

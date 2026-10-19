/**
 * Movix TV for LG webOS - UserScript d'injection globale
 * Injecté automatiquement par le moteur webOS Chromium dans toutes les pages et iframes
 *
 * Fonctionnalités :
 * 1. Bloqueur de pubs (AdBlock) : Popups, popunders, bannières et régies agressives de lecteurs
 * 2. Correction de la roulette de la Magic Remote (défilement vertical et horizontal fluide)
 * 3. Gestion de la touche Retour (461) et des touches multimédia (Play/Pause/Skip)
 * 4. Optimisation visuelle grand écran OLED (focus, survol, contrastes)
 */

(function () {
  'use strict';

  // Éviter les doubles exécutions
  if (window.__MOVIX_TV_INJECTED__) return;
  window.__MOVIX_TV_INJECTED__ = true;

  console.log('[MovixTV UserScript] Initialisation sur :', window.location.href);

  /* ====================================================================
   * 1. MODULE ADBLOCK : Blocage des popups, régies et calques invisibles
   * ==================================================================== */

  // Liste noire des régies publicitaires et réseaux de popups de streaming
  var AD_PATTERNS = [
    'adsterra', 'popads', 'popcash', 'propellerads', 'monetag', 'exoclick',
    'adcash', 'hilltopads', 'clickadu', 'admaven', 'bidgear', 'adtrue',
    'outbrain', 'taboola', 'mgid', 'richaudience', 'doubleclick', 'google-analytics',
    'googlesyndication', 'adservice', 'bet365', '1xbet', 'melbet', 'casino',
    'trafficjunky', 'juicyads', 'ero-advertising', 'wigetmedia', 'realsrv',
    'syndication', 'popunder', 'clickunder', 'delivery', 'tracker', 'adnxs'
  ];

  function isAdUrl(url) {
    if (!url || typeof url !== 'string') return false;
    var lower = url.toLowerCase();
    for (var i = 0; i < AD_PATTERNS.length; i++) {
      if (lower.indexOf(AD_PATTERNS[i]) !== -1) return true;
    }
    return false;
  }

  // A. Blocage des Popups / Popunders (window.open)
  try {
    var rawOpen = window.open;
    window.open = function (url) {
      if (!url) return null;
      var strUrl = String(url);
      try {
        var parsed = new URL(strUrl, window.location.href);
        // Ne jamais ouvrir de popup vers un domaine tiers inconnu
        if (parsed.hostname.indexOf('movix') === -1 && parsed.hostname !== window.location.hostname) {
          console.log('[MovixAdBlock] Popup externe bloquée :', strUrl);
          return null;
        }
      } catch (err) {
        return null;
      }
      return rawOpen.apply(this, arguments);
    };
  } catch (e) {}

  // B. Neutralisation des anti-adblockers
  try {
    window.canRunAds = true;
    window.isAdBlockActive = false;
    window.adblock = false;
  } catch (e) {}

  // C. Interception de la création de scripts et iframes publicitaires
  try {
    var rawCreateElement = document.createElement;
    document.createElement = function (tagName) {
      var el = rawCreateElement.apply(this, arguments);
      var tag = String(tagName).toLowerCase();

      if (tag === 'script' || tag === 'iframe') {
        var originalSetAttribute = el.setAttribute;
        el.setAttribute = function (name, value) {
          if (name && name.toLowerCase() === 'src' && isAdUrl(value)) {
            console.log('[MovixAdBlock] Élément publicitaire intercepté :', value);
            return;
          }
          return originalSetAttribute.apply(this, arguments);
        };
      }
      return el;
    };
  } catch (e) {}

  // D. Suppression des calques invisibles sur les lecteurs vidéo (Click-jackers)
  function removeAdOverlays() {
    var elements = document.querySelectorAll('div, a, span');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var style = window.getComputedStyle(el);
      // Détecter les calques transparents en plein écran avec un z-index élevé
      if (
        (style.position === 'fixed' || style.position === 'absolute') &&
        parseInt(style.zIndex, 10) > 1000 &&
        (parseFloat(style.opacity) === 0 || style.backgroundColor === 'rgba(0, 0, 0, 0)') &&
        el.clientWidth > window.innerWidth * 0.7 &&
        el.clientHeight > window.innerHeight * 0.7
      ) {
        console.log('[MovixAdBlock] Calque invisible (click-jacker) supprimé');
        el.parentNode.removeChild(el);
      }
    }
  }

  // Surveiller le DOM pour éliminer les popups injectées dynamiquement
  var adObserver = new MutationObserver(function () {
    removeAdOverlays();
  });
  if (document.body) {
    adObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.body) adObserver.observe(document.body, { childList: true, subtree: true });
    });
  }


  /* ====================================================================
   * 2. MODULE ROULETTE & DÉFILEMENT LG MAGIC REMOTE
   * ==================================================================== */

  // Interception de la molette en phase de capture sur window
  window.addEventListener('wheel', function (e) {
    // Obtenir la position sous le curseur gyroscopique
    var target = document.elementFromPoint(e.clientX, e.clientY) || e.target;
    var delta = e.deltaY;
    if (!delta && e.wheelDelta) delta = -e.wheelDelta / 2;
    if (!delta) delta = (e.detail || 0) * 40;

    // Chercher le conteneur scrollable approprié
    var current = target;
    var handled = false;

    while (current && current !== document.body && current !== document.documentElement) {
      var style = window.getComputedStyle(current);
      var canScrollY = (style.overflowY === 'auto' || style.overflowY === 'scroll') && current.scrollHeight > current.clientHeight;
      var canScrollX = (style.overflowX === 'auto' || style.overflowX === 'scroll') && current.scrollWidth > current.clientWidth;

      // 1. Si on survole une rangée horizontale de films/séries : défilement horizontal fluide
      if (canScrollX && !canScrollY) {
        current.scrollLeft += delta * 1.8;
        handled = true;
        break;
      }

      // 2. Si on survole un conteneur vertical
      if (canScrollY) {
        current.scrollTop += delta * 1.8;
        handled = true;
        break;
      }

      current = current.parentElement;
    }

    // 3. Défilement par défaut de la fenêtre principale
    if (!handled) {
      if (document.scrollingElement) {
        document.scrollingElement.scrollTop += delta * 1.8;
      } else {
        window.scrollBy(0, delta * 1.8);
      }
    }

    e.preventDefault();
  }, { passive: false, capture: true });


  /* ====================================================================
   * 3. MODULE TÉLÉCOMMANDE (Touche Retour & Multimédia)
   * ==================================================================== */

  window.addEventListener('keydown', function (e) {
    var key = e.keyCode || e.which;

    // Touche Retour LG webOS (461), Escape (27) ou GoBack
    if (key === 461 || key === 27 || e.key === 'GoBack') {
      e.preventDefault();

      // Quitter le plein écran vidéo si actif
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        return;
      }

      // Fermer les modals ou fenêtres ouvertes
      var closeBtn = document.querySelector('button[aria-label="Close"], .close-modal, .btn-close');
      if (closeBtn) {
        closeBtn.click();
        return;
      }

      // Historique de navigation
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        // En haut de la pile : fermer l'application proprement
        if (window.PalmSystem && window.PalmSystem.platformBack) {
          window.PalmSystem.platformBack();
        } else if (window.webOS && window.webOS.platformBack) {
          window.webOS.platformBack();
        }
      }
      return;
    }

    // Touche Play / Pause (415 / 19)
    if (key === 415 || key === 19) {
      var video = document.querySelector('video');
      if (video) {
        if (video.paused) video.play();
        else video.pause();
      }
      return;
    }

    // Touches Channel Up / Down (33 / 34) : Défilement par page
    if (key === 33) { // Channel Up / Page Up
      window.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' });
    } else if (key === 34) { // Channel Down / Page Down
      window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
    }
  }, true);


  /* ====================================================================
   * 4. INJECTION DES STYLES TV (Lisibilité, Focus et Scrollbars)
   * ==================================================================== */

  var tvStyles = document.createElement('style');
  tvStyles.id = 'movix-tv-injected-styles';
  tvStyles.textContent = [
    // Rendre les ascenseurs visuels visibles et élégants pour savoir où on se trouve
    '::-webkit-scrollbar { width: 8px !important; height: 8px !important; display: block !important; }',
    '::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.4) !important; }',
    '::-webkit-scrollbar-thumb { background: #dc2626 !important; border-radius: 4px !important; }',
    // Focus et survol au pointeur
    ':focus, :focus-visible { outline: 3px solid #dc2626 !important; outline-offset: 3px !important; }',
    'a:hover img, .card:hover, .movie-card:hover { transform: scale(1.05) !important; transition: transform 0.2s ease !important; }',
    // Masquage automatique des bannières pub résiduelles
    'iframe[src*="ads"], div[class*="banner"], div[id*="ad-"], .ad-slot, .popunder { display: none !important; width: 0 !important; height: 0 !important; }'
  ].join('\n');

  if (document.head) {
    document.head.appendChild(tvStyles);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.head) document.head.appendChild(tvStyles);
    });
  }

  console.log('[MovixTV UserScript] Prêt (AdBlock + Défilement Magic Remote activés)');
})();

/**
 * Movix TV for LG webOS - UserScript d'injection globale (v1.0.3)
 * Injecté automatiquement par le moteur webOS Chromium dans toutes les pages et iframes
 *
 * Fonctionnalités :
 * 1. Protection Anti-Crash Critique : Neutralisation totale de window.close() et Window.prototype.close
 * 2. Bypass Auto-VIP & Ad-Free : Neutralise le prompt "cliquer sur une pub" en débloquant le mode AdFree natif
 * 3. Bloqueur de pubs (AdBlock) : Popups factices, blocage des régies, calques transparents et auto-skip
 * 4. Défilement Magic Remote : Molette fluide verticale et carrousels horizontaux (validé)
 * 5. Gestion sécurisée de la télécommande : Découplage strict Escape / Touche Retour (461)
 */

(function () {
  'use strict';

  if (window.__MOVIX_TV_INJECTED__) return;
  window.__MOVIX_TV_INJECTED__ = true;

  console.log('[MovixTV UserScript v1.0.3] Initialisation sur :', window.location.href);

  var noop = function () {};

  /* ====================================================================
   * 1. SÉCURITÉ CRITIQUE ANTI-CRASH : Neutralisation de window.close()
   * ====================================================================
   * Sur webOS, tout appel JavaScript à window.close() émet le signal système
   * WAM WINDOW_CLOSED_JS qui termine immédiatement le conteneur de l'application
   * et renvoie l'utilisateur à l'accueil de la TV.
   * Nous le neutralisons au niveau de Window.prototype et de chaque instance.
   */

  try {
    if (window.Window && window.Window.prototype) {
      window.Window.prototype.close = function () {
        console.warn('[MovixTV] Appel Window.prototype.close() intercepté et neutralisé');
      };
    }
  } catch (e) {}

  try {
    Object.defineProperty(window, 'close', {
      value: function () {
        console.warn('[MovixTV] Appel window.close() direct neutralisé');
      },
      writable: false,
      configurable: false
    });
    if (window.top && window.top !== window) {
      try { window.top.close = window.close; } catch (e) {}
    }
    if (window.parent && window.parent !== window) {
      try { window.parent.close = window.close; } catch (e) {}
    }
  } catch (e) {
    try { window.close = noop; } catch (err) {}
  }

  // Neutralisation dans les iframes nouvellement créées
  try {
    var rawAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function (child) {
      var res = rawAppendChild.apply(this, arguments);
      if (child && child.tagName === 'IFRAME') {
        try {
          if (child.contentWindow) {
            child.contentWindow.close = noop;
          }
        } catch (e) {}
      }
      return res;
    };
  } catch (e) {}


  /* ====================================================================
   * 2. BYPASS AUTO-VIP & AD-FREE (Supprime le prompt "Cliquer sur une pub")
   * ====================================================================
   * Movix embarque un AdFreePopupContext qui vérifie le flag 'is_vip' et
   * 'adWarningAccepted' dans localStorage.
   * Si 'is_vip' n'est pas présent, il bloque l'affichage de l'iframe du lecteur
   * et affiche une fenêtre modale invitant l'utilisateur à cliquer sur une pub.
   * En renvoyant 'true' à ces contrôles, le lecteur vidéo se lance directement !
   */

  try {
    // 1. Initialisation dans le localStorage du domaine
    localStorage.setItem('is_vip', 'true');
    localStorage.setItem('adWarningAccepted', 'true');
    localStorage.setItem('adfree_unlocked', 'true');

    // 2. Interception de Storage.prototype.getItem pour garantir 'true' même en cas de reset
    var rawGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'is_vip' || key === 'adWarningAccepted' || key === 'adfree_unlocked') {
        return 'true';
      }
      return rawGetItem.apply(this, arguments);
    };

    // 3. Notification des composants React de Movix
    window.dispatchEvent(new CustomEvent('vipStatusChanged'));
    window.dispatchEvent(new CustomEvent('ad_popup_accepted', { detail: { timestamp: Date.now() } }));
  } catch (e) {}


  /* ====================================================================
   * 3. MODULE ADBLOCK : Popups factices, régies et calques invisibles
   * ==================================================================== */

  // Objet Window factice retourné aux scripts publicitaires pour éviter tout plantage TypeError
  var dummyWindow = {
    closed: true,
    name: 'ad_dummy',
    focus: noop,
    blur: noop,
    close: noop,
    postMessage: noop,
    addEventListener: noop,
    removeEventListener: noop,
    opener: null,
    location: { href: '', replace: noop, assign: noop, reload: noop },
    document: {
      write: noop,
      writeln: noop,
      close: noop,
      open: noop,
      getElementById: function () { return null; },
      querySelector: function () { return null; }
    }
  };

  // Liste noire des régies publicitaires et réseaux de popups de streaming
  var AD_PATTERNS = [
    'adsterra', 'popads', 'popcash', 'propellerads', 'monetag', 'exoclick',
    'adcash', 'hilltopads', 'clickadu', 'admaven', 'bidgear', 'adtrue',
    'outbrain', 'taboola', 'mgid', 'richaudience', 'doubleclick', 'google-analytics',
    'googlesyndication', 'adservice', 'bet365', '1xbet', 'melbet', 'casino',
    'trafficjunky', 'juicyads', 'ero-advertising', 'wigetmedia', 'realsrv',
    'syndication', 'popunder', 'clickunder', 'delivery', 'tracker', 'adnxs',
    'onclickperf', 'glomup', 'directrev', 'vidspeed-ad', 'streamhide'
  ];

  function isAdUrl(url) {
    if (!url || typeof url !== 'string') return false;
    var lower = url.toLowerCase();
    for (var i = 0; i < AD_PATTERNS.length; i++) {
      if (lower.indexOf(AD_PATTERNS[i]) !== -1) return true;
    }
    return false;
  }

  // A. Blocage sécurisé des Popups / Popunders (window.open)
  try {
    var rawOpen = window.open;
    window.open = function (url) {
      if (!url) return dummyWindow;
      var strUrl = String(url);
      try {
        var parsed = new URL(strUrl, window.location.href);
        // N'autoriser que les navigations légitimes au sein de Movix
        if (parsed.hostname.indexOf('movix') !== -1 || parsed.hostname === window.location.hostname) {
          window.location.href = strUrl;
          return window;
        }
      } catch (err) {}
      console.log('[MovixAdBlock] Popup externe bloquée et simulée :', strUrl);
      return dummyWindow;
    };
  } catch (e) {}

  // B. Neutralisation des détecteurs d'adblockers
  try {
    window.canRunAds = true;
    window.isAdBlockActive = false;
    window.adblock = false;
  } catch (e) {}

  // C. Interception de la création de balises publicitaires script/iframe
  try {
    var rawCreateElement = document.createElement;
    document.createElement = function (tagName) {
      var el = rawCreateElement.apply(this, arguments);
      var tag = String(tagName).toLowerCase();

      if (tag === 'script' || tag === 'iframe') {
        var originalSetAttribute = el.setAttribute;
        el.setAttribute = function (name, value) {
          if (name && name.toLowerCase() === 'src' && isAdUrl(value)) {
            console.log('[MovixAdBlock] Élément publicitaire bloqué :', value);
            return;
          }
          return originalSetAttribute.apply(this, arguments);
        };
      }
      return el;
    };
  } catch (e) {}

  // D. Interception des clics sur bannières ou liens publicitaires externes
  window.addEventListener('click', function (e) {
    var target = e.target;
    while (target && target !== document.body && target !== document.documentElement) {
      if (target.tagName === 'A') {
        var href = target.getAttribute('href') || target.href || '';
        if (isAdUrl(href)) {
          console.log('[MovixAdBlock] Clic publicitaire annulé :', href);
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          try {
            var u = new URL(href, window.location.href);
            if (u.hostname.indexOf('movix') === -1 && u.hostname !== window.location.hostname) {
              console.log('[MovixAdBlock] Clic externe tiers neutralisé :', href);
              e.preventDefault();
              e.stopImmediatePropagation();
              return;
            }
          } catch (err) {}
        }
      }
      target = target.parentElement;
    }
  }, true);

  // E. Suppression des calques transparents click-jackers sur les lecteurs
  function removeAdOverlays() {
    var elements = document.querySelectorAll('div, a, span');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var style = window.getComputedStyle(el);
      if (
        (style.position === 'fixed' || style.position === 'absolute') &&
        parseInt(style.zIndex, 10) > 1000 &&
        (parseFloat(style.opacity) === 0 || style.backgroundColor === 'rgba(0, 0, 0, 0)') &&
        el.clientWidth > window.innerWidth * 0.6 &&
        el.clientHeight > window.innerHeight * 0.6
      ) {
        console.log('[MovixAdBlock] Calque click-jacker transparent retiré');
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    }
  }

  // F. Auto-clic sur les boutons "Passer l'annonce" / "Skip" des lecteurs
  function autoSkipAds() {
    var skipSelectors = [
      '.video-ad-skip', '.skip-ad', '.ad-skip', '.skip-button',
      'button[class*="skip"]', 'div[class*="skip"]',
      '.ad-close', '.close-ad', 'button[class*="close-ad"]',
      '#close-btn'
    ];
    for (var s = 0; s < skipSelectors.length; s++) {
      var btn = document.querySelector(skipSelectors[s]);
      if (btn && btn.offsetParent !== null) {
        btn.click();
      }
    }
  }

  setInterval(function () {
    removeAdOverlays();
    autoSkipAds();
  }, 800);


  /* ====================================================================
   * 4. MODULE ROULETTE & DÉFILEMENT LG MAGIC REMOTE (Validé opérationnel)
   * ==================================================================== */

  window.addEventListener('wheel', function (e) {
    var target = document.elementFromPoint(e.clientX, e.clientY) || e.target;
    var delta = e.deltaY;
    if (!delta && e.wheelDelta) delta = -e.wheelDelta / 2;
    if (!delta) delta = (e.detail || 0) * 40;

    var current = target;
    var handled = false;

    while (current && current !== document.body && current !== document.documentElement) {
      var style = window.getComputedStyle(current);
      var canScrollY = (style.overflowY === 'auto' || style.overflowY === 'scroll') && current.scrollHeight > current.clientHeight;
      var canScrollX = (style.overflowX === 'auto' || style.overflowX === 'scroll') && current.scrollWidth > current.clientWidth;

      // Défilement horizontal sur les rangées de films
      if (canScrollX && !canScrollY) {
        current.scrollLeft += delta * 1.8;
        handled = true;
        break;
      }

      // Défilement vertical sur conteneur
      if (canScrollY) {
        current.scrollTop += delta * 1.8;
        handled = true;
        break;
      }

      current = current.parentElement;
    }

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
   * 5. GESTION SÉCURISÉE DES TOUCHES TÉLÉCOMMANDE (Fix Crash)
   * ==================================================================== */

  window.addEventListener('keydown', function (e) {
    var key = e.keyCode || e.which;

    // A. Touche ECHAP (27) : Ne JAMAIS fermer l'application webOS
    if (key === 27) {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
      return;
    }

    // B. Touche RETOUR PHYSIQUE Magic Remote (461)
    if (key === 461) {
      e.preventDefault();

      // 1. Quitter le plein écran vidéo si actif
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        return;
      }

      // 2. Fermer un modal ou dialogue ouvert
      var closeBtn = document.querySelector('button[aria-label="Close"], .close-modal, .btn-close');
      if (closeBtn) {
        closeBtn.click();
        return;
      }

      // 3. Navigation d'historique (Retour aux fiches ou catalogue)
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        // Uniquement si on est sur la page d'accueil racine
        if (window.location.pathname === '/' || window.location.pathname === '') {
          if (window.PalmSystem && window.PalmSystem.platformBack) {
            window.PalmSystem.platformBack();
          }
        } else {
          // Revenir à l'accueil Movix
          window.location.href = '/';
        }
      }
      return;
    }

    // C. Touche Play / Pause (415 / 19)
    if (key === 415 || key === 19) {
      var video = document.querySelector('video');
      if (video) {
        if (video.paused) video.play();
        else video.pause();
      }
      return;
    }

    // D. Touches Chaîne +/- (Channel Up 33 / Down 34) : Défilement par page
    if (key === 33) {
      window.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' });
    } else if (key === 34) {
      window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
    }
  }, true);


  /* ====================================================================
   * 6. INJECTION DES STYLES TV (Lisibilité, Focus et Scrollbars)
   * ==================================================================== */

  var tvStyles = document.createElement('style');
  tvStyles.id = 'movix-tv-injected-styles';
  tvStyles.textContent = [
    '::-webkit-scrollbar { width: 8px !important; height: 8px !important; display: block !important; }',
    '::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.4) !important; }',
    '::-webkit-scrollbar-thumb { background: #dc2626 !important; border-radius: 4px !important; }',
    ':focus, :focus-visible { outline: 3px solid #dc2626 !important; outline-offset: 3px !important; }',
    'a:hover img, .card:hover, .movie-card:hover { transform: scale(1.05) !important; transition: transform 0.2s ease !important; }',
    'iframe[src*="ads"], div[class*="banner"], div[id*="ad-"], .ad-slot, .popunder { display: none !important; width: 0 !important; height: 0 !important; }'
  ].join('\n');

  if (document.head) {
    document.head.appendChild(tvStyles);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.head) document.head.appendChild(tvStyles);
    });
  }

  console.log('[MovixTV UserScript] Prêt (Protections anti-crash et Auto-VIP activées)');
})();

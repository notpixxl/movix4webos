/**
 * Movix TV - Adaptateur Télécommande LG webOS (Magic Remote & D-Pad)
 * Gestion des touches matérielles et navigation spatiale
 */

(function (window, document) {
  'use strict';

  var TV_KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    ENTER: 13,
    BACK: 461,       // webOS Magic Remote Back button
    PLAY: 415,
    PAUSE: 19,
    STOP: 413,
    FAST_FWD: 417,
    REWIND: 412,
    RED: 403,
    GREEN: 404,
    YELLOW: 405,
    BLUE: 406
  };

  var TvAdapter = {
    init: function () {
      console.log('[MovixTV] Initialisation du gestionnaire de télécommande LG webOS');
      try {
        window.close = function () {};
      } catch (e) {}
      this.bindKeyEvents();
      this.enableSpatialNavigation();
    },

    bindKeyEvents: function () {
      var self = this;
      window.addEventListener('keydown', function (e) {
        var keyCode = e.keyCode || e.which;

        // Touche Retour physique Magic Remote (461) ou GoBack (NE PAS inclure Escape 27 pour éviter les crashs sur lecteur vidéo)
        var isBackKey = (keyCode === TV_KEYS.BACK || e.key === 'GoBack');

        if (isBackKey) {
          e.preventDefault();
          self.handleBack();
          return;
        }

        switch (keyCode) {

          case TV_KEYS.PLAY:
          case TV_KEYS.PAUSE:
            self.handlePlayPause();
            break;

          case TV_KEYS.FAST_FWD:
            self.seekVideo(10);
            break;

          case TV_KEYS.REWIND:
            self.seekVideo(-10);
            break;

          case TV_KEYS.RED:
            console.log('[MovixTV] Bouton Rouge pressé : rechargement');
            window.location.reload();
            break;

          case TV_KEYS.LEFT:
          case TV_KEYS.RIGHT:
          case TV_KEYS.UP:
          case TV_KEYS.DOWN:
            self.handleDirectionalKey(keyCode, e);
            break;
        }
      }, true);
    },

    handleBack: function () {
      // 1. Si un modal ou menu est ouvert, le fermer
      var activeModal = document.querySelector('.modal.open, [role="dialog"][aria-modal="true"]');
      if (activeModal) {
        var closeBtn = activeModal.querySelector('.close-btn, button[aria-label="Close"]');
        if (closeBtn) {
          closeBtn.click();
          return;
        }
      }

      // 2. Si une vidéo est en plein écran, quitter le plein écran
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        return;
      }

      // 3. Navigation d'historique web
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        // En haut de l'arbre : quitter l'application webOS proprement
        if (window.webOS && window.webOS.platformBack) {
          window.webOS.platformBack();
        } else if (window.PalmSystem && window.PalmSystem.platformBack) {
          window.PalmSystem.platformBack();
        }
      }
    },

    handlePlayPause: function () {
      var video = document.querySelector('video');
      if (video) {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      }
    },

    seekVideo: function (seconds) {
      var video = document.querySelector('video');
      if (video && !isNaN(video.duration)) {
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
      }
    },

    handleDirectionalKey: function (keyCode, event) {
      // Navigation spatiale basique si aucun élément n'est sélectionné
      var activeEl = document.activeElement;
      var focusables = Array.prototype.slice.call(
        document.querySelectorAll('a, button, input, [tabindex="0"], [role="button"]')
      ).filter(function (el) {
        return el.offsetParent !== null && !el.disabled;
      });

      if (focusables.length === 0) return;

      if (!activeEl || activeEl === document.body) {
        focusables[0].focus();
        event.preventDefault();
        return;
      }

      // Calcul de proximité directionnelle
      var currentRect = activeEl.getBoundingClientRect();
      var bestEl = null;
      var bestDistance = Infinity;

      focusables.forEach(function (el) {
        if (el === activeEl) return;
        var r = el.getBoundingClientRect();

        var isCandidate = false;
        if (keyCode === TV_KEYS.UP && r.bottom <= currentRect.top + 10) isCandidate = true;
        if (keyCode === TV_KEYS.DOWN && r.top >= currentRect.bottom - 10) isCandidate = true;
        if (keyCode === TV_KEYS.LEFT && r.right <= currentRect.left + 10) isCandidate = true;
        if (keyCode === TV_KEYS.RIGHT && r.left >= currentRect.right - 10) isCandidate = true;

        if (isCandidate) {
          var dx = (r.left + r.width / 2) - (currentRect.left + currentRect.width / 2);
          var dy = (r.top + r.height / 2) - (currentRect.top + currentRect.height / 2);
          var dist = Math.sqrt(dx * dx + dy * dy);

          // Favoriser l'alignement sur l'axe principal
          if (keyCode === TV_KEYS.UP || keyCode === TV_KEYS.DOWN) dist += Math.abs(dx) * 1.5;
          if (keyCode === TV_KEYS.LEFT || keyCode === TV_KEYS.RIGHT) dist += Math.abs(dy) * 1.5;

          if (dist < bestDistance) {
            bestDistance = dist;
            bestEl = el;
          }
        }
      });

      if (bestEl) {
        bestEl.focus();
        if (bestEl.scrollIntoViewIfNeeded) bestEl.scrollIntoViewIfNeeded();
        else bestEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        event.preventDefault();
      }
    },

    enableSpatialNavigation: function () {
      // Support natif webOS si disponible
      if (window.PalmSystem) {
        console.log('[MovixTV] Environnement webOS détecté');
      }
    }
  };

  window.MovixTvAdapter = TvAdapter;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      TvAdapter.init();
    });
  } else {
    TvAdapter.init();
  }
})(window, document);

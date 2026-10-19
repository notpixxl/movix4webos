# Movix TV pour LG webOS (OLED & Smart TV)

<p align="center">
  <img src="movix.svg" alt="Movix TV Logo" width="140" height="140">
</p>

<p align="center">
  <strong>Client webOS natif et optimisé pour la plateforme de streaming francophone Movix</strong><br>
  Développé et validé sur téléviseur <strong>LG OLED C9 (webOS 4.5)</strong> avec prise en charge de la télécommande <strong>LG Magic Remote</strong> et des flèches directionnelles (D-Pad).
</p>

<p align="center">
  <a href="https://github.com/notpixxl/movix4webos/releases/latest"><img src="https://img.shields.io/github/v/release/notpixxl/movix4webos?color=dc2626&label=Version" alt="Dernière Version"></a>
  <a href="https://github.com/notpixxl/movix4webos/actions"><img src="https://github.com/notpixxl/movix4webos/actions/workflows/release.yml/badge.svg" alt="Build Status"></a>
  <img src="https://img.shields.io/badge/webOS-4.5%20(Test%C3%A9%20sur%20OLED%20C9)-0083ca?logo=lg&logoColor=white" alt="Testé sur webOS 4.5 (LG OLED C9)">
  <img src="https://img.shields.io/badge/Homebrew_Channel-Compatible-10b981?logo=apple&logoColor=white" alt="Homebrew Channel Ready">
  <img src="https://img.shields.io/badge/OLED-Optimized%20Dark%20UI-black" alt="OLED Optimized">
  <img src="https://img.shields.io/badge/Licence-CC--BY--NC--4.0-lightgrey.svg" alt="Licence">
</p>

---

## 📺 Matériel Testé & Compatibilité

> [!IMPORTANT]
> **Périmètre des tests réels :**
> - **Modèle testé et validé physiquement :** LG OLED C9 (`OLED55C9PLA`)
> - **Version webOS testée :** webOS 4.5 (Firmware `05.40.xx`)
> - **Autres modèles / versions webOS :** L'application utilise les APIs webOS standard et le moteur Chromium (compatible en théorie avec webOS 4.x+), mais **elle n'a pas été testée sur d'autres modèles ou versions récentes de webOS**. Vos retours d'expérience et rapports de compatibilité sont les bienvenus sur les [Issues GitHub](https://github.com/notpixxl/movix4webos/issues) !

---

## 🎯 Points Forts & Fonctionnalités

- **🔄 Résolution dynamique d'instance** : Au démarrage, l'application interroge automatiquement l'infrastructure Movix pour détecter et basculer sur le miroir actif (`movix.dog`, etc.), avec gestion de secours si l'adresse change.
- **🛡️ Bloqueur de publicités & Bypass Ad-Free natif** :
  - Déblocage automatique du mode VIP dans l'application Movix pour supprimer le prompt *"Cliquer sur une pub"* et charger les lecteurs vidéo immédiatement.
  - Neutralisation des popups et popunders externes (`window.open`).
  - Suppression automatique des calques invisibles de click-jacking et auto-skip des annonces de lecteurs.
- **🛑 Protection Anti-Crash webOS** : Neutralisation de `window.close()` et `Window.prototype.close` pour empêcher les régies externes de tuer brutalement l'application TV.
- **🎮 Support Complet Magic Remote & D-Pad** :
  - **Molette (Scroll Wheel)** : Défilement vertical fluide sur les listes et défilement horizontal automatique sur les carrousels de films.
  - **Flèches directionnelles (D-Pad)** : Navigation prédictive case par case pour une utilisation confortable même sans pointeur gyroscopique.
  - **Sécurité Sortie "Double-Tap"** : Un toast discret avertit l'utilisateur avant de quitter, évitant toute fermeture accidentelle du film.
- **📺 Optimisé Dalle OLED (10-Foot UI)** : Thème noir absolu `#000000`, halo rouge `#dc2626` haute visibilité à 3 mètres et accélération matérielle GPU activée.

---

## 🎮 Tableau des Commandes Télécommande

| Touche Télécommande | Action dans Movix TV |
| :--- | :--- |
| **Pointeur / Gyroscope** | Navigation fluide et zoom avec halo au survol des affiches de films |
| **Roulette (Scroll Wheel)** | Défilement vertical des catalogues et horizontal des carrousels |
| **Flèches D-Pad (Haut/Bas/Gauche/Droite)** | Navigation spatiale case par case avec surbrillance rouge nette |
| **OK / Molette Clic** | Valider, ouvrir la fiche du film ou lancer la lecture |
| **Touche Retour (Back - 461)** | **1.** Quitter plein écran ➔ **2.** Fermer modal ➔ **3.** Page précédente ➔ **4.** Double-tap pour quitter |
| **Lecture / Pause (415 / 19)** | Mettre en pause ou relancer la vidéo en cours |
| **Touches Chaîne (+/-)** | Défilement rapide d'une page vers le haut ou le bas |
| **Bouton Jaune (405)** | Accès direct aux paramètres et sélection manuelle du miroir |
| **Bouton Rouge (403)** | Recharger l'application ou actualiser la page |

---

## 🚀 Méthodes d'Installation

### Option 1 : Via webOS Dev Manager (Recommandé sur PC / Mac)

1. Téléchargez et lancez **[webOS Dev Manager](https://github.com/webosbrew/dev-manager-desktop/releases)**.
2. Connectez-vous à votre téléviseur LG.
3. Glissez-déposez le paquet **[`com.movix.client_1.0.4_all.ipk`](com.movix.client_1.0.4_all.ipk)** dans la fenêtre de webOS Dev Manager.
4. L'application **Movix TV** apparaît instantanément dans la barre d'accueil de votre téléviseur !

---

### Option 2 : Via Homebrew Channel (Dépôt officiel personnalisé)

Ajoutez directement ce dépôt comme source dans **Homebrew Channel** pour bénéficier des mises à jour en un clic depuis votre TV :

1. Sur votre téléviseur LG, ouvrez **Homebrew Channel**.
2. Rendez-vous dans **Paramètres** (icône roue crantée) ➔ **Repositories** ➔ **Add repository**.
3. Saisissez l'URL officielle du flux :
   ```text
   https://raw.githubusercontent.com/notpixxl/movix4webos/main/apps.json
   ```
4. Cliquez sur **Valider** : **Movix TV** apparaît dans le catalogue d'applications de votre téléviseur.

---

## 📁 Architecture Technique

```text
movix-webos/
├── appinfo.json                   # Manifeste officiel de l'application webOS
├── index.html                     # Écran de démarrage OLED et résolveur dynamique
├── app.js                         # Moteur de résolution rapide et bascule de miroir
├── style.css                      # Design System sombre OLED
├── tv-styles.css                  # Styles TV (halo lumineux, contraste, scrollbars)
├── tv-adapter.js                  # Adaptateur matériel télécommande LG webOS
├── webOSUserScripts/
│   └── userScript.js              # Script d'injection globale (Anti-crash, AdBlock, D-Pad, Molette)
├── icon.png                       # Icône d'application (80×80)
├── largeIcon.png                  # Grande icône pour le Home Launcher LG (130×130)
├── movix.svg                      # Logo officiel vectoriel
├── apps.json                      # Flux catalogue pour Homebrew Channel
├── manifest.json                  # Descripteur de paquet pour webOS
├── webosbrew.json                 # Métadonnées webosbrew
├── package.ps1                    # Script de compilation IPK Unix ar (Windows)
└── .github/workflows/
    ├── ci.yml                     # Validation et tests de compilation continus
    └── release.yml                # Compilation automatique et publication de release
```

---

## ⚙️ Compilation Manuelle (PowerShell)

Pour compiler vous-même le paquet `.ipk` sans installer le SDK LG :

```powershell
powershell -ExecutionPolicy Bypass -File .\package.ps1
```

Le script produit automatiquement le conteneur Debian `ar` autonome et met à jour les empreintes SHA256 des flux de distribution.

---

## 📄 Licence & Mentions Légales

Projet communautaire à but éducatif. Distribué sous licence **CC-BY-NC 4.0** (Attribution - Pas d'Utilisation Commerciale).
Les flux et contenus multimédias restent la propriété exclusive de leurs ayants droit respectifs.

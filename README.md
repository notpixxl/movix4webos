# Movix TV pour LG webOS (OLED & TV Connectées)

Client webOS pour la plateforme de streaming francophone **Movix**, optimisé pour les téléviseurs **LG webOS (webOS 4.5+ sur LG C9/B9/CX/C1/C2/C3/C4...)** avec prise en charge complète de la télécommande **LG Magic Remote** et des flèches directionnelles (D-Pad).

---

## 🎯 Fonctionnalités Principales

- **Résolution dynamique automatique** : Au lancement, l'application interroge en temps réel `https://movix.online` pour découvrir et charger le miroir officiel actif (actuellement `https://movix.dog`), avec bascule de secours si le domaine change.
- **Plein Écran Direct (Native Hardware Video)** : Navigue le moteur Chromium de webOS vers l'instance active. Aucun blocage d'iframe sur les lecteurs tiers (HLS/DASH/WASM), avec accélération matérielle GPU activée.
- **Télécommande LG Magic Remote & D-Pad** :
  - Touche **Retour (Back - 461 / GoBack / Escape)** gérée nativement pour fermer les lecteurs/modals ou quitter l'app via `PalmSystem.platformBack()`.
  - Touches multimédia : **Lecture / Pause (415 / 19)**, avance/retour rapide.
  - Raccourcis couleur : **Jaune (405)** pour les paramètres de miroir, **Rouge (403)** pour actualiser.
- **Optimisation Dalle OLED & Lisibilité 3 mètres (10-foot UI)** :
  - Thème sombre à fort contraste pour éviter tout marquage et offrir des noirs parfaits.
  - Halo lumineux et zoom au survol pour le pointeur gyroscopique de la Magic Remote.
  - Suppression automatique des barres de défilement pour un rendu épuré type application native.

---

## 📁 Structure du Projet

```text
movix-webos/
├── appinfo.json           # Manifeste officiel de l'application webOS
├── index.html             # Lanceur TV OLED, résolution dynamique et OSD
├── app.js                 # Moteur de résolution de miroir et contrôleur TV
├── style.css              # Design System sombre 10-foot UI optimisé OLED
├── tv-styles.css          # Styles d'agrandissement, contraste et focus curseur
├── tv-adapter.js          # Adaptateur télécommande Magic Remote & touches TV
├── icon.png               # Icône webOS (80×80)
├── largeIcon.png          # Grande icône pour le lanceur webOS (130×130)
├── movix.svg              # Logo officiel vectoriel
├── apps.json              # Flux de catalogue pour Homebrew Channel
├── manifest.json          # Manifeste d'installation Homebrew Channel
├── webosbrew.json         # Métadonnées officielles webosbrew
├── package.ps1            # Script local de packaging IPK (Windows)
├── package.json           # Descripteur de projet standard
├── .github/workflows/     # Compilation automatique CI/CD et releases GitHub
└── com.movix.client_...ipk # Paquet IPK prêt à installer
```

---

## 🚀 Méthodes de Déploiement

### Méthode 1 : Via webOS Dev Manager (Simple & Rapide)

1. Téléchargez et ouvrez **webOS Dev Manager** sur votre ordinateur.
2. Connectez-vous à votre téléviseur LG.
3. Cliquez sur **Install** (ou glissez-déposez le fichier [`com.movix.client_1.0.0_all.ipk`](com.movix.client_1.0.0_all.ipk) dans la fenêtre).
4. L'application s'installe et l'icône **Movix TV** apparaît instantanément dans la barre de lancement de votre téléviseur.

---

### Méthode 2 : Via Homebrew Channel (Ajouter ce repo comme source)

Vous pouvez ajouter ce dépôt comme source personnalisée directement dans **Homebrew Channel** sur votre TV :

1. Dépôt officiel GitHub : [https://github.com/notpixxl/movix4webos](https://github.com/notpixxl/movix4webos)
2. Sur votre téléviseur LG, ouvrez **Homebrew Channel**.
3. Allez dans les **Paramètres** (icône d'engrenage en haut à droite) ➔ **Repositories** ➔ **Add repository**.
4. Entrez l'URL directe vers votre fichier `apps.json` :
   ```text
   https://raw.githubusercontent.com/notpixxl/movix4webos/main/apps.json
   ```
5. Validez : l'application **Movix TV** apparaît dans le catalogue Homebrew Channel de votre téléviseur avec installation et mises à jour en 1 clic !

> **Astuce d'automatisation GitHub** : Le workflow [`.github/workflows/release.yml`](.github/workflows/release.yml) inclus compile automatiquement le paquet IPK et met à jour le fichier `apps.json` à chaque mise à jour sur votre dépôt GitHub.

---

## 🎨 Focus Curseur & Confort Visuel

Le fichier [`tv-styles.css`](tv-styles.css) applique les règles ergonomiques suivantes :

1. **Aura lumineuse et grossissement au survol (Magic Remote)** :
   Sur un grand écran à 3 mètres, le curseur gyroscopique applique un `transform: scale(1.06)` avec halo rouge (`box-shadow: 0 0 20px rgba(220, 38, 38, 0.5)`) sur chaque affiche de film et bouton.

2. **Mise en valeur du focus D-Pad (`:focus-visible`)** :
   Un contour épais de 3px (`outline: 3px solid #dc2626 !important; outline-offset: 4px;`) permet de savoir immédiatement quel élément est actif lors de la navigation avec les flèches directionnelles.

3. **Masquage des barres de défilement** :
   La règle `*::-webkit-scrollbar { display: none !important; }` élimine les ascenseurs visuels tout en conservant le défilement fluide au pointeur ou à la molette.

4. **Réglage recommandé sur votre téléviseur LG** :
   - Allez dans : **Tous les paramètres > Accessibilité > Options du pointeur**.
   - Réglez la **Vitesse de suivi** sur *Moyenne* et la **Taille du pointeur** sur *Grande*.

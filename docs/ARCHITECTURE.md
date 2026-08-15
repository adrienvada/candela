# Architecture — Candela 2D - Web

Carte du code telle qu'elle est aujourd'hui. À mettre à jour dès qu'un fichier ou
une classe bouge.

## Arborescence

```
index.html          414 l.   Structure DOM : menu, sélection, HUD, écrans de victoire
style.css          1828 l.   Tout le style (glassmorphism, néon, animations)
game.js            3865 l.   TOUT le jeu, en un seul fichier
assets/weapons/             Visuels d'armes (HD)
favicon/
scratch/                    Harnais de test HTML manuels, hors production
Archive/V0.1/               Snapshot figé de la v0.1, ne pas modifier
docs/                       Cette documentation
```

Aucune dépendance, aucun build. `index.html` s'ouvre directement.

## Carte de `game.js`

Le fichier est découpé en sections numérotées par des bannières de commentaires.

| Ligne | Classe | Rôle |
|---|---|---|
| 11 | `AudioEngine` | Sons procéduraux via Web Audio API |
| 233 | `InputManager` | Clavier (AZERTY/QWERTY/QWERTZ auto-détecté) + manettes, D-Pad, L1/R1, haptique |
| 613 | `LineSegment` | Primitive de mur |
| 620 | `TacticalMap` | 7 maps (`MAP_LIST` l.633), murs, obstacles, spawns, génération procédurale |
| 858 | `RaycastEngine` | Calcul des polygones de lumière / champ de vision |
| 987 | `WEAPONS` | Table de données : `PISTOL`, `SHOTGUN`, `SNIPER` |
| 996 | `Player` | État joueur, déplacement, dash + i-frames, switch d'arme, éblouissement |
| 1247 | `Bullet` | Projectile, collisions murs et joueurs |
| 1349 | `ParticleSystem` | Impacts, sang, muzzle flash (cap à 120) |
| 1527 | `AmbientParticleSystem` | Poussière d'ambiance |
| 1582 | `ReplaySystem` | Capture d'états pour la killcam |
| 1623 | `CandelaGame` | **~2200 lignes** — orchestrateur : menu, boucle, simulation, rendu, HUD |

### Points d'entrée de `CandelaGame`

- `loop(timestamp)` — l.3826, `requestAnimationFrame`. Calcule
  `dt = Math.min(0.05, (timestamp - lastTime) / 1000)` puis appelle `update(dt)` et `render()`.
- `update(dt)` — l.2412. Lit les inputs, fait avancer joueurs / balles / particules,
  résout l'éblouissement, teste les conditions de fin de manche.
- `render()` — l.2832. Deux appels à `renderViewport()` (split-screen) + `renderHUD()`.

### Machine à états

`this.gameState` prend les valeurs `'START'`, `'PLAYING'`, `'VICTORY'`.
Format de match : `BO3` / `BO5` (`targetWins`), avec Overtime (anneau qui se resserre,
`overtimeRingRadius`).

## Ce qui bloque la mise en réseau

Cette section est la raison d'être de la Phase 0 de la roadmap.

1. **Simulation et rendu sont entrelacés.** `CandelaGame` lit le DOM, joue des sons,
   dessine sur le canvas et fait avancer la physique dans les mêmes méthodes. Un
   serveur autoritatif a besoin de la simulation **seule**, sans `document` ni `canvas`.

2. **Les inputs sont tirés, pas poussés.** `update()` appelle directement
   `this.inputManager.getPlayerInput(0, ...)` (l.2564-2565). Tant que la simulation
   va chercher elle-même les inputs dans les périphériques locaux, elle ne peut pas
   consommer les inputs d'un joueur distant.
   → **C'est la couture principale à ouvrir.** `update()` doit recevoir un tableau
   de trames d'entrée `[{moveX, moveY, aimX, aimY, shoot, dash, swap}, …]` en
   paramètre. Une fois fait, le local, le bot, le replay et le réseau empruntent
   le même chemin de code.

3. **Le pas de temps est variable.** `dt` dépend du framerate réel. Deux machines
   ne produiront jamais la même simulation. Il faut un **tick fixe** (accumulateur,
   ex. 60 Hz) pour que l'état soit reproductible et comparable.

4. **L'état du monde n'est pas sérialisable.** L'état vit éparpillé dans des champs
   de `CandelaGame` mêlés à des références DOM et des systèmes de particules.
   Il faut un objet `WorldState` net (joueurs, balles, tick, seed de map) qu'on
   puisse convertir en JSON et envoyer sur le fil.

5. **La génération de map `RANDOM` n'est pas seedée.** Deux clients généreraient
   des décors différents. Il faut un PRNG seedé, avec la seed transmise par le serveur.

`ReplaySystem` (l.1582) capture déjà des instantanés pour la killcam : c'est le
meilleur point de départ pour définir à quoi doit ressembler un `WorldState`.

## Découpage cible (Phase 0)

```
src/
  core/        sim pure, aucun accès DOM/canvas — rejouable côté serveur
    world.js         WorldState + tick fixe
    player.js
    bullet.js
    weapons.js
    map.js
    rng.js           PRNG seedé
  render/      lecture seule de WorldState
    viewport.js
    hud.js
    particles.js
  input/
    inputManager.js  produit des trames d'entrée
  net/         (Phase 1)
  main.js
server/        (Phase 1) Node, importe src/core/ tel quel
```

La règle qui rend tout le reste possible : **rien dans `src/core/` ne référence
`document`, `window` ou `canvas`.**

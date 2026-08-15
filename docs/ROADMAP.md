# Roadmap — Candela

**Dernière mise à jour : 2026-08-15**

Document vivant. À relire en début de session, à mettre à jour en fin de session.

---

## 👉 Prochaine action

**Phase 0, étape 0.1** : extraire la simulation du rendu dans `game.js`, en
commençant par faire prendre à `update()` un tableau de trames d'entrée en
paramètre au lieu d'interroger `InputManager` en interne.

Ne pas écrire de code réseau avant que la Phase 0 soit terminée. Voir ADR-005.

---

## ✅ Fait — Multijoueur local (v0.2)

Le jeu est complet et jouable à deux sur une même machine.

- [x] Moteur de lumière par raycast, champ de vision, éblouissement
- [x] Split-screen deux joueurs
- [x] Clavier universel (AZERTY / QWERTY / QWERTZ, détection auto)
- [x] Manettes : navigation D-Pad, L1/R1, curseurs virtuels, retour haptique
- [x] **Axe 1** — 7 maps hand-crafted + carrousel de sélection
- [x] **Axe 2** — loadout à 2 armes, switch en 0,2 s, dash avec i-frames (cd 1 s)
- [x] **Axe 3** — visuels d'armes HD, format Bo3/Bo5, Overtime, stats de fin de match
- [x] **Axe 4** — polish & juice : hitstop, vibrations, animations de mort, UI glassmorphism
- [x] HUD in-game (arme en main / arme holstérée, indicateur SWAP)
- [x] Killcam via `ReplaySystem`

---

## ⬜ Phase 0 — Refactor « netcode-ready » *(aucun réseau)*

**Objectif** : rendre la simulation exécutable hors du navigateur et reproductible.
Sans cette phase, tout code réseau sera à réécrire. Le jeu doit rester
**strictement identique à jouer** à la fin de la phase — c'est le critère de succès.

- [ ] **0.1 — Inputs poussés, plus tirés.** `update(dt, inputFrames[])` reçoit les
      trames en paramètre. `InputManager` devient un *producteur* de trames.
      *C'est l'étape qui débloque tout le reste.*
- [ ] **0.2 — Tick fixe.** Accumulateur à 60 Hz, `dt` constant dans la simulation.
      Le rendu garde son framerate libre et interpole.
- [ ] **0.3 — Séparation sim / rendu.** Découper `game.js` selon l'arborescence
      cible de `docs/ARCHITECTURE.md`. Règle dure : `src/core/` ne touche jamais
      `document`, `window` ni `canvas`.
- [ ] **0.4 — `WorldState` sérialisable.** Un objet net (joueurs, balles, tick,
      seed) convertible en JSON. S'appuyer sur ce que capture déjà `ReplaySystem`.
- [ ] **0.5 — PRNG seedé.** La map `RANDOM` et tout aléa de gameplay (spread du
      shotgun) passent par un générateur seedé.
- [ ] **0.6 — Test de déterminisme.** Rejouer une même liste de trames d'entrée
      depuis un même état initial doit produire un `WorldState` final identique,
      deux fois de suite. Ce test est le filet de sécurité de toute la Phase 1.

---

## ⬜ Phase 1 — Duel en ligne 1v1

**Objectif** : deux joueurs sur deux machines différentes, via un serveur autoritatif.

- [ ] **1.1 — Serveur Node autoritatif** dans `server/`, qui importe `src/core/`
      tel quel et fait tourner la simulation à 60 Hz. Transport **WebSocket** (`ws`).
      Voir ADR-002 pour le rejet de WebRTC/P2P.
- [ ] **1.2 — Protocole.** Client → serveur : trames d'entrée horodatées.
      Serveur → client : snapshots de `WorldState` (delta-compressés si besoin).
- [ ] **1.3 — Salons.** Création de partie, code d'invitation à 6 caractères,
      rejoindre par code. Pas encore de matchmaking.
- [ ] **1.4 — Prédiction client.** Le joueur local applique ses inputs
      immédiatement, puis réconcilie sur snapshot serveur (rollback + rejeu).
      Le déterminisme de la Phase 0 rend ça possible.
- [ ] **1.5 — Interpolation adversaire.** Rendu de l'adversaire ~100 ms dans le
      passé, entre deux snapshots, pour masquer la latence.
- [ ] **1.6 — Cas dégradés.** Déconnexion, reconnexion, forfait, pause, timeout.
- [ ] **1.7 — Passage en plein écran.** En ligne, plus de split-screen : chaque
      joueur a la vue entière. Le HUD doit s'adapter.

**Critère de succès** : un duel Bo3 complet entre deux machines sur des réseaux
différents, jouable jusqu'au bout, avec ~60 ms de latence.

---

## ⬜ Phase 2 — Comptes & persistance (Supabase)

- [ ] **2.1 — Projet Supabase**, schéma initial, migrations versionnées dans `supabase/`.
- [ ] **2.2 — Auth.** Supabase Auth (email + OAuth). Pseudo unique par joueur.
- [ ] **2.3 — Tables.** `profiles`, `matches`, `match_players`, `ratings`.
- [ ] **2.4 — RLS.** Lecture publique sur les classements ; **aucune** policy
      d'écriture client sur `matches` et `ratings`. Voir ADR-004.
- [ ] **2.5 — Écriture des résultats.** Le serveur de jeu (et lui seul, via
      `service_role`) écrit le résultat du match à la fin de la partie.
- [ ] **2.6 — Historique.** Écran « mes derniers matchs » avec stats
      (précision, dégâts, dashes — déjà collectées par `matchStats`).

---

## ⬜ Phase 3 — Système compétitif ELO

- [ ] **3.1 — Calcul serveur.** Fonction Postgres ou Edge Function, appelée par le
      serveur de jeu, qui calcule l'ELO **dans une transaction**. Jamais côté client.
- [ ] **3.2 — Paramètres.** ELO de départ 1200, K adaptatif (K=40 sur les 10
      premiers matchs, K=20 ensuite, K=10 au-dessus de 2100). À arbitrer et
      consigner dans un ADR.
- [ ] **3.3 — Placement.** 5 matchs de placement avant d'afficher un rang.
- [ ] **3.4 — Ligues** (Bronze → Argent → Or → Platine → Diamant) et affichage du rang.
- [ ] **3.5 — Classement.** Leaderboard global, vue paginée, saisons.
- [ ] **3.6 — Matchmaking par MMR.** File d'attente, fenêtre de recherche qui
      s'élargit avec le temps d'attente.
- [ ] **3.7 — Abandon.** Pénalité pour déconnexion volontaire, distinguer crash
      et rage-quit.

---

## ⬜ Phase 4 — Durcissement & mise en production

- [ ] **4.1 — Validation d'inputs serveur.** Rejeter les trames impossibles
      (vitesse, cadence de tir, dash hors cooldown).
- [ ] **4.2 — Rate limiting** sur la création de salons et la file d'attente.
- [ ] **4.3 — Hébergement** du serveur de jeu (Fly.io / Railway), avec au moins une
      région EU. Le client statique sur Netlify / Vercel / GitHub Pages.
- [ ] **4.4 — Observabilité.** Logs de match, métriques de latence, taux de désync.
- [ ] **4.5 — Charge.** Vérifier combien de duels simultanés tient une instance.

---

## 🔷 Piste optionnelle — Epic Online Services

**Statut : mise en pause. Pas un prérequis du multijoueur.** Voir ADR-003.

EOS n'offre pas de transport P2P utilisable depuis un navigateur (le SDK P2P est
C/C++/C#/Unreal/Unity, et un navigateur ne peut pas ouvrir de socket UDP brut).
Ce qui reste accessible en web, c'est la Web API REST : identité Epic, lobbies,
leaderboards — des fonctions que Supabase couvre déjà.

À reconsidérer seulement si l'un de ces besoins apparaît :
- distribution sur l'Epic Games Store,
- bouton « Se connecter avec Epic » réclamé par les joueurs,
- crossplay avec un futur client natif (non-web).

Dans ce cas : EOS pour l'identité uniquement, Supabase reste la source de vérité
de l'ELO.

---

## Idées non planifiées

Réservoir. Rien ici n'est engagé.

- Mode spectateur (le `ReplaySystem` en fournit déjà la moitié)
- Partage de replays de match
- Bots d'entraînement (débloqués gratuitement par le refactor 0.1)
- Nouvelles armes, nouvelles maps
- Mode 2v2
- Éditeur de maps

# Journal des décisions (ADR)

Chaque décision technique structurante — **y compris celles qu'on écarte** — est
consignée ici. Format court : contexte, décision, conséquences.

Une option écartée sans trace écrite revient hanter le projet trois sessions plus
tard. C'est déjà arrivé (voir ADR-003).

---

## ADR-001 — Pas de build step côté client

**Date** : 2026-07 (rétroactif, décision d'origine)
**Statut** : accepté

**Contexte.** Le jeu est du JS vanilla chargé par `<script>`, sans bundler ni
dépendance. `index.html` s'ouvre par double-clic.

**Décision.** On garde ça. Pas de webpack, pas de Vite, pas de TypeScript côté
client, pas de framework UI.

**Conséquences.**
- Itération immédiate : sauvegarder, rafraîchir.
- Le découpage en modules de la Phase 0 utilisera les **modules ES natifs**
  (`<script type="module">`), qui ne demandent aucun build.
- Le serveur de jeu (Phase 1) est une exception assumée : c'est du Node, il vit
  dans `server/`, il a son propre `package.json`, il n'affecte pas le client.

---

## ADR-002 — Serveur autoritatif WebSocket, pas de P2P

**Date** : 2026-08-15
**Statut** : accepté

**Contexte.** Pour du 1v1 en ligne, trois options : P2P WebRTC DataChannel,
serveur relais bête, ou serveur autoritatif.

**Décision.** **Serveur autoritatif en WebSocket.** Le serveur fait tourner la
simulation officielle ; les clients envoient des inputs et reçoivent des snapshots.

**Pourquoi.**
- L'ELO (ADR-004) exige un résultat de match vérifiable. En P2P, le résultat est
  déclaré par un client : c'est intrichable à sécuriser. **Ce seul point élimine le P2P.**
- WebRTC demande un serveur de signaling **plus** un TURN pour les NAT
  symétriques — soit de l'infra de toute façon, pour plus de complexité.
- Candela est un duel 1v1 relativement posé, pas un twitch shooter à 16 joueurs.
  Le surcoût TCP de WebSocket est acceptable, la prédiction client compense.
- WebSocket marche partout, se debugge trivialement, et se déploie en une commande.

**Conséquences.**
- Il faut héberger et payer un serveur (Phase 4.3). Assumé.
- La simulation doit tourner sous Node, donc sans DOM → c'est tout l'objet de la Phase 0.
- Si la latence TCP devient réellement gênante en conditions réelles, WebRTC
  DataChannel en mode *unreliable* reste une migration possible : seule la couche
  transport changerait, le protocole et la simulation resteraient identiques.

---

## ADR-003 — Epic Online Services mis en pause

**Date** : 2026-08-15
**Statut** : écarté pour l'instant (réversible)

**Contexte.** Une session précédente avait envisagé EOS comme couche réseau. Cette
intention n'a jamais été écrite ni codée — aucune trace dans le dépôt, seulement
un souvenir de conversation.

**Décision.** EOS ne sera **pas** utilisé pour le réseau. Il n'est pas non plus
retenu pour l'identité ou les lobbies dans un premier temps.

**Pourquoi.**
- **Le blocage technique** : EOS ne fournit pas de transport P2P au navigateur. Le
  SDK P2P cible C/C++/C#/Unreal/Unity, et de toute manière une page web ne peut pas
  ouvrir de socket UDP brut. Aucun SDK ne peut contourner ça.
- Ce qui reste utilisable en web est la Web API REST (identité, lobbies,
  leaderboards) — exactement le périmètre que Supabase couvre déjà (ADR-004).
- Faire cohabiter EOS et Supabase donnerait **deux systèmes d'identité et deux
  sources de vérité** pour le même joueur. Complexité pure.

**Conséquences.**
- Le transport est traité par ADR-002, le backend par ADR-004.
- À rouvrir si : distribution Epic Games Store, demande de « connexion avec Epic »,
  ou crossplay avec un client natif. Dans ce cas EOS servirait **uniquement**
  d'identité fédérée, Supabase restant la source de vérité de l'ELO.

---

## ADR-004 — Supabase comme backend unique, ELO calculé côté serveur

**Date** : 2026-08-15
**Statut** : accepté

**Contexte.** Il faut des comptes, un historique de matchs et un classement ELO
persistant.

**Décision.** **Supabase** (Postgres + Auth + RLS + Edge Functions) est l'unique
backend de persistance. L'ELO est calculé **exclusivement côté serveur**.

**La règle non négociable.** Le client web ne calcule ni ne soumet jamais un score.
Le chemin d'écriture est le suivant, et il n'y en a pas d'autre :

```
fin de match
  → le serveur de jeu autoritatif (ADR-002) constate le résultat
  → il appelle une fonction Postgres / Edge Function avec la clé service_role
  → la fonction calcule et écrit le nouvel ELO dans une transaction
```

**Conséquences.**
- **RLS** : lecture publique sur `profiles` et `ratings` (classement) ; **aucune**
  policy d'écriture client sur `matches`, `match_players` et `ratings`.
- La clé `service_role` ne quitte **jamais** le serveur de jeu. Elle n'apparaît
  dans aucun fichier client, ni dans aucun commit.
- Le client n'utilise que la clé `anon`, en lecture.
- Cela confirme rétroactivement ADR-002 : sans serveur autoritatif, il n'y a
  personne d'honnête pour appeler cette fonction.

---

## ADR-005 — Refactor avant réseau, pas l'inverse

**Date** : 2026-08-15
**Statut** : accepté

**Contexte.** `game.js` fait 3865 lignes, dont ~2200 pour la seule classe
`CandelaGame`, qui mélange lecture d'inputs, simulation, DOM, audio et rendu canvas.
La tentation est d'ajouter le réseau par-dessus l'existant.

**Décision.** La **Phase 0** (refactor netcode-ready) est un prérequis strict de
toute écriture de code réseau.

**Pourquoi.** Un serveur autoritatif doit exécuter la simulation sous Node, donc
sans `document` ni `canvas`. Aujourd'hui c'est impossible : la simulation va
elle-même chercher ses inputs dans les périphériques locaux, le pas de temps est
variable donc non reproductible, et l'état du monde n'est pas sérialisable.
Câbler du réseau sur cette base signifie tout réécrire ensuite.

**Conséquences.**
- Une phase de travail sans **aucune** fonctionnalité visible pour le joueur. Le
  critère de succès est que le jeu reste strictement identique à jouer.
- Le refactor 0.1 (inputs passés en paramètre) débloque gratuitement les bots
  d'entraînement et un système de replay plus robuste.
- Le test de déterminisme (0.6) devient le filet de sécurité de toute la Phase 1 :
  sans lui, les désynchronisations réseau sont indébuggables.

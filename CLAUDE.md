# CLAUDE.md — Candela

> Fichier lu automatiquement au démarrage de chaque session Claude Code.
> Il doit rester **court**. Le détail vit dans `docs/`.

## Le projet en trois lignes

Candela est un jeu de duel tactique 1v1 en 2D, jouable dans le navigateur (canvas,
JavaScript vanilla, aucun build, aucune dépendance). Le cœur du gameplay est la
**lumière** : chaque joueur porte une lampe torche, ne voit que ce qu'elle éclaire,
et peut éblouir l'adversaire. Split-screen, deux joueurs sur la même machine.

## État actuel (au 2026-08-15)

- **Multijoueur LOCAL uniquement** (couch, 2 manettes / clavier). Terminé et poli.
- **Multijoueur EN LIGNE : pas commencé.** Zéro ligne de code réseau dans le repo.
- **ELO / compétitif : pas commencé.** Aucune intégration Supabase.

La prochaine étape est la **Phase 0** de `docs/ROADMAP.md` (refactor "netcode-ready"),
pas l'écriture de code réseau.

## Où lire quoi

| Question | Fichier |
|---|---|
| Qu'est-ce qui est fait, qu'est-ce qui suit ? | `docs/ROADMAP.md` |
| Comment le code est-il organisé ? | `docs/ARCHITECTURE.md` |
| Pourquoi ce choix technique et pas l'autre ? | `docs/DECISIONS.md` |

## Contraintes techniques à ne pas violer

1. **Pas de build step, pas de bundler, pas de `npm install` côté client.** Le jeu
   s'ouvre en double-cliquant `index.html`. Tout code client est du JS natif chargé
   par `<script>`. (Un futur serveur Node est une exception assumée, il vit dans
   `server/` et n'affecte pas le client.)
2. **Pas de framework UI.** L'interface est du DOM + CSS écrits à la main.
3. **L'ELO ne se calcule jamais côté client.** Voir ADR-004.
4. **`main` reste toujours jouable.** Tout travail en cours vit sur une branche.

## Conventions

- **Langue** : commits, docs, commentaires et UI en **français**. Identifiants de
  code en anglais (`shootGun`, `matchStats`).
- **Commits** : une phrase descriptive à l'impératif ou au substantif, en français,
  qui dit *ce que ça change pour le joueur* — pas `fix bug` mais
  `Correction du HUD J2 masqué en Overtime`.
- **Tests manuels** : les harnais de test vivent dans `scratch/` (fichiers HTML
  autonomes ouverts à la main). Il n'y a pas de suite de tests automatisée.

## Rituel de fin de session — IMPORTANT

Avant de terminer une session qui a produit du travail, **mettre à jour la
documentation**, sinon le contexte est perdu :

1. `docs/ROADMAP.md` — cocher ce qui est fait, ajuster « Prochaine action ».
2. `docs/DECISIONS.md` — ajouter un ADR si un choix technique structurant a été
   arrêté (ou écarté).
3. `docs/ARCHITECTURE.md` — si un fichier ou une classe a été ajouté/déplacé.
4. Commiter ces mises à jour **avec** le code, dans le même commit ou juste après.

Une décision prise en conversation et non écrite dans `docs/` est une décision
perdue. C'est déjà arrivé une fois : un plan Epic Games + Supabase discuté en
session n'a laissé aucune trace dans le dépôt.

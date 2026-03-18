# PROJECT_CONTEXT

## Projet
- Nom : Loot Tables for Owlbear
- Type : Extension Owlbear Rodeo (frontend web + manifest Owlbear + déploiement GitLab Pages)
- Objectif : Permettre au MJ de créer, modifier, importer, exporter et lancer des tables de loot, puis de valider un tirage pour partager les gains à tous les participants d’une room Owlbear.

## Stack
- Front : React + TypeScript + Vite
- Back : Aucun back dédié
- BDD : Aucune BDD serveur ; stockage principal local navigateur pour les tables
- Outils / infra :
  - Git + GitLab
  - GitLab Pages pour l’hébergement public
  - Owlbear Rodeo Extension SDK (`@owlbear-rodeo/sdk`)
  - Manifest Owlbear servi publiquement

## Décisions validées
- Les tables de loot restent stockées localement dans le navigateur, pas dans les metadata de room Owlbear.
- Il faut documenter clairement qu’il faut faire des sauvegardes/export JSON réguliers.
- Les résultats validés, eux, sont partagés via Owlbear (room metadata + broadcast + notification + modale Owlbear).
- Le MJ a l’interface complète de gestion ; les joueurs ont une interface de consultation/réception.
- Toujours travailler par patches incrémentaux, sans refonte inutile.
- Toujours fournir les fichiers complets patchés quand on modifie du code.

## État actuel
- Ce qui fonctionne :
  - Extension Owlbear installable via manifest public GitLab Pages
  - Création / édition / suppression / duplication de tables
  - Gestion d’objets avec nom, lien, niveau, catégorie, rareté, valeur
  - Import/export JSON
  - Import/export CSV par table
  - Import CSV dans une table existante avec choix ajouter/remplacer
  - Collage multiple depuis Excel
  - Détection de doublons simples à l’import
  - Recherche / tri des tables
  - Tri des objets dans une table
  - Tables repliables/dépliables
  - Tirage configurable
  - Tirage rapide avec mémorisation des derniers paramètres
  - Mémorisation locale de plusieurs états d’interface
  - Intégration Owlbear SDK minimale fonctionnelle
  - Différenciation MJ / joueurs
  - Validation d’un tirage par le MJ
  - Notification Owlbear à tous lors d’un tirage validé
  - Vraie modale Owlbear de gain chez tous les clients
- Ce qui est en cours :
  - Finition de l’ergonomie visuelle du popover principal (largeur, scroll global, fond, conteneur principal)
- Ce qui bloque :
  - Le popover Owlbear semble plafonné en largeur côté plateforme, ou au moins ne s’élargit pas visiblement au-delà d’une certaine taille.
  - Le comportement du scroll horizontal / vertical et du fond principal a nécessité plusieurs ajustements et reste le dernier point d’UI à fiabiliser.

## Architecture du projet
- `public/manifest.json`
  - Déclare l’extension Owlbear
  - Pointe vers `/` comme popover principal
  - Pointe vers `/icon.svg`
- `public/icon.svg`
  - Icône de l’extension
- `src/main.tsx`
  - Point d’entrée
  - Détecte `?view=gain-modal` pour rendre une vue dédiée à la modale Owlbear des gains
  - Sinon rend l’application principale
- `src/App.tsx`
  - UI principale de l’extension
  - Gère tables, imports, exports, tirages, validation, rôle MJ/joueur, footer secondaire, état Owlbear
- `src/owlbear.ts`
  - Couche utilitaire Owlbear SDK
  - `waitForOwlbearReady`
  - configuration du popover principal
  - lecture rôle / room / player name
  - room metadata
  - notifications
  - broadcast des tirages validés
  - ouverture/fermeture de la modale Owlbear de gain
- `src/components/TableList.tsx`
  - Affichage des tables
  - Actions MJ seulement
  - Affichage des objets en consultation
- `src/components/TableEditor.tsx`
  - Édition d’une table
  - Lignes d’objets validables individuellement
  - Import CSV dans table
  - Collage multiple Excel
- `src/components/RollDialog.tsx`
  - Paramétrage d’un tirage
- `src/components/ResultDialog.tsx`
  - Résultat du tirage pour le MJ
  - Validation du tirage
  - Historique local récent
- `src/components/SharedGainPage.tsx`
  - Vue dédiée affichée dans la vraie modale Owlbear
  - Lit `lastValidatedRoll` dans les metadata de room
  - Affichage différent MJ / joueur
- `src/utils/storage.ts`
  - Stockage local tables + état UI
  - Import/export JSON/CSV
- `src/utils/loot.ts`
  - Logique de tirage, probabilités, catégories disponibles

## Bug(s) ou problème(s) connu(s)
- Le popover principal Owlbear ne semble pas s’agrandir visuellement malgré une augmentation de `action.width` / `OBR.action.setWidth`.
- Le scroll horizontal a d’abord été mis sur un conteneur interne ; il a fallu le déplacer au niveau du popover global.
- Le scroll vertical a parfois été dupliqué (scroll interne + scroll popover).
- Le fond principal noir n’était pas toujours étendu à toute la largeur scrollable.
- Le dernier chantier ouvert concerne précisément : largeur / scroll / fond du popover principal.

## Fonctionnalités
### Déjà faites
- [x] Déploiement GitLab Pages public
- [x] Manifest Owlbear fonctionnel
- [x] Icône d’extension
- [x] Création / édition / suppression de tables
- [x] Duplication de table
- [x] Lignes d’objets modifiables individuellement
- [x] Catégories prédéfinies
- [x] Raretés prédéfinies
- [x] Valeur avec montant + devise
- [x] Tri des tables
- [x] Recherche de table
- [x] Tri des objets dans une table ouverte
- [x] Tables repliables/dépliables
- [x] Import/export JSON global
- [x] Export JSON par table
- [x] Export CSV par table
- [x] Import CSV en nouvelle table
- [x] Import CSV dans une table existante
- [x] Choix ajouter/remplacer lors d’un import CSV dans une table
- [x] Détection de doublons simples à l’import
- [x] Collage multiple depuis Excel
- [x] Correction d’encodage UTF-8 CSV
- [x] Mémorisation locale de l’UI
- [x] Tirage configuré
- [x] Tirage rapide
- [x] Historique local récent des tirages
- [x] Intégration Owlbear SDK minimale
- [x] Room metadata pour quelques états légers
- [x] Broadcast d’un tirage validé
- [x] Notification Owlbear à tous
- [x] Modale Owlbear dédiée pour les gains
- [x] Différenciation MJ / joueurs
- [x] Côté joueur : pas d’actions de gestion
- [x] Côté joueur : la modale de gain ne montre pas la valeur des objets
- [x] Nom d’objet cliquable dans la modale de gain si URL présente

### En cours
- [ ] Finaliser le comportement de largeur du popover principal Owlbear
- [ ] Finaliser le comportement du scroll global (horizontal/vertical) et du fond sur toute la largeur utile

### À faire ensuite
- [ ] Continuer le polish visuel de la vue principale
- [ ] Éventuellement historique partagé des gains validés
- [ ] Éventuellement améliorer encore la UI pour le format popover Owlbear
- [ ] Éventuellement stockage lié à la scène plus tard
- [ ] Éventuellement synchronisation plus riche MJ / joueurs
- [ ] Plus tard : notes
- [ ] Plus tard : tags supplémentaires

## Décisions techniques déjà validées
Noter ici les choix qu’il ne faut pas re-discuter à chaque nouveau chat.

- Ne pas stocker les tables complètes dans les metadata de room Owlbear.
- Garder les tables en stockage local navigateur.
- Utiliser Owlbear seulement pour les états partagés légers et les tirages validés.
- Toujours garder les exports JSON/CSV comme sécurité utilisateur.
- Le flux validé est : tirage MJ → validation → room metadata + broadcast → notification + modale Owlbear chez tous.
- Différenciation de rôle obligatoire :
  - MJ : gestion complète + tirages + validation
  - Joueur : consultation uniquement + réception du butin
- Les modales de gain détaillées doivent être des vraies modales Owlbear, pas seulement des modales React internes au popover.
- Les correctifs doivent être localisés et incrémentaux.

## État actuel précis
Décrire où on en est exactement au moment de reprendre.

L’extension est globalement fonctionnelle et jouable.
Le déploiement GitLab Pages est réglé et le manifest Owlbear fonctionne.
Les fonctionnalités cœur (tables, imports, tirages, validation, partage) sont en place.
Le dernier sujet non entièrement stabilisé est l’ergonomie de la vue principale dans le popover Owlbear :
- contenu large
- largeur du popover qui semble plafonner
- gestion du scroll horizontal au niveau global
- suppression des doubles scrolls verticaux
- extension du fond principal à toute la largeur scrollable

Le footer secondaire a déjà été déplacé en bas et compacté.
Le bug actuellement traité au moment de la coupure concernait encore l’interface principale et non la logique métier.

## Journal de session
### Session du 2026-03-16
- sujets traités :
  - Mise en place de l’extension Owlbear Loot Tables
  - Déploiement GitLab Pages
  - Correction des pipelines GitLab
  - Création/édition/import/export/tirage des tables
  - Tirage rapide
  - Amélioration des imports CSV/Excel
  - Intégration SDK Owlbear
  - Validation du tirage et partage à tous
  - Différenciation MJ / joueurs
  - Mise en place d’une vraie modale Owlbear de gain
  - Début de polish UI du popover principal
- fichiers modifiés :
  - `.gitlab-ci.yml`
  - `public/manifest.json`
  - `public/icon.svg`
  - `README.md`
  - `src/main.tsx`
  - `src/App.tsx`
  - `src/types.ts`
  - `src/owlbear.ts`
  - `src/utils/storage.ts`
  - `src/utils/loot.ts`
  - `src/components/TableList.tsx`
  - `src/components/TableEditor.tsx`
  - `src/components/RollDialog.tsx`
  - `src/components/ResultDialog.tsx`
  - `src/components/ConfirmModal.tsx`
  - `src/components/SharedGainPage.tsx`
  - `src/components/GainModal.tsx` (existe/servait pendant une phase intermédiaire ; la vraie modale finale passe par `SharedGainPage`)
- décisions prises :
  - stockage local conservé pour les tables
  - sauvegarde recommandée via README
  - vraie modale Owlbear pour les gains
  - rôles MJ/joueur distincts
  - bouton de validation de tirage conservé côté MJ
- problèmes restants :
  - largeur réelle du popover principal
  - scroll horizontal/vertical global
  - fond noir principal à ajuster selon la largeur réelle
- prochaine action utile :
  - reprendre le travail sur `src/App.tsx` et éventuellement `src/styles/ui.ts` pour stabiliser définitivement le conteneur principal du popover

## Règles à respecter
- Toujours donner le fichier complet patcher.
- Ne pas repartir de zéro ni proposer une refonte totale sans raison.
- Conserver les décisions validées ci-dessus.
- Prioriser les correctifs ciblés et concrets.
- Vérifier que les changements ne cassent pas la logique Owlbear déjà fonctionnelle.
- Ne pas remettre en question le choix de stockage local des tables.
- Penser à la compatibilité MJ / joueurs à chaque changement d’UI.

## Prompt de reprise recommandé
À coller au début d’un nouveau chat :

Contexte : lis le PROJECT_CONTEXT.md ci-dessous comme source principale de vérité.
Je veux reprendre le projet sans repartir de zéro.
Considère que les décisions techniques déjà notées sont validées.
Aide-moi de façon concrète et incrémentale, en évitant les refontes inutiles.
Le dernier sujet ouvert est la stabilisation de l’interface principale du popover Owlbear (largeur réelle, scroll global, fond principal), sans casser les fonctionnalités déjà en place.

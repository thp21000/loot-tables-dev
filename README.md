# Loot Tables for Owlbear
<img alt="Legacy Code: O S+ I+ C E M V+ D+ !A" src="https://img.shields.io/badge/Legacy%20Code-O%20S%2B%20I%2B%20C%20E%20M%20V%2B%20D%2B%20!A-informational">

Une extension Owlbear Rodeo pour créer, modifier, importer, exporter et lancer des tables de loot.

## Fonctionnalités

- Création et modification de tables de loot
- Gestion d'objets avec :
  - nom
  - lien de fiche
  - niveau
  - catégorie
  - rareté
  - valeur
- Tri et recherche des tables
- Affichage repliable des objets
- Import / export JSON
- Import / export CSV
- Import CSV dans une table existante
- Collage multiple depuis Excel
- Détection simple de doublons à l'import
- Tirage configuré avec :
  - niveau maximum
  - quantité
  - catégories
  - doublons autorisés ou non
  - mode de probabilité
- Tirage rapide avec les derniers paramètres mémorisés
- Mémorisation locale de plusieurs états d'interface

## Installation dans Owlbear Rodeo

Ajouter cette URL comme extension :

`https://loot-tables-af787d.gitlab.io/manifest.json`

## Sauvegarde recommandée

Les tables de loot sont actuellement stockées localement dans le navigateur.  
Il est fortement recommandé de faire des exports JSON réguliers pour éviter toute perte de données.

## Utilisation

### Créer une table

- Cliquer sur **Créer une nouvelle table**
- Donner un nom à la table
- Ajouter les objets ligne par ligne
- Enregistrer la table

### Importer des objets

Deux possibilités :

- importer un CSV comme nouvelle table
- importer un CSV dans une table existante

Lors d'un import dans une table existante, il est possible de :
- ajouter les objets à la table
- remplacer les objets existants

Les doublons simples sont ignorés à l'import.

### Tirer du loot

Deux options :

- bouton vert **▶** : ouvre la fenêtre complète de configuration
- bouton jaune **⚡** : tirage rapide avec les derniers paramètres utilisés

### Format CSV attendu

Colonnes attendues :

- `name`
- `url`
- `level`
- `category`
- `rarity`
- `valueAmount`
- `valueCurrency`

Exemple :

```csv
name;url;level;category;rarity;valueAmount;valueCurrency
Epée courte;https://example.com;1;Arme;Courant;9;pa
Potion de soins;https://example.com;1;Consommable;Courant;4;po
```

Catégories disponibles

- `Arme`
- `Armure`
- `Consommable`
- `Contenant`
- `Equipement`
- `Trésor`
- `Autre`

Raretés disponibles

- `Courant`
- `Peu courant`
- `Rare`
- `Unique`

## Limites actuelles

les données sont principalement stockées localement dans le navigateur
si les données du site sont supprimées par le navigateur, certains états locaux peuvent être perdus
le partage temps réel MJ / joueurs n'est pas encore implémenté
le stockage lié à la room ou à la scène n'est pas encore activé

## Feuille de route

- intégration plus poussée au SDK Owlbear
- stockage lié à la room
- stockage lié à la scène
- synchronisation MJ / joueurs
- interface mieux optimisée pour le format popover
- notes sur les objets
- tags supplémentaires

## Développement
```npm install
npm run build
```

## Déploiement

Le projet est publié via GitLab Pages.
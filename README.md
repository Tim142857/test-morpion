# Morpion

Application web statique pour le jeu de morpion, construite avec React, TypeScript et Vite.

## Prérequis

- [Node.js](https://nodejs.org/) `^20.19.0` ou `>=22.12.0` (compatible avec Vite 7)
- npm (fourni avec Node.js)

## Commandes npm

| Commande | Description |
| --- | --- |
| `npm install` | Installe les dépendances du projet |
| `npm run dev` | Démarre le serveur de développement Vite en local |
| `npm run build` | Compile TypeScript puis produit une version statique de production dans `dist/` |
| `npm run typecheck` | Vérifie la compilation TypeScript sans produire de fichiers |
| `npm run lint` | Exécute ESLint sur le code source |
| `npm run preview` | Prévisualise localement le contenu du répertoire `dist/` |

## Développement local

```bash
npm install
npm run dev
```

Ouvrez l’URL affichée dans le terminal (par défaut `http://localhost:5173`).

## Build de production

```bash
npm run build
```

Les artefacts statiques sont générés dans le répertoire `dist/`.

## Architecture

Cette application est une SPA entièrement statique : elle ne nécessite ni API, ni serveur applicatif, ni base de données après compilation.

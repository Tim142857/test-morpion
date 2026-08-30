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

Ouvrez l’application sous le chemin de base GitHub Pages :
`http://localhost:5173/test-morpion/` par défaut.

## Build de production

```bash
npm run build
```

Les artefacts statiques sont générés dans le répertoire `dist/`.

Pour valider localement ces artefacts avec le même chemin de base que sur
GitHub Pages :

```bash
npm run preview
```

Ouvrez ensuite `http://localhost:4173/test-morpion/` par défaut.

## GitHub Pages

Vite utilise le chemin de base `/test-morpion/`. L’application publiée est
disponible à l’adresse <https://tim142857.github.io/test-morpion/>.

Chaque fusion sur `main` déclenche le workflow GitHub Actions `.github/workflows/quality.yml` :
lint et vérification TypeScript. Si ces contrôles réussissent, le workflow
`.github/workflows/deploy.yml` publie automatiquement le contenu de `dist/` sur
GitHub Pages.

Avant fusion, validez localement les mêmes étapes que la CI :

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run preview
```

## Architecture

Cette application est une SPA entièrement statique : elle ne nécessite ni API, ni serveur applicatif, ni base de données après compilation.

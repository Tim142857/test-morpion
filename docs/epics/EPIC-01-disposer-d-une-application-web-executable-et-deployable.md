# EPIC-01 - Disposer d'une application web exécutable et déployable

Status: Planned

DependsOn: None

## Objectif

Fournir une fondation React et TypeScript fiable, entièrement statique, adaptée au développement, à la validation automatisée et au déploiement sur GitHub Pages.

## User Stories

### US-01.01 - Initialiser la SPA React

<!-- ai-orchestrator:completion:US-01.01 -->
Status: DONE
Pull Request: #1
Developer: cursor
Reviewer: codex
<!-- /ai-orchestrator:completion:US-01.01 -->
En tant que développeur, je veux disposer d'une application React avec TypeScript, Vite et npm, afin de développer le jeu sur une base homogène.

DependsOn: None

Acceptance Criteria:
- Le projet utilise React, TypeScript, Vite et npm.
- Une commande npm documentée démarre l'application en environnement local.
- Une commande npm documentée produit une version statique de production dans un répertoire de build identifiable.
- La compilation TypeScript s'achève sans erreur.
- L'application ne nécessite ni API, ni serveur applicatif, ni base de données.

### US-01.02 - Garantir le fonctionnement sur GitHub Pages

En tant que visiteur, je veux pouvoir ouvrir et recharger l'application déployée, afin d'y accéder sans erreur de chemin.

DependsOn: US-01.01

Acceptance Criteria:
- Le chemin de base GitHub Pages est configuré dans Vite et appliqué aux ressources de production.
- L'ouverture directe de l'URL publiée affiche l'application.
- Le rechargement de la page ne provoque pas d'erreur 404.
- Aucun service distant n'est requis pour lancer une partie après le chargement initial.

### US-01.03 - Contrôler automatiquement la qualité de base

En tant qu'équipe produit, je veux exécuter les contrôles essentiels à chaque contribution, afin de détecter les régressions structurelles avant fusion.

DependsOn: US-01.01

Acceptance Criteria:
- Un workflow GitHub Actions exécute le lint et la vérification TypeScript sur chaque pull request et sur main.
- Un échec du lint ou de la vérification TypeScript fait échouer le workflow.
- Les mêmes contrôles peuvent être lancés localement avec des commandes npm documentées dans le dépôt.
- Le workflow n'exige pas encore de tests applicatifs non implémentés.

### US-01.04 - Publier automatiquement sur GitHub Pages

En tant que responsable produit, je veux déployer la version validée après chaque fusion sur main, afin de maintenir une version publique à jour.

DependsOn: US-01.02, US-01.03

Acceptance Criteria:
- Une fusion sur la branche main déclenche un workflow GitHub Actions de déploiement.
- Le déploiement n'a lieu que si les contrôles de base du workflow réussissent.
- Le workflow publie les fichiers statiques de production sur GitHub Pages.
- L'URL publiée reste accessible après déploiement.
- Les contributions peuvent être validées localement avant fusion.

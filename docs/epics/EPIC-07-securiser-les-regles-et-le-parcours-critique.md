# EPIC-07 - Sécuriser les règles et le parcours critique

Status: Planned

DependsOn: EPIC-03, EPIC-04, EPIC-05

## Objectif

Prévenir les régressions grâce à des tests unitaires, des tests de composants et un parcours de bout en bout couvrant le fonctionnement essentiel.

## User Stories

### US-07.01 - Tester les règles du jeu

En tant que développeur, je veux des tests unitaires des règles, afin de garantir des résultats déterministes lors des évolutions.

DependsOn: US-03.01

Acceptance Criteria:
- Vitest couvre la révélation de toutes les occurrences d'une lettre.
- Les tests couvrent l'absence de pénalité pour une lettre déjà proposée.
- Les tests couvrent l'insensibilité à la casse et aux accents.
- Les tests couvrent la visibilité initiale des espaces, apostrophes et traits d'union.
- Les tests couvrent la victoire et la défaite exactement à la huitième erreur.
- Un échec de ces tests fait échouer la commande npm de test documentée.

### US-07.02 - Tester les composants interactifs

En tant que développeur, je veux tester les interactions visibles, afin de vérifier que l'interface reflète correctement l'état du jeu.

DependsOn: US-03.03, US-05.01

Acceptance Criteria:
- Testing Library vérifie la sélection de difficulté et le démarrage d'une partie.
- Les tests vérifient la désactivation des lettres déjà proposées.
- Les tests vérifient la mise à jour du compteur d'erreurs.
- Les tests vérifient les messages de victoire et de défaite ainsi que la révélation du mot.
- Les tests vérifient la présence des noms accessibles sur l'alphabet et les commandes principales.

### US-07.03 - Tester les profils et statistiques locaux

En tant que développeur, je veux tester la persistance locale, afin de fiabiliser la progression et le classement sans serveur.

DependsOn: US-04.04, US-04.06, US-04.07, US-04.08

Acceptance Criteria:
- Les tests vérifient la création et la sélection de profils locaux.
- Les tests vérifient l'enregistrement d'une victoire et d'une défaite terminées.
- Les tests vérifient le calcul du score selon la règle affichée.
- Les tests vérifient le tri du classement, y compris les égalités.
- Les tests vérifient la suppression isolée d'un profil et de ses statistiques.
- Les tests vérifient que le mode invité fonctionne lorsque localStorage est indisponible ou invalide.

### US-07.04 - Automatiser le parcours critique

En tant qu'équipe produit, je veux valider les parcours essentiels dans un navigateur réel, afin de détecter les ruptures d'intégration.

DependsOn: US-05.05, US-07.01, US-07.02, US-07.03

Acceptance Criteria:
- Playwright lance l'application construite dans un navigateur pris en charge.
- Un scénario invité sélectionne une difficulté, joue une partie jusqu'à un résultat déterministe et active « Nouvelle partie ».
- Le scénario invité vérifie le retour à la sélection de difficulté.
- Un scénario profil crée un profil local, termine une partie et vérifie la mise à jour des statistiques et du classement.
- Les scénarios sont exécutables localement avec une commande npm documentée.

### US-07.05 - Intégrer tous les tests à l'intégration continue

En tant qu'équipe produit, je veux que l'intégration continue exécute l'ensemble des contrôles avant fusion, afin d'empêcher les régressions fonctionnelles.

DependsOn: US-01.03, US-07.04

Acceptance Criteria:
- Le workflow GitHub Actions exécute les tests unitaires Vitest en plus du lint et de la vérification TypeScript.
- Le workflow exécute les scénarios Playwright critiques.
- Un échec de l'un des contrôles fait échouer le workflow.
- Le workflow de déploiement sur main n'a lieu que si tous ces contrôles réussissent.
- Les mêmes contrôles peuvent être lancés localement avec des commandes npm documentées.

# EPIC-06 - Garantir une utilisation sans collecte distante

Status: Planned

DependsOn: EPIC-04

## Objectif

Préserver la vie privée avec un produit sans publicité, traceur, cookie non essentiel ni transmission de données personnelles.

## User Stories

### US-06.01 - Limiter les données au navigateur

En tant qu'utilisateur, je veux que mes préférences, profils et statistiques restent sur mon appareil, afin de jouer sans transmettre de données.

DependsOn: US-04.04, US-04.05

Acceptance Criteria:
- Les profils et statistiques sont stockés uniquement dans localStorage.
- L'application n'effectue aucun appel réseau fonctionnel après le chargement de ses ressources statiques.
- Aucune donnée de jeu ou de profil n'est transmise à un tiers.
- Aucun cookie non essentiel n'est créé.
- Aucun mécanisme publicitaire, analytique ou de traçage n'est intégré.

### US-06.02 - Informer sur le stockage local

En tant qu'utilisateur, je veux comprendre quelles données sont conservées, afin de décider librement d'utiliser un profil local.

DependsOn: US-06.01

Acceptance Criteria:
- Une page ou section accessible décrit les catégories de données conservées localement.
- L'information précise qu'aucune donnée n'est transmise et qu'aucune synchronisation distante n'existe.
- L'information explique comment supprimer un profil et ses statistiques.
- Aucun bandeau de consentement aux cookies n'est affiché en l'absence de cookie non essentiel.

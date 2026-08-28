# EPIC-04 - Conserver une progression locale facultative

Status: Planned

DependsOn: EPIC-03

## Objectif

Permettre l'utilisation de profils locaux pseudonymes pour suivre une progression et un classement local, tout en conservant un accès invité et sans transmettre de données personnelles.

## User Stories

### US-04.01 - Jouer sans compte

En tant que visiteur, je veux commencer à jouer sans créer de compte, afin d'accéder immédiatement au jeu.

DependsOn: US-03.02

Acceptance Criteria:
- Le jeu reste entièrement accessible en mode invité dès l'ouverture de l'application.
- Aucune inscription, adresse électronique ou donnée personnelle n'est requise pour jouer.
- Le joueur peut créer ou sélectionner un profil local sans que cela bloque le jeu.
- Les parties jouées en mode invité ne sont pas ajoutées au classement des profils.

### US-04.02 - Créer un profil local

En tant que joueur régulier, je veux créer un profil pseudonyme sur mon appareil, afin de conserver ma progression entre les sessions.

DependsOn: US-04.01

Acceptance Criteria:
- Le joueur peut créer un profil avec un pseudonyme non vide après suppression des espaces en début et fin.
- Deux profils du même navigateur ne peuvent pas utiliser le même pseudonyme après normalisation de la casse et des accents.
- Le profil est enregistré uniquement dans localStorage.
- Aucun mot de passe, courriel ou autre donnée personnelle n'est demandé.
- L'interface précise que le profil n'est ni synchronisé ni récupérable sur un autre appareil.

### US-04.03 - Sélectionner un profil local

En tant que joueur, je veux sélectionner mon profil enregistré, afin d'attribuer mes nouvelles parties à ma progression.

DependsOn: US-04.02

Acceptance Criteria:
- Les profils présents dans localStorage peuvent être sélectionnés depuis l'interface.
- Le profil actif est clairement indiqué.
- Le changement de profil n'altère pas les statistiques des autres profils.
- Le joueur peut revenir au mode invité sans supprimer les profils existants.
- Le profil actif est mémorisé entre les sessions du même navigateur.

### US-04.04 - Tolérer un stockage local indisponible

En tant que visiteur, je veux pouvoir jouer même si le stockage local est indisponible ou corrompu, afin que la fonction principale reste accessible.

DependsOn: US-04.02

Acceptance Criteria:
- Une donnée locale invalide ou illisible ne provoque pas de blocage de l'application.
- En cas de localStorage indisponible, le mode invité reste jouable.
- L'utilisateur est informé que les profils et statistiques ne pourront pas être conservés.
- Aucune donnée n'est envoyée vers un service distant comme solution de remplacement.

### US-04.05 - Enregistrer la progression

En tant que joueur identifié par un profil local, je veux consulter mes résultats cumulés, afin de suivre ma progression.

DependsOn: US-03.04, US-03.05, US-04.03

Acceptance Criteria:
- Chaque partie terminée avec un profil actif enregistre le résultat, la difficulté et le nombre d'erreurs.
- La progression affiche au minimum le nombre de parties terminées, de victoires et de défaites.
- Les statistiques distinguent les trois niveaux de difficulté.
- Les statistiques persistent après fermeture et réouverture du navigateur.
- Une partie abandonnée par « Nouvelle partie » avant victoire ou défaite n'est pas comptabilisée.

### US-04.06 - Définir le calcul du score de classement

En tant que joueur, je veux comprendre comment mon score est calculé, afin de comparer équitablement les profils locaux.

DependsOn: US-04.05

Acceptance Criteria:
- Chaque victoire rapporte des points selon la difficulté : facile 10, moyen 20, difficile 30.
- Le score d'une victoire est réduit de 1 point par erreur commise, avec un minimum de 1 point par victoire.
- Les défaites n'ajoutent aucun point.
- Le score total d'un profil est la somme des points de ses victoires.
- La règle de calcul et les valeurs sont affichées dans l'interface du classement.

### US-04.07 - Afficher un classement local

En tant que joueur, je veux comparer les profils enregistrés sur mon navigateur, afin de situer ma progression localement.

DependsOn: US-04.06

Acceptance Criteria:
- Le classement inclut uniquement les profils locaux disposant d'au moins une partie terminée.
- Les profils sont triés par score total décroissant.
- À score égal, le profil avec le plus de victoires est classé avant les autres.
- À score et victoires égaux, les profils sont triés par pseudonyme en ordre alphabétique insensible à la casse.
- Le classement est recalculé après chaque partie terminée avec un profil actif.
- L'interface indique explicitement que le classement est limité à cet appareil et à ce navigateur.

### US-04.08 - Supprimer un profil local

En tant que joueur, je veux supprimer mon profil et ses statistiques, afin de garder le contrôle sur les données stockées dans mon navigateur.

DependsOn: US-04.07

Acceptance Criteria:
- Le joueur peut demander la suppression d'un profil local depuis l'interface de gestion des profils.
- Une confirmation explicite est requise avant la suppression.
- La suppression retire le profil, sa progression et ses entrées de classement de localStorage.
- La suppression d'un profil n'altère pas les autres profils.
- Si le profil supprimé était actif, l'application repasse en mode invité.

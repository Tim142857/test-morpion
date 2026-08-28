# EPIC-05 - Offrir une expérience accessible et responsive

Status: Planned

DependsOn: EPIC-03

## Objectif

Rendre l'intégralité du parcours compréhensible et utilisable sur mobile, tablette et ordinateur, en visant WCAG 2.2 niveau AA.

## User Stories

### US-05.01 - Présenter une interface cohérente en français

En tant que joueur francophone, je veux des instructions et messages en français clair, afin de comprendre immédiatement le fonctionnement du jeu.

DependsOn: US-03.04

Acceptance Criteria:
- Les titres, instructions, commandes, erreurs et résultats sont affichés en français.
- Les termes employés pour les difficultés sont cohérents dans toute l'application.
- Les règles essentielles, dont la limite de huit erreurs, sont consultables avant ou pendant une partie.
- Les textes associés aux profils précisent leur caractère local et facultatif.

### US-05.02 - Adapter l'interface aux écrans

En tant que joueur sur mobile ou tablette, je veux une interface adaptée à mon écran, afin de jouer confortablement sans zoom horizontal.

DependsOn: US-03.03, US-03.04

Acceptance Criteria:
- L'interface suit une conception mobile-first.
- Aucun défilement horizontal n'est nécessaire aux largeurs d'écran de 320 px à 1280 px.
- Le mot, le compteur et l'alphabet restent lisibles sur écran étroit.
- Les commandes interactives disposent d'une zone cible d'au moins 44 × 44 pixels.
- La sélection de difficulté et l'écran de résultat restent utilisables sur mobile, tablette et ordinateur.

### US-05.03 - Assurer la lisibilité visuelle

En tant que joueur malvoyant, je veux des informations visuellement distinguables, afin de comprendre le jeu sans dépendre uniquement des couleurs.

DependsOn: US-05.02

Acceptance Criteria:
- Les textes et composants respectent un rapport de contraste d'au moins 4,5:1 pour le texte normal et 3:1 pour les textes larges, conformément à WCAG 2.2 AA.
- Les états correct, incorrect, désactivé et actif ne reposent pas uniquement sur la couleur.
- Le contenu reste utilisable avec un agrandissement de texte à 200 % sans perte de fonctionnalité.
- Les libellés restent lisibles et ne sont pas tronqués dans les écrans pris en charge.

### US-05.04 - Naviguer entièrement au clavier

En tant que joueur utilisant uniquement un clavier, je veux accéder à toutes les fonctions, afin de jouer et gérer mon profil sans dispositif de pointage.

DependsOn: US-04.03, US-04.08, US-05.02

Acceptance Criteria:
- Toutes les commandes interactives du jeu et de la gestion des profils sont atteignables dans un ordre logique avec la touche Tabulation.
- Chaque commande peut être activée au clavier.
- Un indicateur de focus visible respecte un rapport de contraste d'au moins 3:1 avec son arrière-plan.
- À chaque changement d'écran majeur, le focus est placé sur un élément pertinent.
- Aucun piège au clavier n'empêche de quitter une commande ou une zone.

### US-05.05 - Annoncer l'évolution de la partie

En tant que joueur utilisant un lecteur d'écran, je veux entendre les événements importants, afin de comprendre et contrôler la partie.

DependsOn: US-03.04, US-05.04

Acceptance Criteria:
- Le mot masqué possède une représentation accessible indiquant le nombre de lettres restantes à découvrir.
- Chaque proposition annonce la lettre, son résultat et le nombre d'erreurs restantes via une région live.
- Les lettres déjà proposées et désactivées exposent leur état aux technologies d'assistance.
- La victoire, la défaite et le mot révélé sont annoncés sans nécessiter de déplacement manuel du focus.
- Les annonces ne répètent pas inutilement l'intégralité de l'interface.

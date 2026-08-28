# EPIC-03 - Permettre de jouer une partie complète

Status: Planned

DependsOn: EPIC-02

## Objectif

Offrir une boucle de jeu solo claire, conforme aux règles validées et utilisable au clavier physique comme avec l'alphabet affiché.

## User Stories

### US-03.01 - Implémenter les règles de partie

En tant que joueur, je veux que les règles du pendu soient appliquées de façon cohérente, afin d'obtenir un résultat juste et prévisible.

DependsOn: US-02.03

Acceptance Criteria:
- Chaque lettre non trouvée est représentée par un emplacement masqué.
- Les espaces, apostrophes et traits d'union sont visibles dès le début.
- Une proposition correcte révèle toutes les occurrences correspondantes avec l'orthographe d'origine.
- Les propositions en majuscule et en minuscule produisent le même résultat.
- Une lettre accentuée et sa forme non accentuée sont considérées comme équivalentes.
- La normalisation s'applique à la détection des correspondances et des lettres déjà proposées.
- Une lettre absente du mot ajoute exactement une erreur.
- Une lettre présente dans le mot ou déjà proposée n'ajoute aucune erreur.
- Le compteur d'erreurs ne peut pas dépasser huit.
- La partie est gagnée dès que toutes les lettres du mot sont révélées.
- La partie est perdue lorsque la huitième erreur est enregistrée.
- Après la fin, aucune nouvelle lettre ne modifie la partie.

### US-03.02 - Choisir la difficulté

En tant que joueur, je veux choisir une difficulté avant chaque partie, afin d'adapter le défi à mon envie.

DependsOn: US-03.01

Acceptance Criteria:
- L'écran de départ propose les niveaux facile, moyen et difficile.
- Aucune partie ne commence avant la sélection d'un niveau.
- La sélection lance une partie avec un mot du niveau correspondant.
- La difficulté active reste visible pendant la partie.

### US-03.03 - Proposer des lettres au clavier et à l'écran

En tant que joueur, je veux saisir des lettres au clavier physique ou via un alphabet cliquable, afin de jouer sur tout type d'appareil.

DependsOn: US-03.02

Acceptance Criteria:
- L'écran de jeu affiche les 26 lettres de l'alphabet latin.
- L'activation d'une lettre à l'écran évalue immédiatement la proposition.
- L'appui sur une touche alphabétique pendant une partie évalue la lettre correspondante.
- Les touches non alphabétiques sont ignorées sans modifier la partie.
- Une lettre déjà proposée est visuellement identifiable, désactivée et ne consomme pas d'erreur supplémentaire.
- La saisie au clavier et l'alphabet à l'écran partagent le même état de jeu.
- Le nombre d'erreurs commises et la limite de huit sont affichés pendant la partie.
- Les boutons de lettre disposent d'un libellé accessible indiquant leur lettre et leur état.

### US-03.04 - Afficher le résultat de partie

En tant que joueur, je veux recevoir un résultat explicite lorsque la partie se termine, afin de savoir si j'ai gagné ou perdu.

DependsOn: US-03.03

Acceptance Criteria:
- Un message distinct indique clairement la victoire ou la défaite.
- En cas de défaite, le mot complet est révélé avec son orthographe d'origine.
- Après la fin, les entrées de lettres sont désactivées.
- Le résultat reste visible jusqu'à l'action « Nouvelle partie » ou un retour explicite à l'écran de sélection.

### US-03.05 - Relancer une partie

En tant que joueur, je veux lancer une nouvelle partie à tout moment, afin de changer de mot ou de difficulté.

DependsOn: US-03.04

Acceptance Criteria:
- Un bouton « Nouvelle partie » est disponible pendant la partie et sur l'écran de résultat.
- Son activation ramène à la sélection de difficulté.
- Les lettres proposées, le compteur d'erreurs et le mot courant sont réinitialisés.
- Le lancement de la partie suivante effectue un nouveau tirage.
- Une partie interrompue par « Nouvelle partie » avant victoire ou défaite n'est pas considérée comme terminée.

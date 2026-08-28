# EPIC-02 - Proposer un corpus français maîtrisé

Status: Planned

DependsOn: EPIC-01

## Objectif

Alimenter les parties avec des mots français courants, vérifiés, librement réutilisables et répartis en trois niveaux de difficulté.

## User Stories

### US-02.01 - Constituer le corpus versionné

En tant que joueur francophone, je veux rencontrer des mots français appropriés, afin de jouer avec un vocabulaire compréhensible et sûr.

DependsOn: US-01.01

Acceptance Criteria:
- Le corpus est stocké et versionné dans le dépôt sous une structure lisible par niveau.
- Chaque entrée appartient à exactement l'un des niveaux facile, moyen ou difficile.
- Chaque niveau contient au moins 20 entrées distinctes.
- Le corpus contient uniquement des mots ou expressions françaises courantes vérifiées.
- Les noms propres, abréviations et termes offensants sont exclus.
- La source et les conditions de réutilisation du corpus sont documentées dans le dépôt.

### US-02.02 - Valider automatiquement le corpus

En tant que mainteneur, je veux détecter les entrées invalides du corpus, afin de préserver la qualité des parties.

DependsOn: US-02.01

Acceptance Criteria:
- Un test automatisé vérifie que les trois niveaux contiennent chacun au moins 20 entrées.
- Un test automatisé détecte les entrées vides et les doublons après normalisation de la casse et des accents.
- Un test automatisé refuse les caractères non autorisés hors lettres, espaces, apostrophes et traits d'union.
- Un échec de validation du corpus fait échouer la suite de tests.

### US-02.03 - Tirer un mot selon la difficulté

En tant que joueur, je veux recevoir un mot aléatoire correspondant à la difficulté choisie, afin d'obtenir une partie adaptée à mon niveau.

DependsOn: US-02.02

Acceptance Criteria:
- Le tirage sélectionne uniquement une entrée du niveau choisi.
- Chaque nouvelle partie déclenche un nouveau tirage.
- Le mot à deviner n'est pas affiché en clair avant la fin d'une partie perdue.
- Le tirage fonctionne entièrement dans le navigateur, sans appel réseau.

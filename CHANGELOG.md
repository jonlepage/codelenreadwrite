# Changelog

## [1.0.0] - 2025-07-31

### Ajouté
- ✨ CodeLens pour afficher le nombre de lectures/écritures des propriétés de classe
- 🔍 Navigation vers les références filtrées par type (lecture/écriture)
- 📖 Support complet JavaScript et TypeScript
- 🎯 Gestion des modificateurs TypeScript (public, private, protected, readonly, static, abstract)
- 🛡️ Gestion des propriétés optionnelles (`prop?: type`)
- ⚡ Optimisations de performance avec gestion du CancellationToken
- 🐛 Gestion robuste des erreurs

### Fonctionnalités
- Support des syntaxes :
  - JavaScript : `a = 5;`
  - TypeScript : `a: number = 5;`, `a?: string;`, `public readonly b: number;`
- CodeLens cliquables pour filtrer les références
- Détection intelligente des lectures vs écritures
- Interface utilisateur intuitive avec icônes 📖 et ✏️

### Technique
- Regex optimisée pour la détection des propriétés
- Gestion des annulations pour de meilleures performances
- Validation des données et gestion d'erreurs
- Code propre et maintenable

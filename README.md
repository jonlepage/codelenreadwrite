# Property Read/Write CodeLens

Une extension VS Code qui affiche des CodeLens sur les propriétés de classe, montrant le nombre de lectures et d'écritures.

## ✨ Fonctionnalités

- **📖 Comptage des lectures** : Affiche le nombre de fois qu'une propriété est lue
- **✏️ Comptage des écritures** : Affiche le nombre de fois qu'une propriété est modifiée
- **🔍 Navigation rapide** : Cliquez sur les CodeLens pour voir les références filtrées
- **🚀 Support complet** : JavaScript et TypeScript (avec types, modificateurs, etc.)

## 📸 Aperçu

![Exemple d'utilisation](https://via.placeholder.com/600x300/007ACC/FFFFFF?text=Property+CodeLens+Example)

## 🎯 Syntaxes supportées

### JavaScript
```javascript
class MyClass {
    a = 5;
    b = "hello";
}
```

### TypeScript
```typescript
class MyClass {
    a: number = 5;
    b?: string = "hello";
    public readonly c: number = 10;
    private static d: string;
    protected abstract e: boolean;
}
```

## 🚀 Installation

1. Ouvrez VS Code
2. Allez dans l'onglet Extensions (Ctrl+Shift+X)
3. Recherchez "Property Read/Write CodeLens"
4. Cliquez sur "Installer"

## 📝 Utilisation

1. Ouvrez un fichier JavaScript ou TypeScript contenant des classes
2. Les CodeLens apparaîtront automatiquement sur les propriétés de classe
3. Cliquez sur "📖 X reads" pour voir uniquement les lectures
4. Cliquez sur "✏️ X writes" pour voir uniquement les écritures

## ⚙️ Configuration

Aucune configuration requise ! L'extension fonctionne automatiquement.

## 🐛 Problèmes connus

- Fonctionne uniquement avec les propriétés de classe (pas les méthodes)
- Nécessite que le fichier soit analysable par VS Code

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir des issues ou des pull requests.

## 📄 Licence

MIT

## 🔗 Liens

- [Repository GitHub](https://github.com/votre-username/property-read-write-codelens)
- [Signaler un bug](https://github.com/votre-username/property-read-write-codelens/issues)

---

**Profitez du développement avec une meilleure visibilité de vos propriétés !** 🎉

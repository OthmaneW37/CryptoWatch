# 📱 CryptoWatch (ContactFav)

Application React Native développée avec Expo qui permet de gérer une liste d'utilisateurs avec système de favoris persistant.

## 🎯 Fonctionnalités

### Fonctionnalités de Base
- ✅ Récupération des utilisateurs depuis l'API JSONPlaceholder
- ✅ Affichage dans une liste (FlatList) avec nom et email
- ✅ Système de favoris avec icônes étoiles (★/☆)
- ✅ Persistance des favoris avec AsyncStorage
- ✅ Indicateur de chargement (ActivityIndicator)
- ✅ Gestion d'erreurs avec try/catch

### 🏆 Défis Réalisés

#### 1. Défi Filtrage (Facile) ✅
- Bouton "Afficher seulement les favoris" / "Tous les contacts"
- Filtrage dynamique de la liste selon le mode activé
- Interface utilisateur intuitive avec indicateur visuel

#### 2. Défi Sécurité (Moyen) ✅
- Bouton "Effacer tout" pour supprimer tous les favoris
- Confirmation avant suppression pour éviter les erreurs
- Nettoyage complet du AsyncStorage
- Réinitialisation de l'état local

#### 3. Défi API POST (Avancé) ✅
- Formulaire d'ajout avec TextInput pour le nom
- Bouton "Ajouter" pour créer un nouvel utilisateur
- Requête POST vers l'API JSONPlaceholder
- Ajout immédiat dans la liste locale
- Génération automatique de l'email

## 📊 Statistiques
- Compteur de favoris en temps réel
- Affichage du nombre d'éléments visibles/total

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Lancer l'application
npm start
```

## 📦 Dépendances

- **expo**: Framework React Native
- **axios**: Client HTTP pour les appels API
- **@react-native-async-storage/async-storage**: Stockage local persistant

## 🎨 Design

- Interface moderne et épurée
- Cards avec ombres et bordures arrondies
- Boutons colorés et intuitifs
- Feedback visuel pour toutes les actions
- État vide personnalisé

## 📝 API Utilisée

- **GET** `https://jsonplaceholder.typicode.com/users` - Récupération des utilisateurs
- **POST** `https://jsonplaceholder.typicode.com/users` - Ajout d'un utilisateur

## 🔑 Clé AsyncStorage

- `@my_favorites_ids` - Stockage des IDs des favoris

## 🎓 Concepts React Native Couverts

- Hooks (useState, useEffect)
- Composants fonctionnels
- FlatList et renderItem
- AsyncStorage
- Axios pour les appels HTTP
- Gestion d'état local
- Styles avec StyleSheet
- SafeAreaView
- TouchableOpacity
- TextInput
- Alert
- ActivityIndicator

## 🚀 Utilisation

1. **Ajouter un utilisateur** : Saisir un nom dans le champ et cliquer sur "➕ Ajouter"
2. **Marquer comme favori** : Cliquer sur l'étoile (☆) à droite d'un utilisateur
3. **Filtrer les favoris** : Utiliser le bouton "👥 Tous les contacts" / "🌟 Favoris actifs"
4. **Effacer tous les favoris** : Cliquer sur "🗑️ Effacer tout" (avec confirmation)

---

**Développé avec ❤️ en React Native + Expo**

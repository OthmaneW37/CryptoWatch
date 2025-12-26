import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  Alert, 
  TextInput, 
  Button 
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const FAVORITES_KEY = '@my_favorites_ids';

export default function App() {
  // États de base
  const [users, setUsers] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // États pour les défis
  const [showFavsOnly, setShowFavsOnly] = useState(false); // Défi Filtrage
  const [newUserName, setNewUserName] = useState(''); // Défi POST

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://jsonplaceholder.typicode.com/users');
      setUsers(response.data);
      const storedFavs = await AsyncStorage.getItem(FAVORITES_KEY);
      if (storedFavs) {
        setFavorites(JSON.parse(storedFavs));
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les données");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (userId) => {
    try {
      let newFavorites;
      if (favorites.includes(userId)) {
        newFavorites = favorites.filter(id => id !== userId);
      } else {
        newFavorites = [...favorites, userId];
      }
      setFavorites(newFavorites);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Erreur de sauvegarde", error);
    }
  };

  // DÉFI SÉCURITÉ : Fonction pour effacer tous les favoris
  const clearAllFavorites = async () => {
    Alert.alert(
      "Confirmation",
      "Voulez-vous vraiment effacer tous les favoris ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Effacer",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(FAVORITES_KEY);
              setFavorites([]);
              Alert.alert("Succès", "Tous les favoris ont été effacés");
            } catch (error) {
              console.error("Erreur lors de l'effacement", error);
              Alert.alert("Erreur", "Impossible d'effacer les favoris");
            }
          }
        }
      ]
    );
  };

  // DÉFI POST : Fonction pour ajouter un utilisateur
  const addUser = async () => {
    if (!newUserName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un nom");
      return;
    }

    try {
      const response = await axios.post('https://jsonplaceholder.typicode.com/users', {
        name: newUserName,
        email: `${newUserName.toLowerCase().replace(/\s+/g, '.')}@example.com`
      });
      
      // Ajouter l'utilisateur créé à la liste locale
      const newUser = {
        id: response.data.id,
        name: newUserName,
        email: response.data.email || `${newUserName.toLowerCase().replace(/\s+/g, '.')}@example.com`
      };
      
      setUsers([newUser, ...users]);
      setNewUserName('');
      Alert.alert("Succès", `Utilisateur "${newUserName}" ajouté avec succès !`);
    } catch (error) {
      console.error("Erreur lors de l'ajout", error);
      Alert.alert("Erreur", "Impossible d'ajouter l'utilisateur");
    }
  };

  // DÉFI FILTRAGE : Logique de filtrage
  const displayedUsers = showFavsOnly 
    ? users.filter(user => favorites.includes(user.id))
    : users;

  const renderItem = ({ item }) => {
    const isFav = favorites.includes(item.id);
    return (
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => toggleFavorite(item.id)}
          style={[styles.favButton, isFav ? styles.favActive : styles.favInactive]}
        >
          <Text style={styles.favText}>{isFav ? "★" : "☆"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>📱 Mon Répertoire API</Text>
      
      {/* DÉFI POST : Formulaire d'ajout d'utilisateur */}
      <View style={styles.addUserContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nom du nouvel utilisateur"
          value={newUserName}
          onChangeText={setNewUserName}
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.addButton} onPress={addUser}>
          <Text style={styles.addButtonText}>➕ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* ZONE DES CONTRÔLES : Filtrage et Nettoyage */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, showFavsOnly && styles.filterButtonActive]}
          onPress={() => setShowFavsOnly(!showFavsOnly)}
        >
          <Text style={styles.filterButtonText}>
            {showFavsOnly ? "🌟 Favoris actifs" : "👥 Tous les contacts"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearAllFavorites}
        >
          <Text style={styles.clearButtonText}>🗑️ Effacer tout</Text>
        </TouchableOpacity>
      </View>

      {/* Indicateur du nombre de favoris */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          📊 {favorites.length} favori{favorites.length > 1 ? 's' : ''} | 
          {showFavsOnly ? ` ${displayedUsers.length} affiché${displayedUsers.length > 1 ? 's' : ''}` : ` ${users.length} total`}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des contacts...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {showFavsOnly 
                  ? "😢 Aucun favori pour le moment" 
                  : "📭 Aucun contact disponible"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5', 
    paddingTop: 40 
  },
  header: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 20,
    color: '#333'
  },
  
  // Styles pour le formulaire d'ajout
  addUserContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333'
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },

  // Styles pour les contrôles
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  filterButtonActive: {
    backgroundColor: '#FF9500',
  },
  filterButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },
  clearButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },

  // Stats
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500'
  },

  // Loader
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },

  // Liste
  list: { 
    paddingHorizontal: 16, 
    paddingBottom: 20 
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flex: 1,
    marginRight: 10
  },
  name: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  email: { 
    fontSize: 14, 
    color: '#666', 
    marginTop: 4 
  },
  favButton: { 
    padding: 10, 
    borderRadius: 20,
    minWidth: 44,
    alignItems: 'center'
  },
  favActive: { 
    backgroundColor: '#fff3cd' 
  },
  favInactive: { 
    backgroundColor: '#f0f0f0' 
  },
  favText: { 
    fontSize: 24, 
    color: '#f1c40f' 
  },

  // Empty state
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center'
  }
});

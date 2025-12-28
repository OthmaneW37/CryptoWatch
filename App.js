import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  RefreshControl,
  Keyboard,
  Platform
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

  // Nouveaux états UX
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    fadeAnim.setValue(0);
    try {
      const response = await axios.get('https://jsonplaceholder.typicode.com/users');
      setUsers(response.data);
      const storedFavs = await AsyncStorage.getItem(FAVORITES_KEY);
      if (storedFavs) {
        setFavorites(JSON.parse(storedFavs));
      }

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les données");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleFavorite = async (userId) => {
    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

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
      Keyboard.dismiss();
      Alert.alert("Succès", `Utilisateur "${newUserName}" ajouté avec succès !`);
    } catch (error) {
      console.error("Erreur lors de l'ajout", error);
      Alert.alert("Erreur", "Impossible d'ajouter l'utilisateur");
    }
  };

  // Helper function to generate avatar initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Helper function for avatar colors
  const getAvatarColor = (id) => {
    const colors = ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];
    return colors[id % colors.length];
  };

  // DÉFI FILTRAGE + SEARCH : Logique de filtrage combinée
  const displayedUsers = users
    .filter(user => {
      // Filter by favorites if active
      if (showFavsOnly && !favorites.includes(user.id)) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      }

      return true;
    });

  const renderItem = ({ item, index }) => {
    const isFav = favorites.includes(item.id);
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [
        {
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[styles.cardWrapper, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => toggleFavorite(item.id)}
          style={[styles.card, isFav && styles.cardFavorite]}
        >
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.id) }]}>
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          </View>

          {/* Favorite Button */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View style={[styles.favButton, isFav ? styles.favActive : styles.favInactive]}>
              <Text style={styles.favText}>{isFav ? "★" : "☆"}</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>✨ CryptoWatch</Text>
        <Text style={styles.subtitle}>Gérez vos contacts favoris</Text>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DÉFI POST : Formulaire d'ajout d'utilisateur */}
      <View style={styles.addUserContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nom du nouvel utilisateur"
          value={newUserName}
          onChangeText={setNewUserName}
          placeholderTextColor="#999"
          onSubmitEditing={addUser}
          returnKeyType="done"
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
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Chargement des contacts...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#667eea', '#764ba2']}
              tintColor="#667eea"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>
                {searchQuery.trim() ? '🔍' : showFavsOnly ? '⭐' : '📭'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? `Aucun résultat pour "${searchQuery}"`
                  : showFavsOnly
                    ? "Aucun favori pour le moment"
                    : "Aucun contact disponible"}
              </Text>
              {searchQuery.trim() && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.emptyButton}>
                  <Text style={styles.emptyButtonText}>Effacer la recherche</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'ios' ? 0 : 40
  },

  // Header
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: '#64748b',
    marginTop: 4,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  clearSearch: {
    padding: 4,
    marginLeft: 8,
  },
  clearSearchText: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '600',
  },

  // Add user form
  addUserContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    color: '#1e293b',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Controls
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#667eea',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterButtonActive: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  filterButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  clearButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Stats
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Loader
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },

  // List
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },

  // Card wrapper for animation
  cardWrapper: {
    marginBottom: 12,
  },

  // Card
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  cardFavorite: {
    borderColor: '#fbbf24',
    backgroundColor: '#fffbf0',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.15,
  },

  // Avatar
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // User info
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },

  // Favorite button
  favButton: {
    padding: 10,
    borderRadius: 20,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favActive: {
    backgroundColor: '#fef3c7',
  },
  favInactive: {
    backgroundColor: '#f1f5f9',
  },
  favText: {
    fontSize: 24,
    color: '#f59e0b',
  },

  // Empty state
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

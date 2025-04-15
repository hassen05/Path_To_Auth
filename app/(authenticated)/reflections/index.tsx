import React from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Title, Paragraph, IconButton, useTheme, ActivityIndicator } from 'react-native-paper';
import { reflectionThemes } from '../../../data/reflectionThemes';
import { ReflectionTheme } from '../../../types/journal';
import { useWindowDimensions } from 'react-native';

function ReflectionThemesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSelectTheme = (selectedTheme: ReflectionTheme) => {
    setIsLoading(true);
    // Navigate to the reflection session screen with the selected theme
    router.push({
      pathname: '/reflections/session',
      params: { themeId: selectedTheme.id }
    });
    setIsLoading(false);
  };

  const renderThemeCard = ({ item }: { item: ReflectionTheme }) => {
    const cardWidth = width > 600 ? width / 2 - 24 : width - 32;
    
    return (
      <TouchableOpacity 
        onPress={() => handleSelectTheme(item)}
        activeOpacity={0.7}
        style={[styles.cardContainer, { width: cardWidth }]}
      >
        <Surface style={styles.card} elevation={1}>
          <View style={styles.iconContainer}>
            <IconButton
              icon={item.icon || 'help-circle-outline'}
              size={32}
              iconColor={theme.colors.primary}
            />
          </View>
          
          <View style={styles.cardContent}>
            <Title style={styles.themeTitle}>{item.name}</Title>
            <Paragraph style={styles.themeDescription}>{item.description}</Paragraph>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading reflection session...</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Title style={styles.title}>Reflection Themes</Title>
            <Paragraph style={styles.subtitle}>
              Select a theme to begin a guided reflection journey with 10 thought-provoking questions.
            </Paragraph>
          </View>
          
          <FlatList
            data={reflectionThemes}
            renderItem={renderThemeCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            numColumns={width > 600 ? 2 : 1}
            key={width > 600 ? 'two-column' : 'one-column'}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: 16,
    lineHeight: 22,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  cardContainer: {
    marginBottom: 16,
    marginHorizontal: 8,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
});

export default ReflectionThemesScreen;

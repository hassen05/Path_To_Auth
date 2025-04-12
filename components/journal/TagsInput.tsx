import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Chip, Text, useTheme, Button } from 'react-native-paper';
import { suggestTags } from '../../utils/ai/tagSuggestion';

interface TagsInputProps {
  tags: string[];
  onTagsChange: (newTags: string[]) => void;
  content: string;
  disabled?: boolean;
}

export function TagsInput({ tags, onTagsChange, content, disabled = false }: TagsInputProps) {
  const theme = useTheme();
  const [newTag, setNewTag] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Common tags for quick selection
  const commonTags = [
    'happiness', 'sadness', 'anxiety', 'stress', 'gratitude', 
    'growth', 'family', 'work', 'health', 'relationships'
  ];
  
  // Filter common tags to exclude already selected tags
  const filteredCommonTags = commonTags.filter(tag => !tags.includes(tag));
  
  useEffect(() => {
    // Only get suggestions if we have meaningful content
    if (content.length > 50) {
      generateTagSuggestions();
    }
  }, [content]);
  
  const generateTagSuggestions = async () => {
    if (loadingSuggestions) return;
    
    setLoadingSuggestions(true);
    try {
      const suggestions = await suggestTags(content, tags);
      // Filter out any suggestions that are already in tags
      const filteredSuggestions = suggestions.filter(tag => !tags.includes(tag));
      setSuggestedTags(filteredSuggestions);
    } catch (error) {
      console.error('Failed to generate tag suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };
  
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleQuickTagPress = (tag: string) => {
    if (!tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
  };
  
  const handleSuggestedTagPress = (tag: string) => {
    if (!tags.includes(tag)) {
      onTagsChange([...tags, tag]);
      // Remove the tag from suggestions
      setSuggestedTags(suggestedTags.filter(t => t !== tag));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>
      
      {/* Current Tags */}
      <View style={styles.tagsContainer}>
        {tags.map(tag => (
          <Chip
            key={tag}
            mode="outlined"
            onClose={() => handleRemoveTag(tag)}
            style={styles.tag}
            disabled={disabled}
          >
            {tag}
          </Chip>
        ))}
      </View>
      
      {/* Add New Tag */}
      {!disabled && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Add a tag..."
            onSubmitEditing={handleAddTag}
            blurOnSubmit={false}
          />
          <Button
            mode="contained"
            onPress={handleAddTag}
            style={styles.addButton}
            disabled={!newTag.trim()}
          >
            Add
          </Button>
        </View>
      )}
      
      {/* AI-Suggested Tags Section */}
      {!disabled && suggestedTags.length > 0 && (
        <View style={styles.suggestedSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Suggested Tags</Text>
            <ActivityIndicator animating={loadingSuggestions} size="small" color={theme.colors.primary} />
            {!loadingSuggestions && (
              <TouchableOpacity onPress={generateTagSuggestions}>
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.suggestedTagsContainer}>
            {suggestedTags.map(tag => (
              <Chip
                key={tag}
                mode="outlined"
                onPress={() => handleSuggestedTagPress(tag)}
                style={[styles.suggestionChip, { borderColor: theme.colors.primary }]}
              >
                {tag}
              </Chip>
            ))}
          </View>
        </View>
      )}
      
      {/* Common Tags for Quick Selection */}
      {!disabled && filteredCommonTags.length > 0 && (
        <View style={styles.quickTagsSection}>
          <Text style={styles.sectionTitle}>Quick Tags</Text>
          <View style={styles.quickTagsContainer}>
            {filteredCommonTags.slice(0, 8).map(tag => (
              <Chip
                key={tag}
                mode="outlined"
                onPress={() => handleQuickTagPress(tag)}
                style={styles.quickTag}
              >
                {tag}
              </Chip>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#764094',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(118, 64, 148, 0.08)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  addButton: {
    borderRadius: 4,
  },
  suggestedSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    color: '#666',
  },
  refreshText: {
    fontSize: 12,
    color: '#764094',
    marginLeft: 8,
  },
  suggestedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(118, 64, 148, 0.05)',
  },
  quickTagsSection: {
    marginBottom: 16,
  },
  quickTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickTag: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
});

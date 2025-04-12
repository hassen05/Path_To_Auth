import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, useTheme, Text, TouchableRipple, Modal, Button, Surface } from 'react-native-paper';
import { Mood } from '../../types/journal';

const MOODS: { value: Mood; label: string; icon: string }[] = [
  { value: 'happy', label: 'Happy', icon: 'emoticon-happy-outline' },
  { value: 'neutral', label: 'Neutral', icon: 'emoticon-neutral-outline' },
  { value: 'sad', label: 'Sad', icon: 'emoticon-sad-outline' },
  { value: 'excited', label: 'Excited', icon: 'emoticon-excited-outline' },
  { value: 'anxious', label: 'Anxious', icon: 'emoticon-confused-outline' },
];

export interface MoodPickerProps {
  onSelectMood: (mood: Mood) => void;
  initialMood?: Mood;
  visible?: boolean;
  onDismiss?: () => void;
}

export function MoodPicker({ onSelectMood, initialMood = 'neutral', visible = false, onDismiss = () => {} }: MoodPickerProps) {
  const theme = useTheme();
  const [selectedMood, setSelectedMood] = useState<Mood>(initialMood);

  // Map moods to emojis
  const moodEmojis: Record<Mood, string> = {
    happy: '😊',
    sad: '😔',
    neutral: '😐',
    excited: '🤩',
    anxious: '😰',
    calm: '😌',
  };

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    onSelectMood(mood);
    onDismiss();
  };

  return (
    <Modal visible={visible} onDismiss={onDismiss}>
      <Surface style={styles.modalContent}>
        <Text variant="titleLarge" style={{ marginBottom: 20 }}>How are you feeling?</Text>
        
        <View style={styles.moodGrid}>
          {Object.entries(moodEmojis).map(([mood, emoji]) => (
            <TouchableRipple
              key={mood}
              style={[
                styles.moodButton,
                {
                  backgroundColor:
                    selectedMood === mood
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
                },
              ]}
              onPress={() => handleMoodSelect(mood as Mood)}
              borderless
            >
              <View style={styles.moodContent}>
                <Text style={styles.moodEmoji}>{emoji}</Text>
                <Text style={styles.moodLabel}>
                  {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </Text>
              </View>
            </TouchableRipple>
          ))}
        </View>
        
        <Button 
          onPress={onDismiss} 
          style={{ marginTop: 20 }}
          mode="text"
        >
          Cancel
        </Button>
      </Surface>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  moodButton: {
    width: '47%',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  moodContent: {
    padding: 16,
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  moodLabel: {
    textAlign: 'center',
    fontSize: 14,
  },
});

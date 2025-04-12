import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TextInputDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (text: string) => void;
  title: string;
  defaultValue?: string;
}

export function TextInputDialog({
  visible,
  onDismiss,
  onSubmit,
  title,
  defaultValue = '',
}: TextInputDialogProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(defaultValue);

  const handleSubmit = () => {
    onSubmit(text);
    setText(defaultValue); // Reset for next use
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            marginTop: insets.top,
            marginBottom: insets.bottom,
          },
        ]}
      >
        <Text variant="titleLarge" style={styles.title}>
          {title}
        </Text>
        <TextInput
          mode="outlined"
          multiline
          numberOfLines={5}
          value={text}
          onChangeText={setText}
          placeholder="Enter your journal text here..."
          style={styles.input}
          autoFocus
        />
        <View style={styles.buttons}>
          <Button
            mode="text"
            onPress={onDismiss}
            style={styles.button}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
          >
            Save
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    elevation: 5,
  },
  title: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    marginLeft: 8,
  },
});

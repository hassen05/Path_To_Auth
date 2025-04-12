import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Text, Button, useTheme, Dialog, Portal, TextInput, Modal } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TextInputDialog } from './TextInputDialog';

interface PhysicalJournalCaptureProps {
  visible: boolean;
  onClose: () => void;
  onTextRecognized: (text: string) => void;
  onDismiss?: () => void;
  onCapture?: (content: string) => void;
}

export function PhysicalJournalCapture({ 
  visible, 
  onClose,
  onTextRecognized,
  onDismiss = onClose,
  onCapture = onTextRecognized
}: PhysicalJournalCaptureProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTextDialog, setShowTextDialog] = useState(false);

  const pickImage = async () => {
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
      await processImage();
    }
  };

  const takePicture = async () => {
    // Request camera permissions first
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
      await MediaLibrary.saveToLibraryAsync(result.assets[0].uri);
      await processImage();
    }
  };

  const processImage = async () => {
    try {
      setIsProcessing(true);
      
      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show text input dialog after "processing"
      setIsProcessing(false);
      setShowTextDialog(true);
    } catch (error) {
      console.error('Text recognition error:', error);
      alert('Failed to process the image. Please try again with a clearer image.');
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = (text: string) => {
    setShowTextDialog(false);
    if (text && text.trim().length > 0) {
      onCapture(text);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text variant="titleLarge">Capture Journal Page</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.onBackground} />
            </TouchableOpacity>
          </View>

          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.processingText}>Processing image...</Text>
            </View>
          ) : capturedImage ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: capturedImage }} style={styles.preview} />
              <View style={styles.buttonRow}>
                <Button 
                  mode="contained" 
                  onPress={() => setCapturedImage(null)}
                  style={styles.button}
                >
                  Retake
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.optionsContainer}>
              <Text variant="bodyLarge" style={styles.instructionText}>
                Take a photo of your physical journal page or select an image from your gallery
              </Text>
              
              <View style={styles.buttonContainer}>
                <Button 
                  mode="contained" 
                  icon="camera" 
                  onPress={takePicture}
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                >
                  Take Photo
                </Button>
                
                <Button 
                  mode="contained" 
                  icon="image" 
                  onPress={pickImage}
                  style={[styles.button, { backgroundColor: theme.colors.secondary }]}
                >
                  Pick from Gallery
                </Button>
              </View>
              
              <View style={styles.imageContainer}>
                {/* Using an icon instead of an image asset */}
                <MaterialCommunityIcons 
                  name="notebook-outline" 
                  size={120} 
                  color={theme.colors.onSurfaceVariant} 
                  style={styles.placeholderIcon}
                />
                <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
                  For best results, ensure good lighting and that the page is flat
                </Text>
              </View>
            </View>
          )}
        </View>

        <TextInputDialog
          visible={showTextDialog}
          onDismiss={() => setShowTextDialog(false)}
          onSubmit={handleTextSubmit}
          title="Detected Text from Journal"
          defaultValue=""
        />
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 8,
    padding: 20,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  instructionText: {
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  button: {
    borderRadius: 8,
    margin: 8,
    paddingVertical: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    opacity: 0.6,
    marginBottom: 16,
  },
  helperText: {
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    width: '80%',
    height: '80%',
    borderRadius: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
  },
});

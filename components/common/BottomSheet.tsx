import React from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Modal, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  fullHeight?: boolean; // Add this prop to allow full-height sheets
}

export function BottomSheet({ visible, onDismiss, children, fullHeight = false }: BottomSheetProps) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          fullHeight && styles.fullHeightContainer,
          { backgroundColor: theme.colors.background }
        ]}
      >
        <SafeAreaView edges={['bottom']} style={fullHeight ? { flex: 1 } : {}}>
          {children}
        </SafeAreaView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullHeightContainer: {
    margin: 0,
    marginTop: 50, // Leave space at top for status bar
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    height: '95%', // Take up 95% of screen height
  },
});

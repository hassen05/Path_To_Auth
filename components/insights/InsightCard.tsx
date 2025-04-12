import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Card, IconButton, Surface, Portal, Modal, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface InsightCardProps {
  insights: string[];
  onRefresh?: () => void;
  visible?: boolean;
  onDismiss?: () => void;
  onGenerate?: () => void;
}

export function InsightCard({ 
  insights, 
  onRefresh, 
  visible = false, 
  onDismiss = () => {}, 
  onGenerate = onRefresh 
}: InsightCardProps) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
      >
        <SafeAreaView edges={['bottom']}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>Insights</Text>
            <IconButton icon="close" onPress={onDismiss} />
          </View>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.container}>
              {insights.length > 0 ? (
                insights.map((insight, index) => (
                  <Surface 
                    key={index} 
                    style={[styles.insightCard, { backgroundColor: theme.colors.surfaceVariant }]}
                  >
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>{insight}</Text>
                  </Surface>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                    No insights generated yet. Tap the button below to generate insights from your journal entries.
                  </Text>
                </View>
              )}

              <Button 
                mode="contained-tonal" 
                onPress={onGenerate} 
                style={styles.button}
                icon="refresh"
              >
                Generate Insights
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  scrollView: {
    maxHeight: '100%',
  },
  container: {
    padding: 16,
    paddingTop: 0,
  },
  insightCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  button: {
    marginTop: 16,
  },
});

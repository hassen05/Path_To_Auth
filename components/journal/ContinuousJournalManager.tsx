import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Menu, Divider, IconButton, TextInput, Dialog, Portal, FAB, useTheme } from 'react-native-paper';
import { useJournal, JournalSeries } from '../../hooks/useJournal';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

export function ContinuousJournalManager() {
  const theme = useTheme();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [newSeriesDescription, setNewSeriesDescription] = useState('');
  const [currentSeries, setCurrentSeries] = useState<JournalSeries | null>(null);
  const router = useRouter();
  
  const { 
    series, 
    seriesLoading, 
    createSeries, 
    updateSeries, 
    deleteSeries,
    getContinuousEntries
  } = useJournal();

  const handleCreateSeries = async () => {
    if (!newSeriesTitle.trim()) return;
    
    try {
      await createSeries(newSeriesTitle.trim(), newSeriesDescription.trim());
      setNewSeriesTitle('');
      setNewSeriesDescription('');
      setDialogVisible(false);
    } catch (error) {
      console.error('Error creating series:', error);
    }
  };

  const handleEditSeries = async () => {
    if (!currentSeries || !newSeriesTitle.trim()) return;
    
    try {
      await updateSeries(currentSeries.id, {
        title: newSeriesTitle.trim(),
        description: newSeriesDescription.trim()
      });
      setEditDialogVisible(false);
    } catch (error) {
      console.error('Error updating series:', error);
    }
  };

  const handleDeleteSeries = async (id: string) => {
    try {
      await deleteSeries(id);
      setMenuVisible(null);
    } catch (error) {
      console.error('Error deleting series:', error);
    }
  };

  const openEditDialog = (series: JournalSeries) => {
    setCurrentSeries(series);
    setNewSeriesTitle(series.title);
    setNewSeriesDescription(series.description || '');
    setEditDialogVisible(true);
  };

  const navigateToSeries = (series: JournalSeries) => {
    // Navigate to the continuous journal screen with the series ID
    router.push({
      pathname: '/(authenticated)/journal/continuous',
      params: { seriesId: series.id }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Continuous Journals</Text>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {series.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              You don't have any continuous journals yet.
            </Text>
            <Text style={styles.emptySubtext}>
              Create one to start writing interconnected entries in a series format.
            </Text>
            <Button 
              mode="contained" 
              onPress={() => setDialogVisible(true)}
              style={{ marginTop: 20 }}
            >
              Create Your First Journal
            </Button>
          </View>
        ) : (
          series.map((item) => {
            const entryCount = getContinuousEntries(item.id).length;
            
            return (
              <Card 
                key={item.id} 
                style={styles.card}
                onPress={() => navigateToSeries(item)}
              >
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text style={styles.seriesTitle}>{item.title}</Text>
                    <Menu
                      visible={menuVisible === item.id}
                      onDismiss={() => setMenuVisible(null)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          onPress={() => setMenuVisible(item.id)}
                        />
                      }
                    >
                      <Menu.Item 
                        onPress={() => {
                          setMenuVisible(null);
                          openEditDialog(item);
                        }} 
                        title="Edit" 
                        leadingIcon="pencil"
                      />
                      <Divider />
                      <Menu.Item 
                        onPress={() => handleDeleteSeries(item.id)} 
                        title="Delete" 
                        leadingIcon="delete"
                      />
                    </Menu>
                  </View>
                  
                  {item.description && (
                    <Text style={styles.description}>{item.description}</Text>
                  )}
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoText}>
                      {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                    </Text>
                    <Text style={styles.infoText}>
                      Last updated: {format(new Date(item.updated_at), 'MMM d, yyyy')}
                    </Text>
                  </View>
                </Card.Content>
                <Card.Actions>
                  <Button 
                    mode="outlined" 
                    onPress={() => navigateToSeries(item)}
                  >
                    Open Journal
                  </Button>
                </Card.Actions>
              </Card>
            );
          })
        )}
      </ScrollView>
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => setDialogVisible(true)}
      />
      
      {/* Create New Series Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Create New Journal</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Journal Title"
              value={newSeriesTitle}
              onChangeText={setNewSeriesTitle}
              style={styles.input}
            />
            <TextInput
              label="Description (optional)"
              value={newSeriesDescription}
              onChangeText={setNewSeriesDescription}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreateSeries}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Edit Series Dialog */}
      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>Edit Journal</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Journal Title"
              value={newSeriesTitle}
              onChangeText={setNewSeriesTitle}
              style={styles.input}
            />
            <TextInput
              label="Description (optional)"
              value={newSeriesDescription}
              onChangeText={setNewSeriesDescription}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleEditSeries}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#888',
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 12,
  },
});

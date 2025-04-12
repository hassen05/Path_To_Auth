import { StyleSheet, View } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';

interface EditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export function Editor({ value, onChange, placeholder }: EditorProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline
        mode="outlined"
        style={styles.input}
        numberOfLines={8}
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 200,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

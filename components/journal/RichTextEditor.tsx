import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  onChange?: (text: string) => void;
  minHeight?: number;
  maxHeight?: number;
  editable?: boolean;
}

export interface RichTextEditorRef {
  setContentHTML: (html: string) => void;
  getContentHtml: () => Promise<string>;
  focusContentEditor: () => void;
  blurContentEditor: () => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>((props, ref) => {
  const {
    initialContent = '',
    placeholder = 'What\'s on your mind?',
    onChange = () => {},
    minHeight = 150,
    maxHeight = 300,
    editable = true
  } = props;

  const [content, setContent] = React.useState(initialContent);
  const inputRef = useRef<TextInput>(null);

  const handleContentChange = (text: string) => {
    setContent(text);
    onChange(text);
  };

  useImperativeHandle(ref, () => ({
    setContentHTML: (html: string) => {
      setContent(html);
    },
    getContentHtml: async () => {
      return Promise.resolve(content);
    },
    focusContentEditor: () => {
      inputRef.current?.focus();
    },
    blurContentEditor: () => {
      inputRef.current?.blur();
    }
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.editorContainer, { minHeight, maxHeight }]}>
        <View style={styles.paperBackground}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.8)']}
            style={styles.paperGradient}
          />
          {/* Horizontal lines for notebook effect */}
          {Array.from({ length: Math.ceil(minHeight / 25) }).map((_, index) => (
            <View 
              key={`line-${index}`} 
              style={[styles.paperLine, { top: index * 25 + 14 }]}
            />
          ))}
          {/* Left margin */}
          <View style={styles.marginLine} />
          <TextInput
            ref={inputRef}
            style={styles.editor}
            multiline
            value={content}
            onChangeText={handleContentChange}
            placeholder={placeholder}
            placeholderTextColor="rgba(150, 120, 170, 0.7)"
            editable={editable}
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  editorContainer: {
    position: 'relative',
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#faf5ff',
  },
  paperBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
  },
  paperGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  paperLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(118, 64, 148, 0.1)',
  },
  marginLine: {
    position: 'absolute',
    left: 40,
    top: 0,
    bottom: 0, // Margin position
    width: 1,
    backgroundColor: 'rgba(180, 120, 200, 0.15)', // Subtle vertical line
  },
  editor: {
    flex: 1,
    paddingLeft: 55, // More space for the margin
    paddingRight: 16,
    paddingTop: 14,
    paddingBottom: 16,
    fontSize: 16,
    lineHeight: 25, // Match with the paper lines
    color: 'rgba(90, 60, 120, 0.8)', // Purple-tinted text color
    backgroundColor: 'transparent',
    textAlignVertical: 'top',
    fontFamily: 'SummaryNotes-Regular', // Use the SummaryNotes font
    // Special styles for Android to ensure proper rendering
    ...Platform.select({
      android: {
        fontWeight: '400', // Ensure weight is defined for Android
      }
    })
  },
  // Removed formatting styles
});

export default RichTextEditor;

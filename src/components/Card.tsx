import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, Shadows, Spacing } from '../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

import { useTheme } from '../context/ThemeContext';

export const Card = ({ children, style }: CardProps) => {
  const { colors } = useTheme();
  
  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: colors.paper, 
        borderColor: colors.border 
      }, 
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
});

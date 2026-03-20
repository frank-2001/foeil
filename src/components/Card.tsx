import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, Shadows, Spacing } from '../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card = ({ children, style }: CardProps) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.paper,
    borderRadius: 16,
    padding: Spacing.md,
    ...Shadows.paper,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
});

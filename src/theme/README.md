# Design System

This directory contains the complete design system implementation for the Secret Mission app, following the specifications outlined in the design document.

## Overview

The design system provides:
- **Consistent color palette** with mandatory colors for brand consistency
- **Typography hierarchy** following iOS SF Pro style guidelines
- **Spacing system** for consistent layout and padding
- **Reusable UI components** that implement the design specifications
- **Theme provider** for accessing design system values throughout the app

## Usage

### 1. Wrap your app with ThemeProvider

```tsx
import { ThemeProvider } from './src/theme';

export default function App() {
  return (
    <ThemeProvider>
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

### 2. Use the useTheme hook to access design system values

```tsx
import { useTheme } from './src/theme';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <View style={{
      backgroundColor: theme.colors.backgroundPrimary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
    }}>
      <Text style={[theme.typography.headline, { color: theme.colors.textPrimary }]}>
        Hello World
      </Text>
    </View>
  );
};
```

### 3. Use the pre-built UI components

```tsx
import { Button, Card, Input, StatusIndicator } from './src/components/ui';

const MyScreen = () => {
  return (
    <Card>
      <Input 
        label="Nome Giocatore" 
        placeholder="Inserisci il nome"
        onChangeText={setText}
      />
      <Button 
        title="Inizia Partita" 
        onPress={handleStart}
        variant="primary"
      />
      <StatusIndicator status="active" />
    </Card>
  );
};
```

## Color Palette

The design system uses a mandatory color palette that must be followed exactly:

- **Primary (#F5B301)**: Gold - Used for CTA buttons and primary actions
- **Secondary (#1F2A44)**: Deep navy - Used for headers and navigation
- **Accent (#2EC4C6)**: Soft teal - Used for active states and focus
- **Text Primary (#2B2B2B)**: Main text color
- **Text Secondary (#6B7280)**: Secondary text and placeholders
- **Background Primary (#FFFFFF)**: Main background color
- **Background Secondary (#F5F6F8)**: Secondary background elements

## Typography

iOS SF Pro style hierarchy with 8 levels:
- **Title 1**: 28px bold - Main page titles
- **Title 2**: 22px bold - Section titles
- **Headline**: 17px semibold - Important headings
- **Body**: 17px regular - Main body text
- **Callout**: 16px regular - Emphasized body text
- **Subhead**: 15px regular - Secondary headings
- **Footnote**: 13px regular - Small text
- **Caption**: 12px regular - Very small text

## Spacing

Consistent spacing system:
- **xs**: 4px
- **sm**: 8px
- **md**: 16px (most common)
- **lg**: 24px
- **xl**: 32px
- **xxl**: 48px

## Border Radius

Consistent rounded corners:
- **small**: 8px
- **medium**: 12px (most common)
- **large**: 16px

## Components

### Button
- **Variants**: primary, secondary, destructive
- **Sizes**: small, medium, large
- **States**: normal, disabled, loading

### Card
- **Variants**: default (with shadow), elevated (more shadow), outlined (border)
- **Features**: Automatic padding, consistent border radius

### Input
- **Features**: Label, error states, helper text, focus states
- **Validation**: Built-in error styling and messaging

### StatusIndicator
- **Types**: active (teal), completed (green), caught (red), waiting (gray)
- **Sizes**: small, medium, large
- **Features**: Color-coded dots with Italian labels

## Design Rules

1. **Use only solid colors** - No gradients
2. **White/light backgrounds only** - Maintain clean aesthetic
3. **Consistent rounded corners** - 12-16px throughout
4. **High contrast** - Ensure excellent readability
5. **iOS-native feel** - Follow iOS Human Interface Guidelines

## Demo

Use the `DesignSystemDemo` component to see all components in action:

```tsx
import { DesignSystemDemo } from './src/components/ui';

// Use in development to preview the design system
<DesignSystemDemo />
```

## Non-Negotiables

- ❌ No cartoon visuals anywhere in the app
- ❌ No mission text visible in lists or overviews
- ✅ Privacy must be enforced by design, not just code
- ✅ UI should feel premium, modern, and iOS-native
- ✅ All interactions should follow iOS Human Interface Guidelines
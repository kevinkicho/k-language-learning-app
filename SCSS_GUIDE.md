# SCSS Architecture Guide

## Overview

This app has been upgraded from CSS to SCSS for better scalability, maintainability, and organization. The SCSS structure provides variables, mixins, nested selectors, and better component organization.

## File Structure

```
app/
├── globals.scss          # Global variables, mixins, and base styles
├── components.scss       # Component-specific styles
└── layout.tsx           # Imports both SCSS files
```

## SCSS Features Used

### 1. Variables
- **Colors**: Complete color palette with primary, success, error, and gray scales
- **Spacing**: Consistent spacing scale (xs, sm, md, lg, xl, 2xl)
- **Border Radius**: Standardized border radius values
- **Transitions**: Predefined transition durations
- **Shadows**: Consistent shadow definitions
- **Z-Index**: Organized z-index scale

### 2. Mixins
- **Button Mixins**: `@mixin button-base` and `@mixin button-variant()`
- **Card Mixins**: `@mixin card-base`
- **Input Mixins**: `@mixin input-base`
- **Modal Mixins**: `@mixin modal-overlay` and `@mixin modal-content`

### 3. Nesting
- BEM-style class naming with nested selectors
- Component-specific styling with logical grouping
- Responsive design with nested media queries

### 4. Partials and Imports
- Modular structure with separate files for different concerns
- Import system for sharing variables and mixins

## Usage Examples

### Using Variables
```scss
.my-component {
  background-color: $primary-500;
  padding: $spacing-lg;
  border-radius: $radius-lg;
  transition: all $transition-normal;
}
```

### Using Mixins
```scss
.my-button {
  @include button-base;
  @include button-variant($primary-500, $primary-600);
}
```

### Using Nested Selectors
```scss
.quiz {
  &-word {
    @include button-base;
    
    &--available {
      background-color: $gray-100;
    }
    
    &--selected {
      background-color: $gray-200;
    }
  }
}
```

## Component Classes

### Button Classes
- `.btn` - Base button styles
- `.btn-primary` - Primary button variant
- `.btn-secondary` - Secondary button variant
- `.btn-success` - Success button variant
- `.btn-error` - Error button variant
- `.btn-outline` - Outline button variant
- `.btn-ghost` - Ghost button variant

### Card Classes
- `.card` - Base card styles
- `.card-hover` - Card with hover effects
- `.card-compact` - Compact card padding
- `.card-large` - Large card padding

### Input Classes
- `.input` - Base input styles
- `.input-field` - Standard input field
- `.input-search` - Search input with icon

### Modal Classes
- `.modal-overlay` - Modal backdrop
- `.modal-content` - Modal content container
- `.modal-header` - Modal header section
- `.modal-title` - Modal title
- `.modal-close` - Modal close button
- `.modal-body` - Modal body content
- `.modal-footer` - Modal footer

### Utility Classes
- `.text-truncate` - Text truncation
- `.sr-only` - Screen reader only content
- `.container-responsive` - Responsive container
- `.grid-responsive` - Responsive grid

## Responsive Design

The SCSS includes responsive utilities and breakpoints:

```scss
// Mobile first approach
@media (min-width: 640px) { /* sm */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }

// Mobile specific
@media (max-width: 640px) { /* mobile styles */ }
@media (max-width: 480px) { /* small mobile styles */ }
```

## Color System

### Primary Colors
- `$primary-50` to `$primary-900` - Blue scale
- Used for main actions, links, and primary UI elements

### Success Colors
- `$success-50` to `$success-900` - Green scale
- Used for success states, confirmations, and positive feedback

### Error Colors
- `$error-50` to `$error-900` - Red scale
- Used for errors, warnings, and destructive actions

### Gray Colors
- `$gray-50` to `$gray-900` - Neutral scale
- Used for text, backgrounds, borders, and secondary elements

## Spacing System

Consistent spacing scale:
- `$spacing-xs`: 0.25rem (4px)
- `$spacing-sm`: 0.5rem (8px)
- `$spacing-md`: 1rem (16px)
- `$spacing-lg`: 1.5rem (24px)
- `$spacing-xl`: 2rem (32px)
- `$spacing-2xl`: 3rem (48px)

## Best Practices

### 1. Use Variables
Always use SCSS variables instead of hardcoded values:
```scss
// ✅ Good
padding: $spacing-md;
color: $primary-500;

// ❌ Bad
padding: 1rem;
color: #3b82f6;
```

### 2. Use Mixins
Leverage mixins for consistent component styling:
```scss
// ✅ Good
.my-button {
  @include button-base;
  @include button-variant($primary-500, $primary-600);
}
```

### 3. Nest Selectors
Use nesting for related styles:
```scss
// ✅ Good
.quiz {
  &-word {
    &--selected {
      background-color: $gray-200;
    }
  }
}
```

### 4. Mobile First
Write styles for mobile first, then enhance for larger screens:
```scss
// ✅ Good
.component {
  padding: $spacing-sm;
  
  @media (min-width: 640px) {
    padding: $spacing-md;
  }
}
```

## Adding New Styles

### 1. Global Styles
Add to `globals.scss`:
- Variables and mixins
- Base styles
- Utility classes

### 2. Component Styles
Add to `components.scss`:
- Component-specific styles
- Feature-specific styles
- Responsive overrides

### 3. New Component Files
For large components, consider creating separate SCSS files:
```scss
// components/MyComponent.scss
@import '../globals';

.my-component {
  // Component styles
}
```

## Benefits of SCSS Upgrade

1. **Maintainability**: Centralized variables and mixins
2. **Consistency**: Standardized spacing, colors, and components
3. **Scalability**: Easy to add new components and features
4. **Organization**: Logical file structure and naming
5. **Reusability**: Mixins and variables reduce code duplication
6. **Responsive**: Built-in responsive design patterns
7. **Performance**: Better CSS output with proper nesting

## Migration Notes

- All existing CSS classes continue to work
- New SCSS classes provide enhanced functionality
- Gradual migration to new classes is recommended
- Backward compatibility maintained 
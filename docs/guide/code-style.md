# Code Style Guide

NC-Scorer uses ESLint and Prettier to enforce consistent code style.

## Running Linters

```bash
# Check and auto-fix issues
npm run lint

# Alternative command
npm run lint:fix
```

## Style Rules

### JavaScript/Vue
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Indentation**: 2 spaces
- **Line length**: 100 characters max
- **Trailing commas**: Required in multi-line structures

### Vue Components
- Use Composition API (`<script setup>`)
- Place components in appropriate directories:
  - `components/` - Reusable components
  - `views/` - Page components

### Example Component

```vue
<template>
  <v-card>
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>{{ content }}</v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  title: String,
  data: Object,
});

const content = computed(() => {
  return props.data?.description || 'No description';
});
</script>
```

## Commit Messages

Use conventional commits:

```bash
# Use the interactive tool
npm run commit
```

Format:
```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

## Best Practices

1. **Import order**: External deps, then internal modules
2. **Naming**: camelCase for variables, PascalCase for components
3. **Comments**: Explain "why", not "what"
4. **Functions**: Keep them small and focused
5. **Error handling**: Always handle API errors gracefully
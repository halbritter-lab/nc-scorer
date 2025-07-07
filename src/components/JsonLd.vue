<template>
  <teleport to="head">
    <component :is="'script'" type="application/ld+json">{{ jsonLdString }}</component>
  </teleport>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: [Object, Array],
    required: true
  }
});

const jsonLdString = computed(() => {
  try {
    return JSON.stringify(props.data, null, 2);
  } catch (error) {
    console.error('Error serializing JSON-LD:', error);
    return '{}';
  }
});
</script>
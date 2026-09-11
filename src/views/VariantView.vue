<!-- src/views/VariantView.vue -->
<template>
  <ContentContainer>
    <h1 class="text-h4 mb-4">Variant Details: {{ variantInput }}</h1>
    <v-alert v-if="!resolvedAssembly" type="error" variant="tonal">
      {{ unsupportedAssemblyMessage }}
    </v-alert>
    <VariantCard
      v-else
      :key="`${variantInput}:${resolvedAssembly}`"
      :variantInput="variantInput"
      :assembly="resolvedAssembly"
    />
  </ContentContainer>
</template>

<script>
import { computed } from 'vue';
import VariantCard from '@/components/VariantCard.vue';
import ContentContainer from '@/components/ContentContainer.vue';
import {
  normalizeAssembly,
  UNSUPPORTED_ASSEMBLY_MESSAGE,
} from '@/utils/assemblyUtils.js';

export default {
  name: 'VariantView',
  props: {
    variantInput: {
      type: String,
      required: true,
    },
    assembly: {
      type: String,
      default: 'GRCh38',
    },
  },
  components: {
    VariantCard,
    ContentContainer,
  },
  setup(props) {
    return {
      resolvedAssembly: computed(() =>
        normalizeAssembly(props.assembly === '' ? 'GRCh38' : props.assembly),
      ),
      unsupportedAssemblyMessage: UNSUPPORTED_ASSEMBLY_MESSAGE,
    };
  },
};
</script>

<style scoped>
/* Additional styling if needed */
</style>

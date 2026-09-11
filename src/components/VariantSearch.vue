<template>
  <form class="variant-search-card" @submit.prevent="searchVariant">
    <div class="form-heading">
      <h2>Explore a variant</h2>
      <p>
        Look up annotations, population frequencies, and supporting evidence.
      </p>
    </div>
    <v-text-field
      v-model="variantInput"
      label="Variant · VCF or HGVS"
      placeholder="1-55051215-G-GA"
      variant="outlined"
      :rules="[validateVariant]"
      id="variant-search-input"
      autocomplete="off"
      spellcheck="false"
      hint="For example: 1-55051215-G-GA or NM_001009944.3:c.11935C>T"
      persistent-hint
    />
    <v-select
      v-model="assembly"
      :items="assemblyOptions"
      label="Genome assembly"
      variant="outlined"
      id="variant-assembly-select"
      hint="Match the assembly used for your coordinates."
      persistent-hint
    />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{
      error
    }}</v-alert>
    <v-btn
      type="submit"
      color="primary"
      min-height="48"
      append-icon="mdi-arrow-right"
      >Look up variant</v-btn
    >
    <div class="form-examples">
      <h3>Try an example</h3>
      <div class="example-list">
        <router-link
          :to="{
            name: 'VariantView',
            params: { variantInput: '1-55051215-G-GA' },
          }"
          ><span>1-55051215-G-GA</span
          ><span class="example-detail">VCF format · GRCh38</span></router-link
        >
        <router-link
          :to="{
            name: 'VariantView',
            params: { variantInput: 'ENST00000302118:c.524-1063_524-1062insA' },
          }"
          ><span>ENST00000302118:c.524-1063_524-1062insA</span
          ><span class="example-detail">HGVS format</span></router-link
        >
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { validateVariant, normalizeVariant } from '@/utils/validationUtils';
const router = useRouter();
const variantInput = ref('');
const assembly = ref('GRCh38');
const error = ref(null);
const assemblyOptions = [
  { title: 'GRCh38 / hg38', value: 'GRCh38' },
  { title: 'GRCh37 / hg19', value: 'GRCh37' },
];
const searchVariant = () => {
  const result = validateVariant(variantInput.value);
  error.value = result === true ? null : result;
  if (error.value) return;
  router.push({
    name: 'VariantView',
    params: {
      variantInput: normalizeVariant(variantInput.value),
      assembly: assembly.value,
    },
  });
};
</script>

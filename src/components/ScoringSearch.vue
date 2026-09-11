<template>
  <form class="scoring-search-card" @submit.prevent="searchScoring">
    <div class="form-heading">
      <h2>Calculate a candidate score</h2>
      <p>
        Enter a variant and the inheritance evidence available for your case.
      </p>
    </div>
    <v-text-field
      v-model="variantInput"
      label="Variant · VCF or HGVS"
      placeholder="1-55051215-G-GA"
      variant="outlined"
      :rules="variantRules"
      id="scoring-variant-input"
      autocomplete="off"
      spellcheck="false"
      hint="For example: 1-55051215-G-GA or NM_001009944.3:c.11935C>T"
      persistent-hint
    />
    <div class="form-grid">
      <v-select
        v-model="assembly"
        :items="assemblyOptions"
        label="Genome assembly"
        variant="outlined"
        id="scoring-assembly-select"
        hint="Match the assembly used for your coordinates."
        persistent-hint
      />
      <v-select
        v-model="inheritance"
        :items="inheritanceOptions"
        label="Inheritance pattern"
        variant="outlined"
        id="inheritance-pattern-select"
      />
    </div>
    <v-text-field
      v-if="showSecondVariantInput"
      v-model="variantInput2"
      label="Second variant · VCF or HGVS"
      variant="outlined"
      :rules="variantRules"
      id="scoring-variant-input-2"
      autocomplete="off"
      spellcheck="false"
      hint="Required for compound heterozygous analysis."
      persistent-hint
    />
    <v-text-field
      v-if="showSegregationInput"
      v-model="segregation"
      label="Segregation probability (optional)"
      type="number"
      min="0"
      max="1"
      step="0.01"
      variant="outlined"
      :rules="segregationRules"
      id="segregation-probability-input"
      hint="Enter 0 to 1. If unknown, leave blank: the inheritance score receives a 20% penalty."
      persistent-hint
    />
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      role="alert"
      >{{ error }}</v-alert
    >
    <v-btn
      type="submit"
      color="primary"
      variant="flat"
      min-height="48"
      append-icon="mdi-arrow-right"
      >Calculate score</v-btn
    >
    <div class="form-examples">
      <h3>Try an example</h3>
      <div class="example-list">
        <router-link
          v-for="example in examples"
          :key="example.label"
          :to="example.to"
        >
          <span>{{ example.label }}</span
          ><span class="example-detail">{{ example.detail }}</span>
        </router-link>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  noSegregationPatterns,
  requiresSecondVariant,
} from '@/config/inheritanceConfig';
import {
  validateVariant,
  validateSegregation,
  normalizeVariant,
} from '@/utils/validationUtils';

const router = useRouter();
const route = useRoute();
const scalar = (value, fallback = '') => {
  const item = Array.isArray(value) ? value[0] : value;
  return typeof item === 'string' ? item : fallback;
};
const variantInput = ref(
  scalar(route.query.variant ?? route.params.variantInput),
);
const variantInput2 = ref(
  scalar(route.query.variant2 ?? route.params.variantInput2),
);
const inheritanceOptions = [
  'Denovo',
  'Inherited dominant',
  'Homozygous recessive',
  'X-linked dominant',
  'X-linked recessive',
  'Compound heterozygous (confirmed)',
  'Compound heterozygous (suspected)',
  'Unknown',
];
const initialInheritance = scalar(
  route.query.inheritance ?? route.params.inheritance,
  'Unknown',
);
const inheritance = ref(
  inheritanceOptions.includes(initialInheritance)
    ? initialInheritance
    : 'Unknown',
);
const segregation = ref(
  scalar(route.query.segregation ?? route.params.segregation),
);
const assembly = ref(
  scalar(route.query.assembly ?? route.params.assembly) === 'GRCh37'
    ? 'GRCh37'
    : 'GRCh38',
);
const assemblyOptions = [
  { title: 'GRCh38 / hg38', value: 'GRCh38' },
  { title: 'GRCh37 / hg19', value: 'GRCh37' },
];
const showSegregationInput = computed(
  () => !noSegregationPatterns.includes(inheritance.value),
);
const showSecondVariantInput = computed(() =>
  requiresSecondVariant.includes(inheritance.value),
);
const variantRules = [validateVariant];
const segregationRules = [validateSegregation];
const error = ref(null);
const examples = [
  {
    label: '1-55051215-G-GA',
    detail: 'Inherited dominant · segregation 0.95',
    to: {
      name: 'ScoringView',
      params: { variantInput: '1-55051215-G-GA' },
      query: {
        inheritance: 'Inherited dominant',
        segregation: '0.95',
        assembly: 'GRCh38',
      },
    },
  },
  {
    label: 'PKD1 · NM_001009944.3:c.11935C>T',
    detail: 'Inherited dominant · segregation 0.95',
    to: {
      name: 'ScoringView',
      params: { variantInput: 'NM_001009944.3:c.11935C>T' },
      query: {
        inheritance: 'Inherited dominant',
        segregation: '0.95',
        assembly: 'GRCh38',
      },
    },
  },
  {
    label: 'COL4A5 · NM_033380.3:c.1871G>A',
    detail: 'De novo',
    to: {
      name: 'ScoringView',
      params: { variantInput: 'NM_033380.3:c.1871G>A' },
      query: { inheritance: 'Denovo', assembly: 'GRCh38' },
    },
  },
  {
    label: 'CEP290 · compound heterozygous',
    detail: 'Two variants · GRCh38',
    to: {
      name: 'ScoringView',
      params: { variantInput: '12-88101183-A-G' },
      query: {
        variant2: '12-88077263-G-T',
        inheritance: 'Compound heterozygous (confirmed)',
        segregation: '1',
        assembly: 'GRCh38',
      },
    },
  },
];
const searchScoring = () => {
  error.value = null;
  const first = validateVariant(variantInput.value);
  if (first !== true) {
    error.value = first;
    return;
  }
  if (showSecondVariantInput.value) {
    const second = validateVariant(variantInput2.value);
    if (second !== true) {
      error.value = 'Second variant: ' + second;
      return;
    }
  }
  if (showSegregationInput.value) {
    const result = validateSegregation(segregation.value);
    if (result !== true) {
      error.value = result;
      return;
    }
  }
  const query = {
    inheritance: inheritance.value,
    segregation: showSegregationInput.value
      ? String(segregation.value).trim()
      : '',
    assembly: assembly.value,
  };
  if (showSecondVariantInput.value)
    query.variant2 = normalizeVariant(variantInput2.value);
  router.push({
    name: 'ScoringView',
    params: { variantInput: normalizeVariant(variantInput.value) },
    query,
  });
};
</script>

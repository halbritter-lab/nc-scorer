<script setup>
import StaticContent from '@/components/StaticContent.vue'

const config = {
  title: 'NC-Scorer Methodology',
  sections: [
    {
      header: 'Scoring Components',
      content: `
        <p>NC-Scorer evaluates genetic variants using three main components:</p>
        <ul>
          <li><strong>Nephro Candidate Gene Score:</strong> Evaluates the gene's relevance to kidney function</li>
          <li><strong>Nephro Variant Score:</strong> Assesses the potential impact of specific variants</li>
          <li><strong>Inheritance Score:</strong> Considers inheritance patterns and their significance</li>
        </ul>
      `
    },
    {
      header: 'Scoring Process',
      content: `
        <p>Each component is calculated using specialized algorithms that consider multiple factors:</p>
        <ul>
          <li>Gene expression patterns in kidney tissue</li>
          <li>Known associations with kidney diseases</li>
          <li>Variant characteristics and predicted functional impact</li>
          <li>Inheritance patterns observed in kidney disorders</li>
        </ul>
      `
    },
    {
      header: 'Visual Feedback',
      content: `
        <p>The application provides clear visual feedback through:</p>
        <ul>
          <li>Highlighted key scores with enhanced visual prominence</li>
          <li>Real-time status updates during API operations</li>
          <li>Consistent color coding and visual hierarchies</li>
        </ul>
      `
    }
  ]
}
</script>

<template>
  <StaticContent :config="config" />
</template>

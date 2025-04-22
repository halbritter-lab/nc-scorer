<script setup>
import StaticContent from '@/components/StaticContent.vue'

const config = {
  title: 'About NC-Scorer',
  sections: [
    {
      header: 'Overview',
      content: `
        <p>NC-Scorer is a specialized web application developed by the Halbritter Lab for scoring genetic variants 
        in nephrology candidate genes. It combines multiple scoring criteria to evaluate the potential impact 
        of genetic variations on kidney function.</p>
      `
    },
    {
      header: 'Development Team',
      content: `
        <p>This tool is developed and maintained by the Halbritter Lab team, specializing in 
        genetic research related to kidney diseases. Our work focuses on identifying and 
        evaluating genetic variants that may contribute to kidney disorders.</p>
      `
    },
    {
      header: 'Purpose',
      content: `
        <p>NC-Scorer helps researchers and clinicians evaluate genetic variants by:</p>
        <ul>
          <li>Calculating nephro candidate gene scores</li>
          <li>Assessing variant impact through specialized scoring algorithms</li>
          <li>Evaluating inheritance patterns</li>
          <li>Providing a combined assessment for clinical interpretation</li>
        </ul>
      `
    }
  ]
}
</script>

<template>
  <StaticContent :config="config" />
</template>

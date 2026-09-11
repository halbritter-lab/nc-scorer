<script setup>
import ContentContainer from '@/components/ContentContainer.vue';
</script>

<template>
  <ContentContainer class="methodology-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">NC-Scorer Methodology</h1>
        <p>
          Understand how gene, variant, and inheritance evidence combine to
          prioritize candidate variants in kidney disease research.
        </p>
      </div>
      <router-link class="page-header-link" to="/">Score a variant</router-link>
    </header>

    <div class="methodology-content">
      <section aria-labelledby="calculation-heading">
        <h2 id="calculation-heading">How the score is calculated</h2>
        <p>
          The Nephro Candidate Score (NCS) combines three components on a scale
          from 0 to 10. Gene and variant evidence each contribute up to four
          points; inheritance evidence contributes up to two.
        </p>
        <div class="equation-block">
          <p class="equation-label">Nephro Candidate Score · 0–10</p>
          <p class="score-equation">
            <span>NCS = (Gene score × 4)</span>
            <span> + (Variant score × 4)</span>
            <span> + (Inheritance score × 2)</span>
          </p>
        </div>
        <dl class="component-list">
          <div>
            <dt>Gene score <span>× 4</span></dt>
            <dd>
              The Nephro Candidate Gene Score evaluates the gene's relevance to
              kidney function.
            </dd>
          </div>
          <div>
            <dt>Variant score <span>× 4</span></dt>
            <dd>
              The Nephro Variant Score assesses the potential impact of a
              specific variant.
            </dd>
          </div>
          <div>
            <dt>Inheritance score <span>× 2</span></dt>
            <dd>
              The inheritance score considers the inheritance pattern and
              available segregation evidence.
            </dd>
          </div>
        </dl>
        <p class="method-note">
          Each component is scored from 0 to 1. Missing or invalid component
          scores leave the combined score unavailable.
        </p>
      </section>

      <section aria-labelledby="priority-heading">
        <h2 id="priority-heading">Interpreting the result</h2>
        <p>
          Use the priority tier alongside the underlying evidence. The score
          supports research prioritization; it is not a calibrated probability
          of causality.
        </p>
        <table class="priority-table">
          <caption>
            Nephro Candidate Score priority tiers
          </caption>
          <thead>
            <tr>
              <th scope="col">NCS range</th>
              <th scope="col">Priority</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>0 ≤ NCS &lt; 3</td>
              <td>Low priority</td>
            </tr>
            <tr>
              <td>3 ≤ NCS &lt; 7</td>
              <td>Moderate priority</td>
            </tr>
            <tr>
              <td>7 ≤ NCS ≤ 10</td>
              <td>High priority</td>
            </tr>
          </tbody>
        </table>
        <p class="method-note">
          Results show the component scores and priority label together. Color
          supports these labels, and status updates show when evidence is still
          loading.
        </p>
      </section>

      <section id="segregation-section" aria-labelledby="segregation-heading">
        <h2 id="segregation-heading">When segregation data is missing</h2>
        <p>
          When segregation is expected but missing, the inheritance score is
          multiplied by 0.8 (a 20% reduction). This adjustment applies only to
          the inheritance component, before its × 2 contribution is added to the
          combined score.
        </p>
        <p>
          De novo, unknown, and suspected compound heterozygous patterns do not
          receive this missing-data penalty. Zero is a valid segregation input,
          not missing data.
        </p>
      </section>

      <section aria-labelledby="evidence-heading">
        <h2 id="evidence-heading">What contributes to the evidence</h2>
        <p>
          Each component is calculated using specialized algorithms that
          consider multiple factors:
        </p>
        <ul>
          <li>Gene expression patterns in kidney tissue</li>
          <li>Known associations with kidney diseases</li>
          <li>Variant characteristics and predicted functional impact</li>
          <li>Inheritance patterns observed in kidney disorders</li>
        </ul>
      </section>
    </div>
  </ContentContainer>
</template>

<style scoped>
.methodology-content {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px 40px;
  line-height: 1.65;
}
.methodology-content section:first-child,
.methodology-content section:last-child {
  grid-column: 1 / -1;
}
.methodology-content section + section {
  padding-top: 32px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.methodology-content h2 {
  margin: 0 0 12px;
  font-size: 1.25rem;
  font-weight: 650;
  line-height: 1.4;
}
.methodology-content p,
.methodology-content ul {
  max-width: 72ch;
}
.methodology-content p + p {
  margin-top: 12px;
}
.equation-block {
  margin: 24px 0;
  padding: 20px 24px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
}
.equation-label,
.method-note {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.95rem;
}
.score-equation {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: 1.125rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.component-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin: 0 0 20px;
}
.component-list dt {
  margin-bottom: 6px;
  font-weight: 650;
}
.component-list dt span {
  margin-left: 4px;
  color: rgb(var(--v-theme-primary));
}
.component-list dd {
  margin: 0;
  color: rgb(var(--v-theme-on-surface-variant));
}
.priority-table {
  width: 100%;
  margin: 20px 0;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.priority-table caption {
  margin-bottom: 8px;
  text-align: left;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.95rem;
}
.priority-table th,
.priority-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.priority-table th {
  font-weight: 650;
  background: rgb(var(--v-theme-surface));
}
.methodology-content ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 24px;
  max-width: none;
  margin-top: 12px;
  padding-inline-start: 24px;
}
@media (max-width: 900px) {
  .methodology-content {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .component-list,
  .methodology-content ul {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .equation-block {
    padding: 20px 16px;
  }
  .priority-table th,
  .priority-table td {
    padding: 12px;
  }
}
</style>

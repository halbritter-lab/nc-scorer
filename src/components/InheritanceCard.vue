<template>
  <v-card class="scoring-params-card">
    <v-card-title>Inheritance</v-card-title>
    <v-card-text>
      <v-table class="summary-table">
        <tbody>
          <tr>
            <td class="info-col">
              <strong>Inheritance Pattern:</strong>
              <v-tooltip activator="parent" location="start">
                The mode of inheritance used in scoring.
              </v-tooltip>
            </td>
            <td class="value-col">
              <span>{{ inheritance }}</span>
            </td>
          </tr>
          <tr>
            <td class="info-col">
              <strong>Segregation Probability:</strong>
              <v-tooltip activator="parent" location="start">
                The probability of segregation (value between 0 and 1).
              </v-tooltip>
            </td>
            <td class="value-col">
              <span>{{ segregation }}</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script>
/**
 * InheritanceCard displays the inheritance pattern and segregation probability.
 *
 * @component
 * @prop {String} inheritance - The selected inheritance pattern.
 * @prop {String} segregation - The selected segregation probability.
 */
export default {
  name: 'InheritanceCard',
  props: {
    inheritance: {
      type: String,
      required: true,
    },
    segregation: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped>
.scoring-params-card {
  max-width: 600px;
  margin-bottom: 16px;
  padding: 16px;
}
.summary-table {
  width: 100%;
}
.info-col {
  width: 40%;
  vertical-align: top;
}
.value-col {
  width: 60%;
  vertical-align: top;
}
</style>

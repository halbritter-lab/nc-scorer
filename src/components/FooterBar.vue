<!-- components/FooterBar.vue -->

<template>
  <v-footer app padless class="elevation-3">
    <v-row justify="center" no-gutters>
      <v-col cols="auto" v-for="link in footerLinks" :key="link.text">
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              icon
              :href="link.href"
              target="_blank"
              text
              v-bind="props"
              min-width="48px"
              min-height="48px"
              :aria-label="link.text || 'External link'"
              class="footer-icon-btn"
            >
              <v-icon>{{ link.icon }}</v-icon>
            </v-btn>
          </template>
          <span>{{ link.text }}</span>
        </v-tooltip>
      </v-col>
    </v-row>
  </v-footer>
</template>

<script>
import { ref, onMounted } from 'vue';
import footerConfig from '../config/footerConfig.json'; // Adjust the path to your config file

export default {
  name: 'FooterBar',
  setup() {
    const footerLinks = ref(footerConfig.links);

    onMounted(() => {
      // Perform any additional setup after component has mounted
      // For example, you could fetch the footer configuration from an API if needed
    });

    return {
      footerLinks,
    };
  },
};
</script>

<style scoped>
/* Footer icon button styles for better touch targets */
.footer-icon-btn {
  margin: 0 6px; /* Add horizontal spacing between buttons */
  padding: 12px; /* Increase padding to improve the touch target size */
}

/* Ensure icons are properly sized */
.v-icon {
  font-size: 24px; /* Standardize icon size */
}
</style>

<template>
  <v-alert
    v-if="!isPreprintBannerDismissed"
    border="start"
    variant="tonal"
    color="info"
    closable
    @click:close="dismissBanner"
    class="preprint-banner"
    elevation="4"
  >
    <template v-slot:prepend>
      <v-icon size="large">mdi-newspaper-variant-outline</v-icon>
    </template>

    <template v-slot:title>
      <div class="d-flex align-center flex-wrap">
        <v-chip
          size="small"
          color="primary"
          variant="flat"
          class="mr-2 mb-1"
          prepend-icon="mdi-new-box"
        >
          NEW
        </v-chip>
        <span class="text-subtitle-1 font-weight-bold">
          Preprint on medRxiv
        </span>
      </div>
    </template>

    <template v-slot:text>
      <div class="mt-1">
        <p class="text-body-2 mb-1">
          <strong>Automatic variant prioritization in suspected genetic kidney disease using the Nephro Candidate Score (N-CS)</strong>
        </p>
        <p class="text-caption mb-1 text-medium-emphasis">
          Nina Rank, Sören Lukassen, Manuel Anderegg, Kai-Uwe Eckardt, Jan Halbritter, Bernt Popp
        </p>
        <p class="text-caption mb-2">
          <a
            href="https://doi.org/10.1101/2025.09.29.25336840"
            target="_blank"
            rel="noopener noreferrer"
            class="doi-link"
            @click="trackDoiClick"
          >
            <span class="text-medium-emphasis">doi:</span> 10.1101/2025.09.29.25336840
          </a>
        </p>
      </div>
    </template>
  </v-alert>
</template>

<script setup>
import { ref } from 'vue';
import { logService } from '@/services/logService';

const isPreprintBannerDismissed = ref(false);

const dismissBanner = () => {
  isPreprintBannerDismissed.value = true;
  logService.info('Preprint banner dismissed by user');
};

const trackDoiClick = () => {
  logService.info('User clicked DOI link to read preprint', {
    doi: '10.1101/2025.09.29.25336840'
  });
};
</script>

<style scoped>
.preprint-banner {
  position: fixed;
  bottom: 64px; /* Above the footer which is typically 64px */
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 1200px;
  z-index: 999;
  margin: 0 16px;
  border-left-width: 4px !important;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .preprint-banner {
    width: calc(100% - 16px);
    margin: 0 8px;
    bottom: 56px; /* Adjust for smaller footer on mobile */
  }
}

/* Smooth close button animation */
.preprint-banner :deep(.v-alert__close) {
  transition: transform 0.2s ease;
}

.preprint-banner :deep(.v-alert__close):hover {
  transform: rotate(90deg);
}

/* DOI link styling */
.doi-link {
  color: inherit;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.doi-link:hover {
  text-decoration: underline;
  opacity: 0.8;
}
</style>

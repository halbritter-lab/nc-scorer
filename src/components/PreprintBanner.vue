<template>
  <v-alert
    v-if="isHomeRoute && !isPreprintBannerDismissed"
    border="start"
    variant="flat"
    color="primary-darken-1"
    closable
    close-label="Dismiss preprint banner"
    @click:close="dismissBanner"
    class="preprint-banner"
    elevation="4"
    role="region"
    aria-label="Preprint announcement"
  >
    <template v-slot:prepend>
      <v-icon size="large" color="primary-lighten-1">mdi-newspaper-variant-outline</v-icon>
    </template>

    <template v-slot:title>
      <div class="d-flex align-center flex-wrap">
        <v-chip
          size="small"
          color="secondary"
          variant="flat"
          class="mr-2 mb-1 text-uppercase font-weight-bold"
          prepend-icon="mdi-new-box"
        >
          NEW
        </v-chip>
        <span class="text-subtitle-1 font-weight-bold banner-title">
          Preprint on medRxiv
        </span>
      </div>
    </template>

    <template v-slot:text>
      <div class="mt-1 banner-body">
        <p class="text-body-2 mb-1 banner-headline">
          <strong>Automatic variant prioritization in suspected genetic kidney disease using the Nephro Candidate Score (N-CS)</strong>
        </p>
        <p class="text-caption mb-1 banner-authors">
          Nina Rank, Sören Lukassen, Manuel Anderegg, Kai-Uwe Eckardt, Jan Halbritter, Bernt Popp
        </p>
        <p class="text-caption mb-2">
          <a
            href="https://doi.org/10.1101/2025.09.29.25336840"
            target="_blank"
            rel="noopener noreferrer"
            class="doi-link"
            @click="trackDoiClick"
            aria-label="Read preprint on medRxiv with DOI 10.1101/2025.09.29.25336840"
          >
            <span class="doi-prefix">doi:</span> 10.1101/2025.09.29.25336840
          </a>
        </p>
      </div>
    </template>
  </v-alert>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { logService } from '@/services/logService';

const route = useRoute();
const STORAGE_KEY = 'nc_scorer_preprint_banner_dismissed';

const isPreprintBannerDismissed = ref(
  typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) === 'true' : false
);

// Route Scoping: Strictly isolate to entry/home route ('/')
const isHomeRoute = computed(() => {
  return route ? route.path === '/' : true;
});

const dismissBanner = () => {
  isPreprintBannerDismissed.value = true;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore localStorage write errors in private browsing
    }
  }
  logService.info('Preprint banner dismissed by user');
};

const trackDoiClick = () => {
  logService.info('User clicked DOI link to read preprint', {
    doi: '10.1101/2025.09.29.25336840',
  });
};
</script>

<style scoped>
.preprint-banner {
  position: fixed;
  bottom: 64px; /* Above the footer */
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 1200px;
  z-index: 999;
  margin: 0 16px;
  border-left: 5px solid #38bdf8 !important;
  background-color: #0f172a !important;
  color: #f8fafc !important;
  opacity: 1 !important;
  backdrop-filter: none !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5) !important;
}

:deep(.v-theme--light) .preprint-banner,
.v-theme--light .preprint-banner {
  background-color: #ffffff !important;
  color: #0f172a !important;
  border-left: 5px solid #0284c7 !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
}

.banner-title {
  letter-spacing: 0.01em;
}

.banner-headline {
  color: inherit;
  line-height: 1.4;
}

.banner-authors {
  color: #cbd5e1;
}

:deep(.v-theme--light) .banner-authors,
.v-theme--light .banner-authors {
  color: #334155;
}

/* Accessible touch target for close button (min 44x44px) */
.preprint-banner :deep(.v-alert__close) {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -4px;
}

.preprint-banner :deep(.v-alert__close .v-btn) {
  min-width: 44px;
  min-height: 44px;
  transition: transform 0.2s ease;
}

.preprint-banner :deep(.v-alert__close .v-btn:hover) {
  transform: rotate(90deg);
}

/* High contrast DOI link styling (WCAG 2.1 AAA) */
.doi-link {
  color: #38bdf8;
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 4px 0;
}

:deep(.v-theme--light) .doi-link,
.v-theme--light .doi-link {
  color: #0369a1;
}

.doi-link:hover {
  text-decoration: underline;
  filter: brightness(1.15);
}

.doi-prefix {
  font-weight: 500;
  margin-right: 4px;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .preprint-banner {
    width: calc(100% - 16px);
    margin: 0 8px;
    bottom: 56px;
  }
}
</style>

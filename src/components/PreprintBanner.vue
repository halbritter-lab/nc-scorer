<template>
  <aside
    v-if="isHomeRoute && !isPreprintBannerDismissed"
    class="preprint-banner"
    aria-label="Preprint announcement"
  >
    <div>
      <h2>Preprint on medRxiv</h2>
      <p>
        Automatic variant prioritization in suspected genetic kidney disease
        using the Nephro Candidate Score (N-CS)
      </p>
      <a
        href="https://doi.org/10.1101/2025.09.29.25336840"
        target="_blank"
        rel="noopener noreferrer"
        @click="trackDoiClick"
        >Read the preprint · 10.1101/2025.09.29.25336840</a
      >
    </div>
    <v-btn
      icon="mdi-close"
      variant="text"
      aria-label="Dismiss preprint banner"
      @click="dismissBanner"
    />
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { logService } from '@/services/logService';

const route = useRoute();
const STORAGE_KEY = 'nc_scorer_preprint_banner_dismissed';

function loadDismissal() {
  try {
    return (
      typeof window !== 'undefined' &&
      localStorage.getItem(STORAGE_KEY) === 'true'
    );
  } catch {
    return false;
  }
}

const isPreprintBannerDismissed = ref(loadDismissal());

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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-top: 24px;
}
.preprint-banner h2 {
  font-size: 1rem;
  font-weight: 650;
  margin-bottom: 8px;
}
.preprint-banner p {
  max-width: 75ch;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.95rem;
  line-height: 1.6;
}
.preprint-banner a {
  display: inline-block;
  padding: 12px 0;
  min-height: 44px;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}
</style>

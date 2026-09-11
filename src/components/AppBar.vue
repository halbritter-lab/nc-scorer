<template>
  <v-app-bar color="surface" flat class="app-header" height="72">
    <div class="header-inner">
      <router-link to="/" class="brand" aria-label="NC-Scorer home">
        <img
          src="/img/logo.webp"
          width="40"
          height="40"
          alt=""
          class="app-logo"
        />
        <span>NC-Scorer</span>
      </router-link>
      <nav class="desktop-navigation menu-items" aria-label="Main navigation">
        <v-btn to="/" exact variant="text">Score a variant</v-btn>
        <v-btn
          v-for="item in menuItems"
          :key="item.text"
          :to="item.to"
          :href="item.href"
          :target="item.target"
          :rel="item.target === '_blank' ? 'noopener noreferrer' : undefined"
          :aria-label="
            item.target === '_blank'
              ? `${item.text} (opens in a new tab)`
              : undefined
          "
          variant="text"
          >{{ item.text }}</v-btn
        >
      </nav>
      <div class="header-actions">
        <v-btn
          :icon="darkTheme ? 'mdi-white-balance-sunny' : 'mdi-weather-night'"
          variant="text"
          class="theme-toggle"
          :aria-label="
            darkTheme ? 'Switch to light theme' : 'Switch to dark theme'
          "
          @click="toggleTheme"
        />
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-menu"
              variant="text"
              aria-label="Open navigation and settings"
            />
          </template>
          <v-list min-width="250" aria-label="Navigation and settings">
            <v-list-item to="/" title="Score a variant" />
            <v-list-item
              v-for="item in menuItems"
              :key="item.text"
              :to="item.to"
              :href="item.href"
              :target="item.target"
              :rel="
                item.target === '_blank' ? 'noopener noreferrer' : undefined
              "
              :aria-label="
                item.target === '_blank'
                  ? `${item.text} (opens in a new tab)`
                  : undefined
              "
              :title="item.text"
              :prepend-icon="item.icon"
            />
            <v-divider class="my-2" />
            <v-list-item
              :title="cacheEnabled ? 'API cache enabled' : 'API cache disabled'"
              :prepend-icon="
                cacheEnabled ? 'mdi-database-check' : 'mdi-database-off'
              "
              @click="toggleCacheEnabled"
            />
            <v-list-item
              title="Take a tour"
              prepend-icon="mdi-compass"
              class="tour-button"
              @click="startTour"
            />
            <v-list-item
              :title="'Copy citation · v' + version"
              prepend-icon="mdi-content-copy"
              @click="copyCitation"
            />
          </v-list>
        </v-menu>
      </div>
    </div>
  </v-app-bar>
</template>

<script setup>
import packageInfo from '../../package.json';
import menuConfig from '@/config/menuConfig.json';
import useThemeToggle from '@/composables/useThemeToggle';
import { useCacheSettings } from '@/composables/useCacheSettings';
import useTour from '@/composables/useTour';
import { useNotifications } from '@/composables/useNotifications';

const { darkTheme, toggleTheme } = useThemeToggle();
const { cacheEnabled, toggleCacheEnabled } = useCacheSettings();
const { startTour } = useTour();
const { notifySuccess, notifyError } = useNotifications();
const menuItems = menuConfig.items;
const version = packageInfo.version;
const copyCitation = async () => {
  const citation = `Rank N, Lukassen S, Anderegg MA, Eckardt KU, Halbritter JP, Popp B. Automatic variant prioritization in suspected genetic kidney disease using the Nephro Candidate Score (N-CS). medRxiv 2025. doi:10.1101/2025.09.29.25336840. NC-Scorer (v${version}, https://nc-scorer.kidney-genetics.org/).`;
  try {
    await navigator.clipboard.writeText(citation);
    notifySuccess('Citation copied to clipboard.');
  } catch {
    notifyError(
      'Could not copy the citation. Find it in the documentation under Citation.',
    );
  }
};
</script>

<style scoped>
.app-header {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.header-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 1200px;
  margin: auto;
  padding: 0 24px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 1.25rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}
.desktop-navigation {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.header-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
}
@media (max-width: 800px) {
  .desktop-navigation {
    display: none;
  }
  .header-inner {
    padding: 0 16px;
    gap: 8px;
  }
}
</style>

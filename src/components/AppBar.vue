<!-- components/AppBar.vue -->
<template>
  <v-app-bar app color="teal" dark>
    <!-- Left Spacer for Centering -->
    <v-spacer></v-spacer>

    <!-- App Logo, Title and Navigation Group (Centered) -->
    <div class="d-flex align-center centered-content">
      <!-- Logo Image with Easter Egg Tooltip -->
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-img
            :src="logoPath"
            class="app-logo mr-3"
            contain
            max-height="48"
            max-width="48"
            @click="navigateHome"
            v-bind="props"
          ></v-img>
        </template>
        <span>Find the nephro candidate gene in the beanstack</span>
      </v-tooltip>

      <!-- Toolbar Title and Version Info -->
      <v-toolbar-title class="mr-6">
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <span class="clickable" v-bind="props" @click="navigateHome"> NC-Scorer </span>
          </template>
          <span>Go to Home</span>
        </v-tooltip>
        <br />
        <!-- Line break for version info -->
        <span
          class="version-info"
          @mouseenter="showCopyIcon = true"
          @mouseleave="showCopyIcon = false"
        >
          Version: {{ version }} - Commit: {{ lastCommitHash }}
          <v-icon v-if="showCopyIcon" @click="copyCitation"> mdi-content-copy </v-icon>
        </span>
      </v-toolbar-title>

      <!-- Navigation Menu Items -->
      <div class="menu-items">
        <template v-for="item in menuItems" :key="item.text">
          <v-menu offset-y v-if="item.children">
            <template v-slot:activator="{ props }">
              <v-btn text v-bind="props" class="mx-1">
                <v-icon left v-if="item.icon">{{ item.icon }}</v-icon>
                {{ item.text }}
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="childItem in item.children"
                :key="childItem.text"
                :to="childItem.to"
              >
                <v-list-item-title>
                  <v-icon v-if="childItem.icon">
                    {{ childItem.icon }}
                  </v-icon>
                  {{ childItem.text }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-tooltip location="bottom" v-else>
            <template v-slot:activator="{ props }">
              <v-btn :to="item.to" text v-bind="props" class="mx-1">
                <v-icon left v-if="item.icon">{{ item.icon }}</v-icon>
                {{ item.text }}
              </v-btn>
            </template>
            <span>{{ item.tooltip || item.text }}</span>
          </v-tooltip>
        </template>

        <!-- Cache Toggle Button -->
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" @click="toggleCacheEnabled" class="ml-2">
              <v-icon>
                {{ cacheEnabled ? 'mdi-database-check' : 'mdi-database-off' }}
              </v-icon>
            </v-btn>
          </template>
          <span>{{ cacheEnabled ? 'Disable API Cache' : 'Enable API Cache' }}</span>
        </v-tooltip>

        <!-- Theme Toggle Button -->
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" @click="toggleTheme" class="ml-2 theme-toggle">
              <v-icon>
                {{ darkTheme ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}
              </v-icon>
            </v-btn>
          </template>
          <span>Toggle {{ darkTheme ? 'Light' : 'Dark' }} Theme</span>
        </v-tooltip>
        <!-- Tour Button -->
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" @click="startTour" class="ml-2 tour-button">
              <v-icon>mdi-compass</v-icon>
            </v-btn>
          </template>
          <span>Start Tour</span>
        </v-tooltip>
      </div>
    </div>

    <!-- Right Spacer for Centering -->
    <v-spacer></v-spacer>
  </v-app-bar>

  <!-- Snackbar for feedback -->
  <v-snackbar v-model="snackbarVisible" :timeout="snackbarTimeout" :color="snackbarColor">
    {{ snackbarMessage }}
  </v-snackbar>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import packageInfo from '../../package.json';
import appConfig from '../config/appConfig.json';
import menuConfig from '../config/menuConfig.json';
import { fetchLastCommit } from '@/api/github.js'; // Adjust the path as needed
import useThemeToggle from '@/composables/useThemeToggle.js';
import { useCacheSettings } from '@/composables/useCacheSettings.js';
import useTour from '@/composables/useTour.js';

export default {
  name: 'AppBar',
  setup() {
    const router = useRouter();
    // Use the theme toggle, cache settings, and tour composables
    const { darkTheme, toggleTheme } = useThemeToggle();
    const { cacheEnabled, toggleCacheEnabled } = useCacheSettings();
    const { startTour } = useTour();
    const version = packageInfo.version;
    const lastCommitHash = ref('loading...');
    const fetchError = ref(false);

    // Snackbar data properties
    const snackbarVisible = ref(false);
    const snackbarMessage = ref('');
    const snackbarTimeout = 6000;
    const snackbarColor = ref('success');
    const showCopyIcon = ref(false);

    // Navigation helper method
    const navigateHome = () => {
      router.push('/');
    };

    // Method to copy citation to the clipboard
    const copyCitation = () => {
      const citation = `NC-scorer, Version: ${version} - Commit: ${lastCommitHash.value}, an open-source platform designed for the curation and management of genetic information. Code available at https://github.com/halbritter-lab/nc-scorer (accessed ${new Date().toISOString().split('T')[0]}).`;
      navigator.clipboard
        .writeText(citation)
        .then(() => {
          snackbarMessage.value = 'Citation copied to clipboard!';
          snackbarVisible.value = true;
        })
        .catch((error) => {
          console.error('Error copying citation:', error);
          snackbarMessage.value = 'Error copying citation!';
          snackbarVisible.value = true;
        });
    };

    // On mount: fetch last commit hash using the github.js module
    onMounted(async () => {
      try {
        lastCommitHash.value = await fetchLastCommit(appConfig.repoName);
      } catch (error) {
        console.error('Error fetching last commit:', error);
        fetchError.value = true;
        lastCommitHash.value = 'offline';
      }
    });

    // Computed property for menu items
    const menuItems = computed(() => menuConfig.items);

    // Compute logo path with absolute URL to prevent issues during navigation
    const logoPath = computed(() => {
      // Use import.meta.env.BASE_URL for Vite, or fallback to process.env
      const baseUrl = import.meta.env.BASE_URL || process.env.BASE_URL || '/';
      // Ensure the path always starts with the base URL
      return `${baseUrl}img/logo.png`.replace(/\/\//g, '/');
    });

    return {
      darkTheme,
      toggleTheme,
      cacheEnabled,
      toggleCacheEnabled,
      menuItems,
      version,
      lastCommitHash,
      snackbarVisible,
      snackbarMessage,
      snackbarTimeout,
      snackbarColor,
      copyCitation,
      showCopyIcon,
      navigateHome,
      logoPath,
      startTour,
    };
  },
};
</script>

<style scoped>
/* Keyframes for fadeIn animation */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Keyframes for pulse animation */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Styles for the application logo */
.app-logo {
  max-width: 92px;
  margin-right: 10px;
  animation: fadeIn 2s ease-out forwards;
}

/* Hover effect for the application logo */
.app-logo:hover {
  animation: pulse 2s infinite;
  cursor: pointer;
}

/* Hover effect for clickable elements in the toolbar */
.clickable:hover {
  opacity: 0.8;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

/* Styles for the version info */
.version-info {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin-top: -10px;
  white-space: nowrap;
}

/* Centered content container */
.centered-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Menu items container */
.menu-items {
  display: flex;
  align-items: center;
}

/* Show the copy icon when hovering over the version info */
.version-info:hover v-icon {
  display: block;
}

/* Styles for the copy icon */
.version-info v-icon {
  display: none;
}
</style>

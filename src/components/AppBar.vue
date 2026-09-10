<!-- components/AppBar.vue -->
<template>
  <v-app-bar app color="teal-darken-3" class="elevation-2">
    <!-- Left Spacer for Centering -->
    <v-spacer></v-spacer>

    <!-- App Logo, Title and Navigation Group (Centered) -->
    <div class="d-flex align-center centered-content">
      <!-- Logo Image with Easter Egg Tooltip -->
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-img
            :src="logoPathWebp"
            class="app-logo mr-3"
            contain
            max-height="48"
            max-width="48"
            @click="navigateHome"
            v-bind="props"
            alt="NC-Scorer Logo"
            width="48"
            height="48"
            :srcset="logoSrcset"
            loading="eager"
          >
            <template v-slot:placeholder>
              <v-img
                :src="logoPathPng"
                class="app-logo-fallback"
                width="48"
                height="48"
                alt="NC-Scorer Logo"
              ></v-img>
            </template>
          </v-img>
        </template>
        <span>Find the nephro candidate gene in the beanstack</span>
      </v-tooltip>

      <!-- Toolbar Title and Version Info -->
      <v-toolbar-title class="mr-6">
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <span
              class="clickable font-weight-bold py-1 px-1"
              v-bind="props"
              @click="navigateHome"
              role="button"
              tabindex="0"
              @keydown.enter="navigateHome"
              aria-label="NC-Scorer - Return to home"
            >
              NC-Scorer
            </span>
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
          <v-btn
            v-if="showCopyIcon"
            icon="mdi-content-copy"
            size="small"
            variant="text"
            @click="copyCitation"
            aria-label="Copy Citation"
            class="ml-1 copy-citation-btn"
            min-height="44"
            min-width="44"
          ></v-btn>
        </span>
      </v-toolbar-title>

      <!-- Navigation Menu Items -->
      <div class="menu-items">
        <template v-for="item in menuItems" :key="item.text">
          <v-menu offset-y v-if="item.children">
            <template v-slot:activator="{ props }">
              <v-btn
                variant="text"
                v-bind="props"
                class="mx-1 app-nav-btn"
                min-height="44"
                min-width="44"
              >
                <v-icon left v-if="item.icon">{{ item.icon }}</v-icon>
                {{ item.text }}
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="childItem in item.children"
                :key="childItem.text"
                :to="childItem.to"
                min-height="44"
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
              <v-btn 
                :to="item.to" 
                :href="item.href"
                :target="item.href ? '_blank' : undefined"
                variant="text" 
                v-bind="props" 
                class="mx-1 app-nav-btn"
                min-height="44"
                min-width="44"
              >
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
            <v-btn
              icon
              v-bind="props"
              @click="toggleCacheEnabled"
              class="ml-2 app-icon-btn"
              min-height="44"
              min-width="44"
              aria-label="Toggle API Cache"
            >
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
            <v-btn
              icon
              v-bind="props"
              @click="toggleTheme"
              class="ml-2 theme-toggle app-icon-btn"
              min-height="44"
              min-width="44"
              aria-label="Toggle Theme"
            >
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
            <v-btn
              icon
              v-bind="props"
              @click="startTour"
              class="ml-2 tour-button app-icon-btn"
              min-height="44"
              min-width="44"
              aria-label="Start Interactive Tour"
            >
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

</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { logService } from '@/services/logService';
import packageInfo from '../../package.json';
import appConfig from '../config/appConfig.json';
import menuConfig from '../config/menuConfig.json';
import { fetchLastCommit } from '@/api/github.js'; // Adjust the path as needed
import useThemeToggle from '@/composables/useThemeToggle.js';
import { useCacheSettings } from '@/composables/useCacheSettings.js';
import useTour from '@/composables/useTour.js';
import { useNotifications } from '@/composables/useNotifications.js';

export default {
  name: 'AppBar',
  setup() {
    const router = useRouter();
    // Use the theme toggle, cache settings, tour, and notifications composables
    const { darkTheme, toggleTheme } = useThemeToggle();
    const { cacheEnabled, toggleCacheEnabled } = useCacheSettings();
    const { startTour } = useTour();
    const { notifySuccess, notifyError } = useNotifications();
    const version = packageInfo.version;
    const lastCommitHash = ref('loading...');
    const fetchError = ref(false);
    const showCopyIcon = ref(false);

    // Navigation helper method
    const navigateHome = () => {
      router.push('/');
    };

    // Method to copy citation to the clipboard
    const copyCitation = () => {
      const citation = `Rank N, Lukassen S, Anderegg MA, Eckardt KU, Halbritter JP, Popp B. Automatic variant prioritization in suspected genetic kidney disease using the Nephro Candidate Score (N-CS). medRxiv 2025. doi:10.1101/2025.09.29.25336840. NC-Scorer (v${version}, Commit: ${lastCommitHash.value}, https://nc-scorer.kidney-genetics.org/).`;
      navigator.clipboard
        .writeText(citation)
        .then(() => {
          notifySuccess('Citation copied to clipboard!');
        })
        .catch((error) => {
          logService.error('Error copying citation:', error);
          notifyError('Error copying citation!');
        });
    };

    // On mount: fetch last commit hash using the github.js module
    onMounted(async () => {
      try {
        lastCommitHash.value = await fetchLastCommit(appConfig.repoName);
      } catch (error) {
        logService.error('Error fetching last commit:', error);
        fetchError.value = true;
        lastCommitHash.value = 'offline';
      }
    });

    // Computed property for menu items
    const menuItems = computed(() => menuConfig.items);

    // Compute optimized logo paths with absolute URLs
    const getAssetPath = (filename) => {
      // Use import.meta.env.BASE_URL for Vite, or fallback to process.env
      const baseUrl = import.meta.env.BASE_URL || process.env.BASE_URL || '/';
      // Ensure the path always starts with the base URL
      return `${baseUrl}img/${filename}`.replace(/\/\//g, '/');
    };
    
    const logoPathWebp = computed(() => getAssetPath('logo.webp'));
    const logoPathPng = computed(() => getAssetPath('logo-96.png'));
    
    // Create srcset for responsive images
    const logoSrcset = computed(() => {
      return `${logoPathWebp.value} 1x, ${logoPathWebp.value} 2x`;
    });

    return {
      darkTheme,
      toggleTheme,
      cacheEnabled,
      toggleCacheEnabled,
      menuItems,
      version,
      lastCommitHash,
      copyCitation,
      showCopyIcon,
      navigateHome,
      logoPathWebp,
      logoPathPng,
      logoSrcset,
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
  max-width: 48px;
  max-height: 48px;
  margin-right: 10px;
  animation: fadeIn 2s ease-out forwards;
}

/* Fallback logo styles */
.app-logo-fallback {
  max-width: 48px;
  max-height: 48px;
}

/* Hover effect for the application logo */
.app-logo:hover {
  animation: pulse 2s infinite;
  cursor: pointer;
}

/* Clickable elements in the toolbar */
.clickable {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.clickable:hover {
  opacity: 0.9;
}

.app-nav-btn {
  min-height: 44px !important;
  min-width: 44px !important;
}

.app-icon-btn {
  min-height: 44px !important;
  min-width: 44px !important;
}

.copy-citation-btn {
  min-width: 44px !important;
  min-height: 44px !important;
}

/* Styles for the version info */
.version-info {
  display: inline-flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.8rem;
  margin-top: -6px;
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

<!-- components/AppBar.vue -->
<template>
  <v-app-bar app color="teal" dark>
    <!-- Logo Image -->
    <v-img
      src="img/logo.png"
      class="mx-3 app-logo"
      contain
      max-height="48"
      max-width="48"
      @click="navigateHome"
    ></v-img>

    <!-- Toolbar Title and Version Info -->
    <v-toolbar-title>
      <span class="clickable" @click="navigateHome">
        NC-Scorer
      </span>
      <br>
      <!-- Line break for version info -->
      <span
        class="version-info"
        @mouseenter="showCopyIcon = true"
        @mouseleave="showCopyIcon = false"
      >
        Version: {{ version }} - Commit: {{ lastCommitHash }}
        <v-icon v-if="showCopyIcon" @click="copyCitation">
          mdi-content-copy
        </v-icon>
      </span>
    </v-toolbar-title>

    <!-- Dynamic Menu Items with Nested Dropdowns -->
    <template v-for="item in menuItems" :key="item.text">
      <v-menu offset-y v-if="item.children">
        <template v-slot:activator="{ props }">
          <v-btn text v-bind="props">
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
      <v-btn :to="item.to" text v-else>
        <v-icon left v-if="item.icon">{{ item.icon }}</v-icon>
        {{ item.text }}
      </v-btn>
    </template>

    <!-- Theme Toggle Button -->
    <v-btn icon @click="toggleTheme">
      <v-icon>
        {{ darkTheme ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}
      </v-icon>
    </v-btn>
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

export default {
  name: 'AppBar',
  setup() {
    const router = useRouter();
    // Use the theme toggle composable
    const { darkTheme, toggleTheme } = useThemeToggle();
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

    return {
      darkTheme,
      toggleTheme,
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
  margin-left: auto;
  padding-right: 16px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin-top: -10px;
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

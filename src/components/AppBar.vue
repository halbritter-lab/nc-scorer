<!-- components/AppBar.vue -->

<template>
  <v-app-bar app color="primary" dark>
    <!-- Logo Image -->
    <v-img
      src="img/logo.png"
      class="mx-3 app-logo"
      contain
      max-height="48"
      max-width="48"
      @click="$router.push('/')"
    ></v-img>

    <!-- Toolbar Title and Version Info -->
    <v-toolbar-title>
      <span class="clickable" @click="$router.push('/')">
        NC-Scorer
      </span>
      <br> <!-- Line break for version info -->
      <span class="version-info" @mouseenter="showCopyIcon = true" @mouseleave="showCopyIcon = false">
        Version: {{ version }} - Commit: {{ lastCommitHash }}
        <v-icon v-if="showCopyIcon" @click="copyCitation">mdi-content-copy</v-icon>
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
          <v-list-item v-for="childItem in item.children" :key="childItem.text" :to="childItem.to">
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
  <v-snackbar
    v-model="snackbarVisible"
    :timeout="snackbarTimeout"
    :color="snackbarColor"
  >
    {{ snackbarMessage }}
  </v-snackbar>

</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useTheme } from 'vuetify';
import packageInfo from '../../package.json';
import appConfig from '../config/appConfig.json';
import menuConfig from '../config/menuConfig.json';

export default {
  name: 'AppBar',

  /**
   * Component setup function.
   * @returns {Object} The reactive properties and methods for the component.
   */
  setup() {
    const theme = useTheme(); // Reactive property for dark theme state
    const darkTheme = ref(theme.global.current.value.dark);
    const version = packageInfo.version; // Extract the version from the package.json
    const lastCommitHash = ref('loading...'); // Reference for the last commit hash
    const fetchError = ref(false); // Reference for the last commit hash

    // Data properties for snackbar
    const snackbarVisible = ref(false);
    const snackbarMessage = ref('');
    const snackbarTimeout = 6000;
    const snackbarColor = ref('success');
    const showCopyIcon = ref(false);

    // Method to copy citation to clipboard
    const copyCitation = () => {
      const citation = `NC-scorer, Version: ${version} - Commit: ${lastCommitHash.value}, an open-source platform designed for the curation and management of genetic information. Code available at https://github.com/halbritter-lab/nc-scorer (accessed ${new Date().toISOString().split('T')[0]}).`;
      navigator.clipboard.writeText(citation)
        .then(() => {
          snackbarMessage.value = `Citation copied to clipboard!`;
          snackbarVisible.value = true;
        })
        .catch((error) => {
          console.error('Error copying citation:', error);
          snackbarMessage.value = 'Error copying citation!';
          snackbarVisible.value = true;
      })
    };

    /**
     * Toggles the application theme between light and dark.
     */
    const toggleTheme = () => {
      const isDark = !theme.global.current.value.dark;
      theme.global.name.value = isDark ? 'dark' : 'light';
      localStorage.setItem('darkTheme', isDark.toString());
      darkTheme.value = isDark; // Update the darkTheme state
    };

    // Function to fetch last commit hash
    const fetchLastCommit = async () => {
      try {
        const repoName = appConfig.repoName; // Fetching repo name from config file
        const response = await fetch(`https://api.github.com/repos/${repoName}/commits?per_page=1`);
        if (!response.ok) throw new Error('Network response was not ok.');

        const commits = await response.json();
        if (commits.length) {
          lastCommitHash.value = commits[0].sha.substring(0, 7);
        }
      } catch (error) {
        console.error('Error fetching last commit:', error);
        fetchError.value = true;
        lastCommitHash.value = 'offline';
      }
    };

    // Apply saved theme preference
    onMounted(async () => {
      await fetchLastCommit();
      const savedTheme = localStorage.getItem('darkTheme');
      if (savedTheme !== null) {
        theme.global.name.value = savedTheme === 'true' ? 'dark' : 'light';
        darkTheme.value = savedTheme === 'true';
      }
    });


    // Computed property for menu items based on login status and roles
    const menuItems = computed(() => {
      return menuConfig.items
    });

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
      showCopyIcon
    };
  },
};
</script>

<style scoped>
/**
 * Keyframes for fadeIn animation.
 * Gradually increases the opacity of an element from 0 to 1.
 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/**
 * Keyframes for pulse animation.
 * Creates a pulsating effect by scaling the element from its original size to 10% larger.
 */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/**
 * Styles for the application logo.
 * Sets a maximum width, adds right margin, and applies the fadeIn animation.
 */
.app-logo {
  max-width: 92px; /* Fixed maximum width for consistency */
  margin-right: 10px; /* Spacing between logo and title */
  animation: fadeIn 2s ease-out forwards; /* Applies the fadeIn animation */
}

/**
 * Hover effect for the application logo.
 * Adds a pulse animation and changes the cursor to pointer on hover.
 */
.app-logo:hover {
  animation: pulse 2s infinite; /* Continuous pulse animation on hover */
  cursor: pointer; /* Indicates the logo is clickable */
}

/**
 * Hover effect for clickable elements in the toolbar.
 * Reduces opacity and adds a smooth transition effect on hover.
 */
.clickable:hover {
  opacity: 0.8; /* Slightly reduces opacity to indicate interactivity */
  transition: opacity 0.3s ease; /* Smooth transition for the opacity change */
  cursor: pointer; /* Indicates the element is clickable */
}

/**
 * Styles for the version info.
 * Adds right padding and decreases the top margin to bring it closer to the app name.
 */
.version-info {
  display: block; /* Ensures the version info is on a new line */
  margin-left: auto;
  padding-right: 16px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin-top: -10px; /* Decrease the top margin to bring it closer to the app name */
}

/**
 * Show the copy icon when hovering over the version info.
 */
.version-info:hover v-icon {
  display: block;
}

/**
 * Styles for the copy icon.
 * Initially, set it to be hidden.
 */
.version-info v-icon {
  display: none;
}
</style>

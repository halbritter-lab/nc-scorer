<template>
  <v-app>
    <!-- Include the AppBar component -->
    <AppBar />

    <!-- Application content -->
    <v-main>
      <router-view></router-view>
    </v-main>

    <!-- Include the FooterBar component -->
    <FooterBar />
    
    <!-- Global notification system -->
    <GlobalNotification />
  </v-app>
</template>

<script>
import AppBar from './components/AppBar.vue';
import FooterBar from './components/FooterBar.vue';
import GlobalNotification from './components/GlobalNotification.vue';

export default {
  name: 'NCScorer',
  components: {
    AppBar,
    FooterBar,
    GlobalNotification,
  },
  setup() {
    // Composition API setup can go here
  },
};
</script>

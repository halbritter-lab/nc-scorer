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
  </v-app>
</template>

<script>
import AppBar from './components/AppBar.vue';
import FooterBar from './components/FooterBar.vue';

export default {
  name: 'NCScorer',
  components: {
    AppBar,
    FooterBar,
  },
  setup() {
    // Composition API setup can go here
  },
};
</script>

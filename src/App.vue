<template>
  <v-app>
    <v-app-bar app>
      <router-link to="/" class="white--text text-decoration-none">
        <v-toolbar-title>NCScorer</v-toolbar-title>
      </router-link>
    </v-app-bar>

    <!-- Application content -->
    <v-main>
      <router-view></router-view>
    </v-main>

    <!-- Include the FooterBar component -->
    <FooterBar/>
  </v-app>
</template>

<script>
import FooterBar from './components/FooterBar.vue'; // Make sure the path is correct

export default {
  name: 'NCScorer',
  components: {
    FooterBar,
  },
  setup() {
    // Composition API setup can go here
  }
};
</script>

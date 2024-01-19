<!-- App.vue -->
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

    <!-- Footer -->
    <v-footer app padless>
      <v-col class="text-center" cols="12">
        NCScorer ©2024
      </v-col>
    </v-footer>
  </v-app>
</template>

<script>

export default {
  name: 'App',
  components: {
  },
  setup() {
    // Composition API setup can go here
  }
};
</script>

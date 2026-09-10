<!-- views/PageNotFound.vue -->
<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="pa-4">
          <v-card-title>
            <h1 class="text-h5 font-weight-bold">404: Page Not Found</h1>
          </v-card-title>
          <v-card-text>
            <p class="mb-4">The page you are looking for does not exist or has been moved.</p>
            <v-btn color="primary" variant="flat" @click="goHome">Go Home</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'PageNotFound',
  methods: {
    goHome() {
      this.$router.push('/');
    },
  },
};
</script>

<style scoped>
/* Your styles here */
</style>

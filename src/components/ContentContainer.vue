<!-- src/components/ContentContainer.vue -->
<template>
  <div class="content-container">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'ContentContainer',
};
</script>

<style scoped>
.content-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

@media (max-width: 600px) {
  .content-container {
    padding: 24px 16px;
  }
}
</style>

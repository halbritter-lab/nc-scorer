<template>
  <ContentContainer>
    <StaticContent :config="faqConfig" />
    <v-divider class="my-4"></v-divider>
    
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8" class="text-center">
          <p class="text-body-1 mb-2">Need help navigating the application?</p>
          <RestartTourButton />
        </v-col>
      </v-row>
    </v-container>
  </ContentContainer>
</template>

<script>
import StaticContent from '@/components/StaticContent.vue';
import ContentContainer from '@/components/ContentContainer.vue';
import RestartTourButton from '@/components/RestartTourButton.vue';
import faqConfig from '@/config/faqPageConfig.json';

export default {
  name: 'FAQPage',
  components: {
    StaticContent,
    ContentContainer,
    RestartTourButton,
  },
  data() {
    return {
      faqConfig,
    };
  },
};
</script>

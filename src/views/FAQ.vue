<template>
  <ContentContainer>
    <StaticContent :config="faqConfig" />
  </ContentContainer>
</template>

<script>
import StaticContent from '@/components/StaticContent.vue';
import ContentContainer from '@/components/ContentContainer.vue';
import faqConfig from '@/config/faqPageConfig.json';

export default {
  name: 'FAQPage',
  components: {
    StaticContent,
    ContentContainer,
  },
  data() {
    return {
      faqConfig,
    };
  },
};
</script>

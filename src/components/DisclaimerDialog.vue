<template>
  <v-dialog
    v-model="dialogVisible"
    persistent
    max-width="600"
    :close-on-back="false"
    :scrim="false"
    role="dialog"
    aria-label="Research Use Disclaimer"
    aria-labelledby="disclaimer-dialog-title"
  >
    <v-card class="elevation-4">
      <v-card-title id="disclaimer-dialog-title" class="text-h5 font-weight-bold">
        Research Use Disclaimer
      </v-card-title>
      <v-card-text>
        <v-alert
          type="warning"
          variant="outlined"
          class="mb-4 text-body-2 font-weight-bold disclaimer-alert"
        >
          <span>NC-Scorer is intended for research purposes only and is not a clinical diagnostic tool.</span>
        </v-alert>

        <p class="mb-3">By using NC-Scorer, you acknowledge and agree to the following:</p>
        
        <ul class="mb-3">
          <li class="mb-2">This tool is designed for <strong>research and informational purposes only</strong>.</li>
          <li class="mb-2">NC-Scorer does <strong>not</strong> provide medical advice or diagnosis.</li>
          <li class="mb-2">The scores and predictions are based on computational models and publicly available data, not on clinical validation for individual cases.</li>
          <li class="mb-2">Results should <strong>not</strong> be used for making clinical decisions without independent validation and consultation with qualified healthcare professionals.</li>
        </ul>
        
        <p>Using this application implies understanding and acceptance of these limitations.</p>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="flat"
          min-height="44"
          min-width="180"
          class="font-weight-bold"
          @click="acknowledgeDisclaimer"
        >
          I Understand and Agree
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref } from 'vue';
import { useDisclaimer } from '@/composables/useDisclaimer';

export default {
  name: 'DisclaimerDialog',

  setup(props, { emit }) {
    const { saveDisclaimerAcknowledgment } = useDisclaimer();
    const dialogVisible = ref(true);

    // Method to handle user acknowledgment
    const acknowledgeDisclaimer = () => {
      saveDisclaimerAcknowledgment();
      dialogVisible.value = false;
      emit('acknowledged');
    };

    return {
      dialogVisible,
      acknowledgeDisclaimer
    };
  }
};
</script>

<style scoped>
.v-card-title {
  border-bottom: 1px solid #eee;
}

.v-card-text {
  padding-top: 20px;
}

.disclaimer-alert {
  background-color: #fffbeb !important;
  color: #78350f !important;
  border: 1.5px solid #d97706 !important;
}

:deep(.v-theme--dark) .disclaimer-alert,
.v-theme--dark .disclaimer-alert {
  background-color: #1c1917 !important;
  color: #fef08a !important;
  border: 1.5px solid #eab308 !important;
}
</style>

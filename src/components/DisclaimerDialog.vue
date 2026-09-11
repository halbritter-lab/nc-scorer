<template>
  <v-dialog
    :model-value="dialogVisible"
    :persistent="requireAcknowledgment"
    :close-on-back="!requireAcknowledgment"
    max-width="580"
    class="disclaimer-dialog"
    aria-labelledby="disclaimer-dialog-title"
    aria-describedby="disclaimer-summary"
    @update:model-value="setVisibility"
  >
    <v-card class="disclaimer-card" elevation="0">
      <header class="disclaimer-header">
        <div>
          <p class="disclaimer-eyebrow">Before you use NC-Scorer</p>
          <h2 id="disclaimer-dialog-title">Research Use Disclaimer</h2>
        </div>
        <v-btn
          v-if="!requireAcknowledgment"
          icon="mdi-close"
          variant="text"
          aria-label="Close research disclaimer"
          @click="setVisibility(false)"
        />
      </header>
      <div class="disclaimer-body">
        <p id="disclaimer-summary" class="disclaimer-summary">
          NC-Scorer is intended for research purposes only and is not a clinical
          diagnostic tool.
        </p>
        <ul class="disclaimer-points">
          <li>
            This tool provides research information, not medical advice or
            diagnosis.
          </li>
          <li>
            Scores use computational models and publicly available data. They
            have not been clinically validated for individual cases.
          </li>
          <li>
            Results must not guide clinical decisions without independent
            validation and consultation with qualified healthcare professionals.
          </li>
        </ul>
        <p
          v-if="!requireAcknowledgment && acknowledgmentDate"
          class="disclaimer-date"
        >
          Acknowledged on {{ acknowledgmentDate }}.
        </p>
        <p v-else class="disclaimer-note">
          By continuing, you acknowledge and accept these limitations.
        </p>
      </div>
      <v-card-actions class="disclaimer-actions">
        <v-btn
          v-if="requireAcknowledgment"
          color="primary"
          variant="flat"
          min-height="44"
          @click="acknowledgeDisclaimer"
          >I Understand and Agree</v-btn
        >
        <v-btn
          v-else
          color="primary"
          variant="flat"
          min-height="44"
          @click="setVisibility(false)"
          >Done</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, computed, onUnmounted } from 'vue';
import { useDisclaimer } from '@/composables/useDisclaimer';

export default {
  name: 'DisclaimerDialog',
  props: {
    requireAcknowledgment: { type: Boolean, default: true },
  },
  emits: ['acknowledged', 'closed'],
  setup(props, { emit }) {
    const openingControl = document.activeElement;
    onUnmounted(() => openingControl?.focus({ preventScroll: true }));
    const { saveDisclaimerAcknowledgment, getFormattedAcknowledgmentDate } =
      useDisclaimer();
    const dialogVisible = ref(true);
    const acknowledgmentDate = computed(getFormattedAcknowledgmentDate);
    const setVisibility = (visible) => {
      dialogVisible.value = visible;
      if (!visible) emit('closed');
    };
    const acknowledgeDisclaimer = () => {
      saveDisclaimerAcknowledgment();
      setVisibility(false);
      emit('acknowledged');
    };
    return {
      dialogVisible,
      acknowledgmentDate,
      setVisibility,
      acknowledgeDisclaimer,
    };
  },
};
</script>

<style scoped>
.disclaimer-card {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 32px);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 16px;
}
.disclaimer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 28px 28px 20px;
}
.disclaimer-eyebrow {
  margin: 0 0 8px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.8rem;
}
.disclaimer-header h2 {
  font-size: 1.5rem;
  line-height: 1.25;
  font-weight: 650;
}
.disclaimer-body {
  padding: 0 28px 24px;
  overflow-y: auto;
  font-size: 0.95rem;
  line-height: 1.65;
}
.disclaimer-summary {
  font-weight: 600;
  margin-bottom: 20px;
}
.disclaimer-points {
  padding-left: 20px;
}
.disclaimer-points li + li {
  margin-top: 14px;
}
.disclaimer-note,
.disclaimer-date {
  margin-top: 24px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.85rem;
}
.disclaimer-actions {
  flex: none;
  justify-content: flex-end;
  padding: 16px 28px 24px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.disclaimer-actions :deep(.v-btn) {
  text-transform: none;
  letter-spacing: normal;
}
@media (max-width: 600px) {
  .disclaimer-header {
    padding: 24px 20px 16px;
  }
  .disclaimer-header h2 {
    font-size: 1.3rem;
  }
  .disclaimer-body {
    padding: 0 20px 20px;
  }
  .disclaimer-actions {
    padding: 16px 20px 20px;
  }
  .disclaimer-actions :deep(.v-btn) {
    width: 100%;
  }
}
</style>

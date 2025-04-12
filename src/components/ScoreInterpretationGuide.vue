<template>
  <div class="score-interpretation-guide">
    <div class="guide-container-wrapper">
      <!-- Score marker that shows current position as dot with tooltip -->
      <v-tooltip location="top">
        <template v-slot:activator="{ props }">
          <div
            v-if="currentScore !== null"
            v-bind="props"
            class="score-marker"
            :style="{ left: `${calculateMarkerPosition()}%` }"
          >
            <div class="marker-dot"></div>
          </div>
        </template>
        <span>Your variant: {{ currentScore.toFixed(2) }}</span>
      </v-tooltip>
      
      <div class="guide-container">
        <div
          v-for="(range, index) in scoreInterpretationConfig.ranges"
          :key="index"
          class="range-section"
        >
          <div class="range-bar" :style="{ backgroundColor: range.color }"></div>
          <div class="range-label">
            <div class="range-name">{{ range.label }}</div>
            <div class="range-values">{{ range.min }}-{{ range.max }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { scoreInterpretationConfig } from '@/config/scoreInterpretationConfig';

export default {
  name: 'ScoreInterpretationGuide',
  props: {
    currentScore: {
      type: Number,
      default: null,
    },
  },
  setup(props) {
    // Calculate the position of the marker on the scale (as a percentage)
    const calculateMarkerPosition = () => {
      if (props.currentScore === null) return 0;
      
      // Get the total scale range (0 to 10)
      const minScoreValue = 0;
      const maxScoreValue = 10;
      const totalRange = maxScoreValue - minScoreValue;
      
      // Calculate position as percentage
      const position = ((props.currentScore - minScoreValue) / totalRange) * 100;
      
      // Clamp between 0% and 100%
      return Math.max(0, Math.min(100, position));
    };
    
    return {
      scoreInterpretationConfig,
      calculateMarkerPosition,
    };
  },
};
</script>

<style scoped>
.score-interpretation-guide {
  width: 100%;
  margin: 8px auto;
  padding: 0 16px;
}

.guide-container-wrapper {
  position: relative;
  padding-top: 20px; /* Space for the marker */
  margin-bottom: 10px;
}

.guide-container {
  display: flex;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
}

.range-section {
  flex: 1;
  text-align: center;
  position: relative;
}

.range-bar {
  height: 12px;
  width: 100%;
}

.range-label {
  font-size: 0.75rem;
  padding-top: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.range-values {
  font-size: 0.7rem;
  opacity: 0.7;
}

/* Score marker styling */
.score-marker {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #000;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
</style>

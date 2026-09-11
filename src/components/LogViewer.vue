<template>
  <v-dialog
    :model-value="true"
    max-width="960"
    class="logs-dialog"
    aria-labelledby="log-viewer-title"
    aria-describedby="log-viewer-description"
    @update:model-value="toggleLogViewer"
  >
    <v-card class="log-viewer" elevation="0">
      <header class="log-header">
        <div>
          <h2 id="log-viewer-title">Application logs</h2>
          <p id="log-viewer-description">
            Requests, responses, and activity from this session.
          </p>
        </div>
        <div class="log-actions">
          <v-btn
            icon="mdi-download"
            variant="text"
            aria-label="Download logs"
            title="Download logs"
            @click="downloadLogs"
          />
          <v-btn
            icon="mdi-delete-sweep"
            variant="text"
            aria-label="Clear logs"
            title="Clear logs"
            @click="clearLogs"
          />
          <v-btn
            icon="mdi-close"
            variant="text"
            aria-label="Close logs"
            title="Close logs"
            @click="toggleLogViewer"
          />
        </div>
      </header>
      <div class="log-filters">
        <v-text-field
          v-model="searchText"
          label="Search logs"
          placeholder="Search"
          density="compact"
          variant="outlined"
          hide-details
          prepend-inner-icon="mdi-magnify"
          clearable
        />
        <v-select
          v-model="filterLevel"
          :items="filterOptions"
          label="Show level"
          density="compact"
          variant="outlined"
          hide-details
        />
        <v-select
          v-model="currentLogLevel"
          :items="logLevelOptions"
          label="Min Level"
          density="compact"
          variant="outlined"
          hide-details
        />
      </div>
      <div class="log-container">
        <div v-if="visibleEntries.length === 0" class="log-empty">
          <v-icon icon="mdi-text-box-outline" size="28" aria-hidden="true" />
          <p>No logs matching your filters.</p>
        </div>
        <v-list v-else class="log-list" density="compact">
          <template
            v-for="(entry, index) in visibleEntries"
            :key="entry.id || index"
          >
            <v-list-item
              class="log-entry"
              :class="`log-level-${entry.level.toLowerCase()}`"
              :aria-expanded="
                entry.rawData
                  ? Boolean(expandedEntries[entry.id || index])
                  : undefined
              "
              @click="toggleExpand(entry.id || index)"
            >
              <template #prepend>
                <time class="log-timestamp">{{
                  formatTimestamp(entry.timestamp)
                }}</time>
              </template>
              <v-list-item-title class="log-message">
                <v-chip
                  size="small"
                  class="log-level-label"
                  :color="getLevelColor(entry.level)"
                  variant="tonal"
                  label
                  >{{ entry.level }}</v-chip
                >
                <span>{{ entry.displayMessage }}</span>
              </v-list-item-title>
              <div
                v-if="expandedEntries[entry.id || index] && entry.rawData"
                class="log-data"
              >
                <pre>{{ formatData(entry.rawData) }}</pre>
              </div>
            </v-list-item>
          </template>
        </v-list>
      </div>
      <footer class="log-footer">
        <span>Logs ({{ filteredEntries.length }})</span>
        <span v-if="filteredEntries.length > maxVisibleEntries"
          >Showing the newest {{ maxVisibleEntries }} matches.</span
        >
        <span v-else>Download saves all stored entries.</span>
      </footer>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useUiStore } from '@/stores/uiStore';
import { logService, LogLevel } from '@/services/logService';

const uiStore = useUiStore();
const toggleLogViewer = uiStore.closeLogViewer;
const openingControl = document.activeElement;
onUnmounted(() => openingControl?.focus({ preventScroll: true }));

const searchText = ref('');
// Log level selection with getter/setter for two-way binding
const currentLogLevel = computed({
  get: () => logService.currentLogLevel.value,
  set: (newLevel) => logService.setLevel(newLevel),
});

// Filter for which log entries to display
const filterLevel = ref('ALL');
const expandedEntries = ref({});
const maxVisibleEntries = 20; // Limit rendering to avoid performance issues

// Options for the log level select dropdown
const logLevelOptions = [
  { title: 'Debug', value: LogLevel.DEBUG },
  { title: 'Info', value: LogLevel.INFO },
  { title: 'Warning', value: LogLevel.WARN },
  { title: 'Error', value: LogLevel.ERROR },
];

// Options for filtering log entries in the viewer
const filterOptions = [
  { title: 'All', value: 'ALL' },
  { title: 'Debug', value: 'DEBUG' },
  { title: 'Info', value: 'INFO' },
  { title: 'Warning', value: 'WARN' },
  { title: 'Error', value: 'ERROR' },
];

// Add ID field to logs for stable keys
onMounted(() => {
  try {
    logService.entries.value.forEach((entry, index) => {
      if (!entry.id) {
        entry.id = `log-${Date.now()}-${index}`;
      }
    });
  } catch (err) {
    console.error('Error in log viewer onMounted:', err);
  }
});

const filteredEntries = computed(() => {
  try {
    let entries = logService.entries.value || [];

    // Filter by level
    if (filterLevel.value !== 'ALL') {
      entries = entries.filter((entry) => entry.level === filterLevel.value);
    }

    // Filter by search text
    if (searchText.value) {
      const searchLower = searchText.value.toLowerCase();
      entries = entries.filter((entry) => {
        if (!entry) return false;

        const messageMatch =
          entry.displayMessage &&
          entry.displayMessage.toLowerCase().includes(searchLower);

        let dataMatch = false;
        if (entry.rawData) {
          try {
            dataMatch = JSON.stringify(entry.rawData)
              .toLowerCase()
              .includes(searchLower);
          } catch {
            // Silently handle JSON stringify errors
          }
        }

        return messageMatch || dataMatch;
      });
    }

    return entries;
  } catch (err) {
    console.error('Error filtering log entries:', err);
    return [];
  }
});

// Only show a subset of entries to improve performance
const visibleEntries = computed(() => {
  const entries = filteredEntries.value;
  return entries.slice(Math.max(0, entries.length - maxVisibleEntries));
});

function formatTimestamp(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour12: false });
  } catch {
    return 'Invalid date';
  }
}

function formatData(data) {
  try {
    return typeof data === 'object'
      ? JSON.stringify(data, null, 2)
      : String(data);
  } catch {
    return '[Data cannot be displayed]';
  }
}

function getLevelColor(level) {
  switch (level) {
    case 'DEBUG':
      return 'grey';
    case 'INFO':
      return 'primary';
    case 'WARN':
      return 'warning';
    case 'ERROR':
      return 'error';
    default:
      return 'grey';
  }
}

function toggleExpand(id) {
  expandedEntries.value = {
    ...expandedEntries.value,
    [id]: !expandedEntries.value[id],
  };
}

function downloadLogs() {
  try {
    const data = JSON.stringify(logService.entries.value, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nc-scorer-logs-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error downloading logs:', err);
  }
}

function clearLogs() {
  logService.clear();
  expandedEntries.value = {};
}

// Reset expanded entries when filters change
watch([searchText, filterLevel], () => {
  expandedEntries.value = {};
});
</script>

<style scoped>
.log-viewer {
  display: flex;
  flex-direction: column;
  height: min(640px, calc(100dvh - 48px));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 16px;
  overflow: hidden;
}
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 24px 24px 20px;
}
.log-header h2 {
  font-size: 1.4rem;
  line-height: 1.3;
  font-weight: 650;
}
.log-header p {
  margin-top: 6px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.85rem;
  line-height: 1.5;
}
.log-actions {
  display: flex;
  flex: none;
}
.log-actions :deep(.v-btn) {
  width: 44px;
  height: 44px;
}
.log-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px 150px;
  gap: 12px;
  padding: 0 24px 20px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.log-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.log-list {
  padding: 0;
  background: transparent;
  border-radius: 0;
}
.log-entry {
  padding: 14px 24px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.log-entry :deep(.v-list-item__content) {
  min-width: 0;
}
.log-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  white-space: normal;
  overflow-wrap: anywhere;
  font-size: 0.9rem;
  line-height: 1.5;
}
.log-message :deep(.v-chip) {
  flex: none;
  margin-top: 2px;
}
.log-level-label {
  color: rgb(var(--v-theme-on-surface)) !important;
  font-size: 0.75rem;
}
.log-timestamp {
  display: block;
  min-width: 78px;
  padding-right: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}
.log-data {
  margin-top: 12px;
  padding: 14px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  overflow-x: auto;
}
.log-data pre {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 0.8rem;
  line-height: 1.6;
}
.log-empty {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  height: 100%;
  min-height: 140px;
  padding: 24px;
  color: rgb(var(--v-theme-on-surface-variant));
}
.log-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px 24px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.8rem;
}
@media (max-width: 600px) {
  .log-header {
    flex-wrap: wrap;
    padding: 20px 16px 16px;
    gap: 12px;
  }
  .log-header h2 {
    font-size: 1.25rem;
  }
  .log-header > div:first-child {
    flex: 1;
    min-width: 150px;
  }
  .log-header p {
    display: none;
  }
  .log-filters {
    padding: 0 16px 16px;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .log-filters > :first-child {
    grid-column: 1 / -1;
  }
  .log-entry {
    padding: 12px 16px;
  }
  .log-timestamp {
    min-width: 64px;
    padding-right: 8px;
    font-size: 0.7rem;
  }
  .log-message {
    flex-wrap: wrap;
    gap: 6px;
  }
  .log-message > span {
    flex-basis: 100%;
  }
  .log-footer {
    padding: 12px 16px;
  }
}
</style>

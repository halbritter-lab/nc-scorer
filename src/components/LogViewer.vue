<!-- src/components/LogViewer.vue -->
<template>
  <v-card
    class="log-viewer"
    elevation="8"
  >
    <v-card-title class="d-flex align-center justify-space-between pa-2">
      <div class="d-flex align-center">
        <span class="text-subtitle-1 font-weight-medium mr-2">Logs ({{ filteredEntries.length }})</span>
        
        <div class="d-flex align-center">
          <v-select
            v-model="currentLogLevel"
            :items="logLevelOptions"
            density="compact"
            variant="outlined"
            hide-details
            label="Min Level"
            style="max-width: 100px"
            class="ml-2"
          ></v-select>
          
          <v-select
            v-model="filterLevel"
            :items="filterOptions"
            density="compact"
            variant="outlined"
            hide-details
            label="Filter"
            style="max-width: 100px"
            class="ml-2"
          ></v-select>
        </div>
      </div>
      
      <div class="d-flex">
        <v-text-field
          v-model="searchText"
          density="compact"
          hide-details
          placeholder="Search"
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          class="mr-2"
          style="max-width: 150px"
          clearable
        ></v-text-field>
        
        <v-tooltip text="Download Logs">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-download"
              size="small"
              variant="text"
              @click="downloadLogs"
              color="primary"
              class="mr-1"
            ></v-btn>
          </template>
        </v-tooltip>
        
        <v-tooltip text="Clear Logs">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-delete-sweep"
              size="small"
              variant="text"
              @click="clearLogs"
              color="error"
              class="mr-1"
            ></v-btn>
          </template>
        </v-tooltip>
        
        <v-tooltip text="Close">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-close"
              size="small"
              variant="text"
              @click="toggleLogViewer"
            ></v-btn>
          </template>
        </v-tooltip>
      </div>
    </v-card-title>

    <v-divider></v-divider>
    <div class="log-container">
      <div v-if="visibleEntries.length === 0" class="pa-4 text-center">
        No logs matching your filters.
      </div>
      <v-list v-else density="compact">
        <template v-for="(entry, index) in visibleEntries" :key="entry.id || index">
          <v-list-item 
            class="log-entry"
            :class="`log-level-${entry.level.toLowerCase()}`"
            @click="toggleExpand(entry.id || index)"
          >
            <template v-slot:prepend>
              <div class="log-timestamp text-caption">
                {{ formatTimestamp(entry.timestamp) }}
              </div>
            </template>
            
            <v-list-item-title class="d-flex align-center">
              <v-chip
                size="x-small"
                :color="getLevelColor(entry.level)"
                class="mr-2"
                label
              >
                {{ entry.level }}
              </v-chip>
              <span>{{ entry.displayMessage }}</span>
            </v-list-item-title>
            
            <v-expand-transition>
              <div v-if="expandedEntries[entry.id || index] && entry.rawData" class="log-data mt-2 pa-2">
                <pre>{{ formatData(entry.rawData) }}</pre>
              </div>
            </v-expand-transition>
          </v-list-item>
          
          <v-divider v-if="index < visibleEntries.length - 1"></v-divider>
        </template>
      </v-list>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useUiStore } from '@/stores/uiStore';
import { logService, LogLevel } from '@/services/logService';

const uiStore = useUiStore();
const toggleLogViewer = uiStore.toggleLogViewer;

const searchText = ref('');
// Log level selection with getter/setter for two-way binding
const currentLogLevel = computed({
  get: () => logService.currentLogLevel.value,
  set: (newLevel) => logService.setLevel(newLevel)
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
  { title: 'Error', value: LogLevel.ERROR }
];

// Options for filtering log entries in the viewer
const filterOptions = [
  { title: 'All', value: 'ALL' },
  { title: 'Debug', value: 'DEBUG' },
  { title: 'Info', value: 'INFO' },
  { title: 'Warning', value: 'WARN' },
  { title: 'Error', value: 'ERROR' }
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
      entries = entries.filter(entry => entry.level === filterLevel.value);
    }
    
    // Filter by search text
    if (searchText.value) {
      const searchLower = searchText.value.toLowerCase();
      entries = entries.filter(entry => {
        if (!entry) return false;
        
        const messageMatch = entry.displayMessage && 
          entry.displayMessage.toLowerCase().includes(searchLower);
          
        let dataMatch = false;
        if (entry.rawData) {
          try {
            dataMatch = JSON.stringify(entry.rawData).toLowerCase().includes(searchLower);
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
    return typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
  } catch {
    return '[Data cannot be displayed]';
  }
}

function getLevelColor(level) {
  switch (level) {
    case 'DEBUG': return 'grey';
    case 'INFO': return 'primary';
    case 'WARN': return 'warning';
    case 'ERROR': return 'error';
    default: return 'grey';
  }
}

function toggleExpand(id) {
  expandedEntries.value = {
    ...expandedEntries.value,
    [id]: !expandedEntries.value[id]
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
  position: fixed;
  bottom: 64px; /* Well above the footer */
  right: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 500px; /* Fixed max height regardless of viewport */
  z-index: 1000;
  overflow: hidden;
}

.log-container {
  max-height: 430px;
  overflow-y: auto;
}

.log-timestamp {
  min-width: 80px;
  color: rgba(0, 0, 0, 0.6);
}

.log-level-debug {
  border-left: 3px solid var(--v-grey-base, #9e9e9e);
}

.log-level-info {
  border-left: 3px solid var(--v-primary-base, #1976d2);
}

.log-level-warn {
  border-left: 3px solid var(--v-warning-base, #fb8c00);
}

.log-level-error {
  border-left: 3px solid var(--v-error-base, #ff5252);
}

.log-data {
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
  font-size: 0.85rem;
}

.log-data pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

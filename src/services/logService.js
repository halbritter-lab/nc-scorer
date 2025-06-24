// src/services/logService.js
import { computed, shallowReactive, markRaw } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';

// Define log levels as an enum-like object with names for display and serialization
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  names: ['DEBUG', 'INFO', 'WARN', 'ERROR']
};

// Maximum number of log entries to keep in memory to prevent excessive memory usage
const MAX_LOG_ENTRIES = 50;

// Disable console echo by default (only log to internal store)
let CONSOLE_ECHO_ENABLED = false;

// Flag to prevent recursive logging
let isLogging = false;

/**
 * Get the initial log level from settings store or default to DEBUG
 * @returns {number} The log level value from LogLevel enum
 */
function getInitialLogLevel() {
  try {
    const settingsStore = useSettingsStore();
    if (settingsStore.logLevel && LogLevel.names.includes(settingsStore.logLevel)) {
      return LogLevel[settingsStore.logLevel];
    }
  } catch {
    // If store is not available (during initialization), fall back to default
    console.debug('Settings store not available during log service initialization, using default level');
  }
  return LogLevel.DEBUG; // Default to DEBUG level to show all messages
}

// State for logging system using Vue reactivity, but with shallowReactive to avoid deep reactivity issues
const state = shallowReactive({
  logEntries: [],
  currentLogLevel: getInitialLogLevel()
});

/**
 * Add a log entry if it meets the current log level threshold
 * @param {number} level - Log level (from LogLevel enum)
 * @param {...any} args - Arguments to log (first string becomes message, rest become data)
 */
function addLogEntry(level, ...args) {
  // Prevent recursive logging
  if (isLogging) return;
  isLogging = true;
  
  try {
    // Only log if level is >= currentLogLevel
    if (level < state.currentLogLevel) {
      isLogging = false;
      return;
    }
    
    // Format the log entry
    const levelName = LogLevel.names[level];
    let displayMessage = '';
    let rawData = null;
    
    // Process args to extract message and data
    if (args.length > 0) {
      if (typeof args[0] === 'string') {
        displayMessage = args[0];
        if (args.length > 1) {
          // Use a safer approach than structuredClone to avoid errors with circular references
          try {
            rawData = args.length === 2 ? markRaw(safeClone(args[1])) : markRaw(safeClone(args.slice(1)));
          } catch (err) {
            console.error('Failed to clone log data:', err);
            rawData = args.length === 2 ? '[Uncloneable data]' : '[Uncloneable data array]';
          }
        }
      } else {
        displayMessage = '[Object data]';
        // Use a safer approach than structuredClone to avoid errors with circular references
        try {
          rawData = args.length === 1 ? markRaw(safeClone(args[0])) : markRaw(safeClone(args));
        } catch (err) {
          console.error('Failed to clone log data:', err);
          rawData = '[Uncloneable data]';
        }
      }
    }
    
    // Create the log entry with markRaw to avoid reactivity
    const entry = markRaw({
      timestamp: new Date().toISOString(),
      level: levelName,
      displayMessage,
      rawData
    });
    
    // Add to state and trim if necessary
    state.logEntries.push(entry);
    
    // Only output to console if console echo is enabled
    if (CONSOLE_ECHO_ENABLED) {
      const consoleMethod = level === LogLevel.DEBUG ? 'debug' : 
                          level === LogLevel.INFO ? 'info' : 
                          level === LogLevel.WARN ? 'warn' : 'error';
      
      if (rawData) {
        console[consoleMethod](displayMessage, rawData);
      } else {
        console[consoleMethod](displayMessage);
      }
    }
    
    // Enforce maximum log entries
    while (state.logEntries.length > MAX_LOG_ENTRIES) {
      state.logEntries.shift();
    }
  } catch (error) {
    // If anything goes wrong, log to console only
    console.error('Error in logService:', error);
  } finally {
    // Always reset the logging flag
    isLogging = false;
  }
}

/**
 * Set the current log level and save to settings store
 * @param {number} level - The new log level (from LogLevel enum)
 */
function setLevel(level) {
  if (level >= LogLevel.DEBUG && level <= LogLevel.ERROR) {
    state.currentLogLevel = level;
    try {
      const settingsStore = useSettingsStore();
      settingsStore.setLogLevel(LogLevel.names[level]);
    } catch (e) {
      // If store is not available, log the issue but continue
      console.warn('Settings store not available for log level persistence:', e);
    }
    addLogEntry(LogLevel.INFO, `Log level changed to ${LogLevel.names[level]}`);
  }
}

/**
 * Clear all log entries
 */
function clear() {
  const count = state.logEntries.length;
  state.logEntries = [];
  addLogEntry(LogLevel.INFO, `Cleared ${count} log entries`);
}

/**
 * Control whether logs should also be sent to the console
 * @param {boolean} enabled - Whether to enable console output
 */
function setConsoleEcho(enabled) {
  CONSOLE_ECHO_ENABLED = !!enabled;
  addLogEntry(LogLevel.INFO, `Console echo ${CONSOLE_ECHO_ENABLED ? 'enabled' : 'disabled'}`);
}

/**
 * Safe approach to clone objects that might contain circular references or non-cloneable items
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object with circular references handled
 */
function safeClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj; // Return primitives as is
  }
  
  try {
    // Try JSON serialization (fast but limited)
    return JSON.parse(JSON.stringify(obj));
  } catch {
    // Fallback to manual cloning for more complex objects
    const seen = new WeakMap();
    
    function _clone(item) {
      // Handle primitives and null
      if (item === null || typeof item !== 'object') {
        return item;
      }
      
      // Handle Date objects
      if (item instanceof Date) {
        return new Date(item);
      }
      
      // Handle RegExp objects
      if (item instanceof RegExp) {
        return new RegExp(item.source, item.flags);
      }
      
      // Handle Arrays
      if (Array.isArray(item)) {
        return item.map(i => {
          try { return _clone(i); }
          catch { return '[Uncloneable]'; }
        });
      }
      
      // Handle circular references
      if (seen.has(item)) {
        return '[Circular]';
      }
      
      // Handle regular objects
      const result = {};
      seen.set(item, result);
      
      // Recursively clone own properties
      Object.keys(item).forEach(key => {
        try {
          if (Object.prototype.hasOwnProperty.call(item, key)) {
            result[key] = _clone(item[key]);
          }
        } catch {
          result[key] = '[Uncloneable]';
        }
      });
      
      return result;
    }
    
    return _clone(obj);
  }
}

/**
 * Safe logging wrapper to prevent errors in production
 */
function safeLog(logFn, ...args) {
  try {
    return logFn(...args);
  } catch (error) {
    console.error('Error in log service:', error);
    return null;
  }
}

// Export the log service as a singleton
export const logService = {
  // Logging methods with safety wrappers
  debug: (...args) => safeLog(() => addLogEntry(LogLevel.DEBUG, ...args)),
  info: (...args) => safeLog(() => addLogEntry(LogLevel.INFO, ...args)),
  warn: (...args) => safeLog(() => addLogEntry(LogLevel.WARN, ...args)),
  error: (...args) => safeLog(() => addLogEntry(LogLevel.ERROR, ...args)),
  
  // Management methods
  setLevel,
  clear,
  setConsoleEcho,
  
  // Readonly properties via computed for reactivity
  entries: computed(() => state.logEntries),
  currentLogLevel: computed(() => state.currentLogLevel),
  consoleEcho: computed(() => CONSOLE_ECHO_ENABLED)
};

export default logService;

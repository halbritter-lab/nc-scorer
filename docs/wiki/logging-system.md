# NC-Scorer Logging System

The NC-Scorer application includes a comprehensive logging system that helps developers and users track application behavior, debug issues, and monitor performance. This document covers everything you need to know about using and extending the logging system.

## Overview

The logging system consists of:

1. **LogService**: A centralized service for capturing, storing, and retrieving log messages
2. **LogViewer**: A UI component for viewing, filtering, and exporting log entries
3. **Integration points**: Various places in the application where events and errors are logged

## Log Levels

The system uses four standard log levels:

| Level | Value | Description | Use Case |
|-------|-------|-------------|----------|
| DEBUG | 0 | Detailed information for debugging | Development insights, data flow tracking |
| INFO | 1 | General information about application operation | User actions, successful operations |
| WARN | 2 | Potential issues that don't prevent operation | Data inconsistencies, retry attempts |
| ERROR | 3 | Critical issues that may impact functionality | API failures, data processing errors |

## Using the Log Viewer

The log viewer is accessible via a button in the application footer. Once opened, it provides several features:

- **View logs**: Chronological display of log entries with timestamps, levels, and messages
- **Filter by level**: Show only logs of specific severity (DEBUG, INFO, WARN, ERROR)
- **Search**: Find specific log entries containing search terms
- **Expand details**: Click on a log entry to see additional data
- **Download**: Export the complete log as a JSON file for sharing or analysis
- **Clear**: Remove all current log entries

### Configure Minimum Log Level

The log viewer allows you to change the minimum log level that will be captured by the system. This setting persists across sessions via localStorage.

## For Developers

### Importing the LogService

To use the logging system in your code:

```javascript
import { logService, LogLevel } from '@/services/logService';
```

### Logging Messages

Log messages at different levels:

```javascript
// Simple message
logService.debug('Loading component data');

// Message with additional data
logService.info('User selected option', { option: 'value', timestamp: Date.now() });

// Warning with context
logService.warn('API response missing expected fields', response);

// Error with details
logService.error('Failed to process data', { 
  error: error.message, 
  data: inputData,
  stack: error.stack 
});
```

### Configuring the Logger

Control the logging behavior programmatically:

```javascript
// Set minimum log level (only this level and higher will be recorded)
logService.setLevel(LogLevel.DEBUG); // Log everything
logService.setLevel(LogLevel.INFO);  // Only INFO, WARN, ERROR 
logService.setLevel(LogLevel.WARN);  // Only WARN, ERROR
logService.setLevel(LogLevel.ERROR); // Only ERROR

// Toggle console output (disabled by default to prevent console spam)
logService.setConsoleEcho(true);  // Show logs in browser console
logService.setConsoleEcho(false); // Only store in internal log
```

### Accessing Log Data

Access the collected logs programmatically:

```javascript
// Get reactive array of log entries
const allLogs = logService.entries.value;

// Get current log level
const currentLevel = logService.currentLogLevel.value;

// Clear all logs
logService.clear();
```

## Implementation Details

The logging system is built with Vue 3's Composition API, following the project's design principles:

- Uses Vue's reactivity system for reactive log updates
- Prevents circular dependencies with proper data cloning
- Limits log storage to 50 entries to prevent memory issues
- Preserves log level preference in localStorage

## Best Practices

1. **Use appropriate log levels**: Don't overuse DEBUG for normal operations
2. **Include context data**: Log relevant objects to provide context for troubleshooting
3. **Be selective**: Log important events, not every state change
4. **Handle sensitive data**: Never log passwords, tokens, or PII
5. **Use structured data**: Provide data objects rather than string concatenation

## Extending the System

The logging system is designed to be extensible. Potential enhancements include:

- Remote logging integration
- Log persistence between sessions
- Additional filtering options
- Log rotation or archiving
- Performance metrics tracking

## Troubleshooting

### Common Issues

1. **Too many logs**: Adjust the minimum log level to reduce noise
2. **Missing logs**: Ensure the log level is set to include the messages you want to see
3. **Performance concerns**: Clear logs frequently if you notice slowdown
4. **Data display issues**: Some complex objects may display as "[Uncloneable data]" due to circular references

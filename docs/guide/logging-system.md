# Logging System

NC-Scorer includes a comprehensive logging system for debugging and monitoring.

## Viewing Logs

1. Click the log icon in the footer
2. Use filters to view specific log levels
3. Search for specific entries
4. Export logs as JSON for analysis

## Log Levels

| Level | Use Case |
|-------|----------|
| DEBUG | Detailed debugging information |
| INFO | General application operations |
| WARN | Potential issues, retry attempts |
| ERROR | Critical failures |

## For Developers

### Basic Usage

```javascript
import { logService } from '@/services/logService';

// Log messages
logService.info('User action', { action: 'search', query: 'PKD1' });
logService.error('API failed', error);
```

### Configuration

```javascript
import { LogLevel } from '@/services/logService';

// Set minimum log level
logService.setLevel(LogLevel.INFO);

// Enable console output
logService.setConsoleEcho(true);
```

## Features

- **Auto-rotation**: Keeps last 50 entries to prevent memory issues
- **Persistence**: Log level preference saved across sessions
- **Export**: Download logs for sharing or analysis
- **Filtering**: View logs by level or search term

## Best Practices

1. Use appropriate log levels
2. Include relevant context data
3. Never log sensitive information
4. Clear logs periodically for performance
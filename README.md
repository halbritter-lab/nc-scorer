# NC-Scorer

## Overview

NCScorer is a tool developed to standardize and automate the assessment of candidate variants in Exome Sequencing (ES) for patients with Chronic Kidney Disease of unknown etiology (CKDu). The tool leverages a scoring system called the Nephro Candidate Score (NCS) to prioritize candidate variants for further investigation, accelerating the discovery of new genetic associations in CKD.

This application is part of a broader research initiative that aims to apply the NCS to large CKD cohorts, such as the GCKD, to identify novel CKD-related genes and understand the genetic underpinnings of this complex disease.

### Version 0.2.0 Update

The application has been migrated from Vue CLI to Vite for improved development experience and build performance. This migration brings faster hot module replacement, better dependency optimization, and improved ESM support.

### Version 0.3.0 Update

A comprehensive logging system has been added to the application for improved debugging and monitoring. The logging system includes:

- Centralized log management with different log levels (DEBUG, INFO, WARN, ERROR)
- Interactive log viewer with filtering capabilities
- Log export functionality
- Custom log level configuration

## Installation

To set up the NCScorer for development or deployment, follow these steps:

1. Ensure that you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed on your machine.

2. Clone the repository:

   ```sh
   git clone https://github.com/halbritter-lab/nc-scorer.git
   cd nc-scorer
   ```

3. Install the dependencies:

   ```sh
   npm install
   ```

4. To run the application locally:

   ```sh
   npm run dev
   ```

   To expose the application on your network (for accessing from other devices):

   ```sh
   npm run dev -- --host
   ```

5. To build the application for production:

   ```sh
   npm run build
   ```

6. To preview the production build locally:

   ```sh
   npm run preview
   ```

## Logging System

NC-Scorer includes a centralized logging system to capture application events and errors, providing valuable debugging information during development and usage.

### Using the Logging System

1. **Viewing Logs**: Click the log icon in the footer to open the log viewer
2. **Filtering Logs**: Use the filter dropdown to view specific log levels (DEBUG, INFO, WARN, ERROR)
3. **Searching Logs**: Use the search box to find specific log entries
4. **Exporting Logs**: Click the download button to export logs as a JSON file
5. **Clearing Logs**: Click the delete button to clear the current log entries

### For Developers

The logging system can be accessed programmatically:

```js
import { logService } from '@/services/logService';

// Log at different levels
logService.debug('Debug message', { additionalData: 'example' });
logService.info('Info message');
logService.warn('Warning message');
logService.error('Error message', errorObj);

// Configure log level
logService.setLevel(LogLevel.DEBUG); // Show all logs
logService.setLevel(LogLevel.INFO);  // Only show INFO and above

// Control console output
logService.setConsoleEcho(true);  // Show logs in browser console
```

For more details, see the [Developer Wiki](docs/wiki/logging-system.md) and [FAQ](docs/wiki/faq.md#logging).

## Usage

After starting the application, navigate to `http://localhost:5173` (or the URL shown in your terminal) in your web browser to begin using NCScorer. The interface allows users to search and score genetic variants based on predefined criteria.

## Contributing

Contributions to NCScorer are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for more information on how to report bugs, make feature requests, and submit pull requests.

## Code Style & Linting

This project uses ESLint and Prettier to enforce consistent code style and quality standards. The configuration is tailored for Vue 3 development using the Composition API.

### Linting Commands

- Run linting check with automatic fixes:

  ```sh
  npm run lint
  ```

- Alternative command for targeted linting and fixing:

  ```sh
  npm run lint:fix
  ```

### Code Style Guidelines

- **Vue Components**: Use Vue 3 Composition API (`setup()` function or `<script setup>`) for new components
- **JavaScript**: Follow ES6+ standards and practices
- **Formatting Rules**:
  - Single quotes for strings
  - Semicolons at the end of statements
  - 2 spaces for indentation
  - Maximum line length of 100 characters
  - Trailing commas in multi-line objects and arrays

### Project Structure

- `components/`: Reusable Vue components
- `views/`: Page-level Vue components
- `composables/`: Shared stateful logic (Vue 3 composition functions)
- `api/`: API service functions for data fetching
- `utils/`: Utility functions and helpers
- `config/`: Application configuration and constants
- `router/`: Vue Router configuration

### Semantic Versioning and Conventional Commits

NC-Scorer uses automated semantic versioning to streamline the release process:

#### Commit Message Format

The project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Common types:
- `feat`: A new feature (triggers a minor version increment)
- `fix`: A bug fix (triggers a patch version increment)
- `docs`: Documentation changes only
- `style`: Changes that don't affect code functionality (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `build`: Changes to build system or dependencies
- `ci`: Changes to CI configuration
- `chore`: Other changes that don't modify src or test files

Breaking changes are indicated by `!` after the type/scope or by `BREAKING CHANGE:` in the footer, which triggers a major version increment.

#### Commit Tooling

To create properly formatted commits, run:

```sh
npm run commit
```

This will launch an interactive prompt to guide you through creating a compliant commit message.

#### Automatic Versioning

The project uses [semantic-release](https://github.com/semantic-release/semantic-release) to automate:

- Version determination based on commit types
- Changelog generation in the CHANGELOG.md file
- Git tag creation
- GitHub release creation

This process occurs automatically when changes are pushed to the main branch, ensuring consistent versioning according to [Semantic Versioning](https://semver.org/) principles.

### Automatic Retry Mechanism

The application includes a robust retry mechanism for API requests, which uses:

- Exponential backoff strategy
- Configurable retry conditions
- Visual feedback for retry attempts

When working with API calls, use the `retryWithBackoff` utility from `src/utils/retry.js` and consider implementing the retry state tracking provided by `useRetryState` composable.

## Code of Conduct

To ensure a welcoming and supportive environment for all contributors, please review and adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Performance Optimization

The application includes several tools to optimize performance and monitor resource usage:

### Image Optimization

The `optimize-images.js` script automatically optimizes images for web usage:

```sh
node scripts/optimize-images.js
```

**What it does:**

- Compresses PNG images with optimal settings
- Creates WebP versions for modern browsers
- Generates detailed size reduction metrics
- Use this script when adding or updating images to the project

### Bundle Analysis

The `analyze-bundle.js` script provides insights into bundle composition and size:

```sh
node scripts/analyze-bundle.js
```

**What it does:**

- Runs a production build
- Creates a visual representation of your bundle (opens in browser)
- Shows detailed breakdown of JavaScript and CSS sizes
- Use this before releases or when adding new dependencies

### Performance Features

The application implements several performance optimizations:

- **Code Splitting**: Route-level lazy loading
- **Resource Hints**: Preconnect and DNS prefetch for external APIs
- **Font Optimization**: Uses `font-display: swap` to prevent FOIT
- **Caching Strategy**: Content hashes for optimal browser caching

## License

NCScorer is made available under the [MIT License](LICENSE). See the LICENSE file for more information.

## Wiki Documentation

This repository's [GitHub Wiki](https://github.com/halbritter-lab/nc-scorer/wiki) is automatically generated from the Markdown files located in the `/docs/wiki` directory.

To update the wiki:

  1. Edit the relevant `.md` files within the `/docs/wiki` directory in the `main` branch.
  2. Commit and push your changes to the `main` branch.
  3. The `Publish Wiki` GitHub Action workflow (`.github/workflows/publish-wiki.yml`) will automatically run and synchronize the changes to the live GitHub Wiki.
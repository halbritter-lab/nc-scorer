# NC-Scorer Frequently Asked Questions

## General

### What is NC-Scorer?

NC-Scorer (Nephro Candidate Scorer) is a tool designed to standardize and automate the assessment of candidate variants in Exome Sequencing for patients with Chronic Kidney Disease of unknown etiology (CKDu). The application helps prioritize genetic variants for further investigation using the Nephro Candidate Score (NCS).

### What technologies does NC-Scorer use?

NC-Scorer is built with:

- Vue.js 3 (using Composition API)
- Vuetify 3 for UI components
- Vite as the build tool
- JavaScript (ES6+)

## Usage

### How do I search for variants?

Enter a variant in HGVS format (e.g., `NM_001128178.2:c.2383C>T`) in the search field. You can also specify inheritance pattern and segregation score if available.

### How do I process multiple variants at once?

Use the Batch processing feature:

1. Click the "Batch" item in the main navigation menu
2. Enter variants in the text area, one per line
3. Click "Fill with Examples" if you need sample variants to test with
4. Select your desired output format (CSV, TSV, JSON, or VCF)
5. Click "Process & Download" to analyze and download results


### What's the maximum number of variants I can process in batch mode?

The batch processing mode supports up to 200 variants at once. This limit ensures reasonable performance and prevents server overload.

### How do I interpret the scores?

The application generates several scores:

- Individual category scores (Conservation, Frequency, etc.)
- Final NCS score (weighted combination of individual scores)
- Higher scores indicate variants more likely to be disease-causing

## Performance

### Why is the application slow to load some variants?

The application queries external APIs for variant annotation data. First-time queries may take longer, but subsequent queries for the same variant are faster due to caching.

### What should I do if a variant fails to load?

The application attempts automatic retries when API connections fail. If a variant consistently fails to load:

1. Check your internet connection
2. Verify the variant format is correct
3. Try again later as external services may be temporarily unavailable

## Logging and Debugging {#logging}

### How do I access the application logs?

Click the log icon in the footer to open the log viewer. This displays all captured application events and errors.

### How can I export logs for troubleshooting?


1. Open the log viewer by clicking the log icon in the footer
2. Click the download button (↓) in the top right corner
3. A JSON file containing all logs will be downloaded to your device
4. This file can be shared with developers for troubleshooting

### What information is captured in the logs?

The logs capture:

- User actions (searches, selections)
- API requests and responses
- Data processing events
- Errors and warnings
- Application initialization events


### How do I filter logs to find specific information?

The log viewer provides several filtering options:

1. Use the level filter dropdown to show only specific severity levels (DEBUG, INFO, WARNING, ERROR)
2. Use the search box to find logs containing specific text
3. Click on log entries to expand additional details

### How do I change what gets logged?

You can adjust the minimum log level using the "Min Level" dropdown in the log viewer:

- **Debug**: Shows all log messages (most verbose)
- **Info**: Shows informational messages, warnings and errors
- **Warning**: Shows only warnings and errors
- **Error**: Shows only error messages

This setting persists between sessions.

### Why are some log entries showing "[Uncloneable data]"?

Some complex objects with circular references or browser-specific elements cannot be fully cloned for display in the log viewer. The message "[Uncloneable data]" prevents the application from crashing when encountering these objects.

### How do I clear the logs?

Click the trash icon in the log viewer to clear all current log entries. This is useful when you want to focus on new actions without older logs creating noise.

## Development

### Where can I report bugs or request features?

Please submit issues to our GitHub repository: [https://github.com/halbritter-lab/nc-scorer/issues](https://github.com/halbritter-lab/nc-scorer/issues)

### How can I contribute to the project?

See our [CONTRIBUTING.md](../../CONTRIBUTING.md) file for guidelines on how to contribute to the project.

## Security & Privacy

### Does the application store my data?

The application stores:

- Variant search history in browser localStorage
- API responses in a browser cache
- Log entries in memory (cleared on page refresh)

No personal data is transmitted to external servers beyond what's necessary to query variant databases.

### Are my searches private?

Variant queries are sent to public genomic databases. While these queries don't contain personally identifiable information, the variants themselves could theoretically be linked to specific patients in some contexts. Use caution when working with rare variants from identifiable patients.

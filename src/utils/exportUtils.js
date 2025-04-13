/**
 * Utilities for exporting data from the application
 */
import * as XLSX from 'xlsx';

/**
 * Generate a CSV string from header and data arrays
 * 
 * @param {Array} headers - Array of header strings
 * @param {Array} data - Array of data values
 * @returns {String} - CSV formatted string
 */
export function generateCSV(headers, data) {
  // Process headers to escape any commas
  const processedHeaders = headers.map(header => {
    if (typeof header === 'string' && header.includes(',')) {
      return `"${header}"`;
    }
    return header;
  });

  // Process data to escape any commas and handle null/undefined values
  const processedData = data.map(value => {
    if (value === null || value === undefined) {
      return 'NA';
    }
    
    if (typeof value === 'string' && value.includes(',')) {
      return `"${value}"`;
    }
    
    return value;
  });

  // Create CSV content
  const headerRow = processedHeaders.join(',');
  const dataRow = processedData.join(',');
  
  return `${headerRow}\n${dataRow}`;
}

/**
 * Trigger a file download in the browser
 * 
 * @param {String} content - Content to download
 * @param {String} filename - Name for the downloaded file
 * @param {String} mimeType - MIME type for the content
 */
export function downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
  // Create a blob with the content
  const blob = new Blob([content], { type: mimeType });
  
  // Create a temporary link element for the download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  
  // Add to document, click and clean up
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  }, 100);
}

/**
 * Generate and download an Excel file from headers and data
 * 
 * @param {Array} headers - Array of header strings
 * @param {Array} data - Array of data values
 * @param {String} filename - Name for the downloaded file
 */
export function generateExcel(headers, data, filename) {
  try {
    // Create a worksheet with the data
    const ws = XLSX.utils.aoa_to_sheet([headers, data]);
    
    // Create a workbook with the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    
    // Generate the Excel file and trigger download
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Error generating Excel file:', error);
  }
}

/**
 * Sanitize a string for use in a filename
 * 
 * @param {*} input - Input to sanitize
 * @returns {String} - Sanitized string
 */
export function sanitizeFilename(input) {
  // Handle null, undefined, or empty values
  if (input === null || input === undefined) {
    return '';
  }
  
  // Convert to string if it's not already a string
  let str = '';
  try {
    str = String(input);
  } catch (e) {
    console.error('Failed to convert input to string:', e);
    return 'unnamed';
  }
  
  if (!str) return '';
  
  try {
    // Replace invalid characters with underscores
    return str
      .replace(/[\\/:*?"<>|]/g, '_') // Invalid characters in filenames
      .replace(/\s+/g, '_')          // Replace spaces with underscores
      .replace(/-+/g, '-')           // Collapse multiple dashes
      .replace(/_+/g, '_')           // Collapse multiple underscores
      .slice(0, 50);                 // Limit length
  } catch (e) {
    console.error('Error sanitizing filename:', e);
    return 'unnamed';
  }
}

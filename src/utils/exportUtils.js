/**
 * Utilities for exporting data from the application
 */
import { logService } from '@/services/logService';

/**
 * Generate a CSV string from header and data arrays
 * 
 * @param {Array} headers - Array of header strings
 * @param {Array} data - Array of data values (1D or 2D)
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

  const isMultiRow = Array.isArray(data) && data.length > 0 && Array.isArray(data[0]);
  const rows = isMultiRow ? data : [data];

  const processedRows = rows.map(row => 
    (Array.isArray(row) ? row : [row]).map(value => {
      if (value === null || value === undefined) {
        return 'NA';
      }
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',')
  );

  const headerRow = processedHeaders.join(',');
  return `${headerRow}\n${processedRows.join('\n')}`;
}

/**
 * Trigger a file download in the browser
 * 
 * @param {Blob|String} content - Content to download
 * @param {String} filename - Name for the downloaded file
 * @param {String} mimeType - MIME type for the content
 */
export function downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  
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
 * Helper to format a cell value for write-excel-file
 */
function formatExcelCell(val) {
  if (val === null || val === undefined || val === '') {
    return { value: 'NA', type: String };
  }
  if (typeof val === 'number') {
    return { value: val, type: Number };
  }
  if (typeof val === 'boolean') {
    return { value: val, type: Boolean };
  }
  return { value: String(val), type: String };
}

/**
 * Generate and download an Excel file from headers and data using write-excel-file
 * Handles both 1D data (single row) and 2D data (multiple rows)
 * 
 * @param {Array} headers - Array of header strings
 * @param {Array} data - Array of data values (1D) or array of rows (2D)
 * @param {String} filename - Name for the downloaded file
 */
export async function generateExcel(headers, data, filename) {
  try {
    // Dynamic import to keep initial vendor bundle minimal
    const { default: writeXlsxFile } = await import('write-excel-file/browser');

    const headerRow = headers.map(header => ({
      value: String(header ?? ''),
      fontWeight: 'bold',
      backgroundColor: '#f5f5f5',
    }));

    const isMultiRow = Array.isArray(data) && data.length > 0 && Array.isArray(data[0]);
    const rowsArray = isMultiRow ? data : [data];

    const dataRows = rowsArray.map(row =>
      (Array.isArray(row) ? row : [row]).map(cell => formatExcelCell(cell))
    );

    const sheetData = [headerRow, ...dataRows];
    const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

    await writeXlsxFile(sheetData, {
      fileName: finalFilename,
    });
  } catch (error) {
    logService.error('Error generating Excel file:', error);
    throw error;
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
    logService.error('Failed to convert input to string:', e);
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
    logService.error('Error sanitizing filename:', e);
    return 'unnamed';
  }
}

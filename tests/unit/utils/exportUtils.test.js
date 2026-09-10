// tests/unit/utils/exportUtils.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateCSV,
  downloadFile,
  sanitizeFilename,
  generateExcel,
} from '@/utils/exportUtils.js';

// Mock write-excel-file/browser
const mockWriteXlsxFile = vi.fn().mockResolvedValue(undefined);
vi.mock('write-excel-file/browser', () => ({
  default: mockWriteXlsxFile,
}));

describe('Export Utilities (exportUtils.js)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCSV', () => {
    it('generates standard CSV with 1D row data', () => {
      const headers = ['Gene', 'Score', 'Inheritance'];
      const data = ['PKD1', 8.5, 'Dominant'];

      const csv = generateCSV(headers, data);
      expect(csv).toBe('Gene,Score,Inheritance\nPKD1,8.5,Dominant');
    });

    it('generates multi-line CSV with 2D array data', () => {
      const headers = ['Gene', 'Score'];
      const data = [
        ['PKD1', 8.5],
        ['COL4A5', 9.1],
        ['HNF1B', 7.2],
      ];

      const csv = generateCSV(headers, data);
      const expected = 'Gene,Score\nPKD1,8.5\nCOL4A5,9.1\nHNF1B,7.2';
      expect(csv).toBe(expected);
    });

    it('properly quotes headers containing commas', () => {
      const headers = ['Gene Symbol', 'Variant, Position', 'Combined Score'];
      const data = ['PKD1', 'chr16:2138714', 9.5];

      const csv = generateCSV(headers, data);
      expect(csv).toBe('Gene Symbol,"Variant, Position",Combined Score\nPKD1,chr16:2138714,9.5');
    });

    it('properly quotes data values containing commas', () => {
      const headers = ['Gene', 'Phenotypes'];
      const data = ['PKD1', 'Polycystic kidney, hepatic cysts, hypertension'];

      const csv = generateCSV(headers, data);
      expect(csv).toBe('Gene,Phenotypes\nPKD1,"Polycystic kidney, hepatic cysts, hypertension"');
    });

    it('substitutes null and undefined values with "NA"', () => {
      const headers = ['Gene', 'gnomADe', 'gnomADg', 'CADD'];
      const data = ['PKD1', null, undefined, 25.4];

      const csv = generateCSV(headers, data);
      expect(csv).toBe('Gene,gnomADe,gnomADg,CADD\nPKD1,NA,NA,25.4');
    });

    it('handles multi-row 2D data with mixed NA and quoted values', () => {
      const headers = ['ID', 'Desc', 'Value'];
      const data = [
        ['1', 'Normal, typical', 10],
        ['2', null, 20],
        ['3', undefined, 'A, B'],
      ];

      const csv = generateCSV(headers, data);
      expect(csv).toBe('ID,Desc,Value\n1,"Normal, typical",10\n2,NA,20\n3,NA,"A, B"');
    });
  });

  describe('sanitizeFilename', () => {
    it('replaces forbidden filesystem characters [\\/:*?"<>|] with underscores', () => {
      const dirty = 'file\\name/with:bad*chars?"<>|test';
      const clean = sanitizeFilename(dirty);
      expect(clean).not.toMatch(/[\\/:*?"<>|]/);
      expect(clean).toBe('file_name_with_bad_chars_test');
    });

    it('replaces spaces with underscores and collapses multiple underscores', () => {
      const dirty = 'my   sample    result___export';
      const clean = sanitizeFilename(dirty);
      expect(clean).toBe('my_sample_result_export');
    });

    it('collapses multiple consecutive dashes', () => {
      const dirty = 'sample---data---variant';
      const clean = sanitizeFilename(dirty);
      expect(clean).toBe('sample-data-variant');
    });

    it('truncates strings longer than 50 characters', () => {
      const veryLong = 'a'.repeat(80);
      const clean = sanitizeFilename(veryLong);
      expect(clean.length).toBe(50);
      expect(clean).toBe('a'.repeat(50));
    });

    it('returns empty string for null, undefined, or empty string input', () => {
      expect(sanitizeFilename(null)).toBe('');
      expect(sanitizeFilename(undefined)).toBe('');
      expect(sanitizeFilename('')).toBe('');
    });

    it('safely converts numbers or other primitives to string', () => {
      expect(sanitizeFilename(12345)).toBe('12345');
      expect(sanitizeFilename(true)).toBe('true');
    });
  });

  describe('generateExcel', () => {
    it('transforms 1D and 2D data into typed write-excel-file schema', async () => {
      const headers = ['Gene', 'Score', 'IsCandidate', 'Notes'];
      const data = [
        ['PKD1', 8.5, true, 'Confirmed pathogenic'],
        ['COL4A5', null, false, ''],
      ];
      const filename = 'results_test';

      await generateExcel(headers, data, filename);

      expect(mockWriteXlsxFile).toHaveBeenCalledTimes(1);
      const [sheetData, options] = mockWriteXlsxFile.mock.calls[0];

      // Filename receives .xlsx extension automatically
      expect(options.fileName).toBe('results_test.xlsx');

      // Header row styling
      expect(sheetData[0]).toEqual([
        { value: 'Gene', fontWeight: 'bold', backgroundColor: '#f5f5f5' },
        { value: 'Score', fontWeight: 'bold', backgroundColor: '#f5f5f5' },
        { value: 'IsCandidate', fontWeight: 'bold', backgroundColor: '#f5f5f5' },
        { value: 'Notes', fontWeight: 'bold', backgroundColor: '#f5f5f5' },
      ]);

      // Row 1 types: String, Number, Boolean, String
      expect(sheetData[1]).toEqual([
        { value: 'PKD1', type: String },
        { value: 8.5, type: Number },
        { value: true, type: Boolean },
        { value: 'Confirmed pathogenic', type: String },
      ]);

      // Row 2 types: null/empty mapped to 'NA' String
      expect(sheetData[2]).toEqual([
        { value: 'COL4A5', type: String },
        { value: 'NA', type: String },
        { value: false, type: Boolean },
        { value: 'NA', type: String },
      ]);
    });

    it('handles existing .xlsx extension without duplicating it', async () => {
      await generateExcel(['Gene'], ['PKD1'], 'report.xlsx');
      const [, options] = mockWriteXlsxFile.mock.calls[0];
      expect(options.fileName).toBe('report.xlsx');
    });
  });

  describe('downloadFile', () => {
    it('creates anchor element, triggers click, and cleans up URL', () => {
      vi.useFakeTimers();
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      downloadFile('col1,col2\nval1,val2', 'test.csv', 'text/csv');

      expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalledTimes(1);

      const createdLink = appendChildSpy.mock.calls[0][0];
      expect(createdLink.tagName).toBe('A');
      expect(createdLink.download).toBe('test.csv');
      expect(createdLink.href).toContain('blob:mock-url');

      // Advance timers to trigger cleanup
      vi.advanceTimersByTime(200);
      expect(removeChildSpy).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});

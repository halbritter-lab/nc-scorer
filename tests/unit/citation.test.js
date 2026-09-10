import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import packageJson from '../../package.json';

const rootDir = path.resolve(__dirname, '../../');
const citationPath = path.join(rootDir, 'CITATION.cff');
const zenodoPath = path.join(rootDir, '.zenodo.json');
const readmePath = path.join(rootDir, 'README.md');
const faqPath = path.join(rootDir, 'docs/faq.md');
const citationDocPath = path.join(rootDir, 'docs/guide/citation.md');

const PREPRINT_DOI = '10.1101/2025.09.29.25336840';

describe('Citation & Research Best Practices Metadata', () => {
  describe('CITATION.cff Specification (v1.2.0)', () => {
    it('exists and is valid YAML', () => {
      expect(fs.existsSync(citationPath)).toBe(true);
      const content = fs.readFileSync(citationPath, 'utf8');
      const parsed = yaml.parse(content);
      expect(parsed).toBeTypeOf('object');
      expect(parsed).not.toBeNull();
    });

    it('declares cff-version 1.2.0 and software type', () => {
      const parsed = yaml.parse(fs.readFileSync(citationPath, 'utf8'));
      expect(parsed['cff-version']).toBe('1.2.0');
      expect(parsed.type).toBe('software');
      expect(parsed.title).toBe('NC-Scorer');
      expect(parsed.license).toBe('MIT');
    });

    it('strictly matches the version declared in package.json', () => {
      const parsed = yaml.parse(fs.readFileSync(citationPath, 'utf8'));
      expect(parsed.version).toBe(packageJson.version);
    });

    it('includes all primary research authors with ORCIDs', () => {
      const parsed = yaml.parse(fs.readFileSync(citationPath, 'utf8'));
      expect(Array.isArray(parsed.authors)).toBe(true);
      expect(parsed.authors.length).toBeGreaterThanOrEqual(5);

      const familyNames = parsed.authors.map((a) => a['family-names']);
      expect(familyNames).toContain('Rank');
      expect(familyNames).toContain('Lukassen');
      expect(familyNames).toContain('Anderegg');
      expect(familyNames).toContain('Eckardt');
      expect(familyNames).toContain('Halbritter');
      expect(familyNames).toContain('Popp');

      const popp = parsed.authors.find((a) => a['family-names'] === 'Popp');
      expect(popp?.orcid).toContain('0000-0002-3679-1081');

      const rank = parsed.authors.find((a) => a['family-names'] === 'Rank');
      expect(rank?.orcid).toContain('0000-0002-5984-4836');

      const halbritter = parsed.authors.find((a) => a['family-names'] === 'Halbritter');
      expect(halbritter?.orcid).toContain('0000-0002-1377-9880');
    });

    it('contains preferred-citation pointing to the medRxiv publication', () => {
      const parsed = yaml.parse(fs.readFileSync(citationPath, 'utf8'));
      const preferred = parsed['preferred-citation'];
      expect(preferred).toBeDefined();
      expect(preferred.type).toBe('article');
      expect(preferred.doi).toBe(PREPRINT_DOI);
      expect(preferred.journal).toBe('medRxiv');
      expect(preferred.title).toContain('Automatic variant prioritization');
    });

    it('includes identifiers linking the preprint DOI and repository', () => {
      const parsed = yaml.parse(fs.readFileSync(citationPath, 'utf8'));
      expect(Array.isArray(parsed.identifiers)).toBe(true);
      const doiIdentifier = parsed.identifiers.find((i) => i.type === 'doi');
      expect(doiIdentifier?.value).toBe(PREPRINT_DOI);
    });
  });

  describe('.zenodo.json Integration', () => {
    it('exists and is valid JSON', () => {
      expect(fs.existsSync(zenodoPath)).toBe(true);
      const raw = fs.readFileSync(zenodoPath, 'utf8');
      const data = JSON.parse(raw);
      expect(data).toBeTypeOf('object');
      expect(data.upload_type).toBe('software');
      expect(data.license).toBe('MIT');
    });

    it('includes creators with ORCID identifiers and affiliations', () => {
      const data = JSON.parse(fs.readFileSync(zenodoPath, 'utf8'));
      expect(Array.isArray(data.creators)).toBe(true);
      const creatorNames = data.creators.map((c) => c.name);
      expect(creatorNames.some((n) => n.includes('Rank'))).toBe(true);
      expect(creatorNames.some((n) => n.includes('Popp'))).toBe(true);

      const popp = data.creators.find((c) => c.name.includes('Popp'));
      expect(popp?.orcid).toBe('0000-0002-3679-1081');
    });

    it('links the preprint publication as related identifier', () => {
      const data = JSON.parse(fs.readFileSync(zenodoPath, 'utf8'));
      expect(Array.isArray(data.related_identifiers)).toBe(true);
      const preprintRel = data.related_identifiers.find(
        (r) => r.identifier.includes(PREPRINT_DOI) && r.relation === 'isDescribedBy'
      );
      expect(preprintRel).toBeDefined();
    });
  });

  describe('Documentation & README Citation Consistency', () => {
    it('README.md includes Zenodo badge, preprint badge, and citation section without broken 404s', () => {
      const readme = fs.readFileSync(readmePath, 'utf8');
      expect(readme).toContain('Zenodo');
      expect(readme).toContain(PREPRINT_DOI);
      expect(readme).toContain('github/v/tag');
      expect(readme).toContain('github/v/release');
      expect(readme).not.toContain('zenodo.org/badge/latestdoi');
      expect(readme).not.toContain('zenodo.org/badge/745544900');
      expect(readme).toContain('## 📚 Citation');
      expect(readme).toContain('@article{rank2025nephro');
      expect(readme).toContain('@software{nc_scorer');
      expect(readme).toContain('CITATION.cff');
    });

    it('docs/faq.md references the preprint and software citation without placeholders or 404s', () => {
      const faq = fs.readFileSync(faqPath, 'utf8');
      expect(faq).toContain(PREPRINT_DOI);
      expect(faq).not.toContain('Citation details to be added after publication');
      expect(faq).not.toContain('zenodo.org/badge/latestdoi');
      expect(faq).toContain('guide/citation');
    });

    it('docs/guide/citation.md provides full citation guide with BibTeX and no broken 404s', () => {
      expect(fs.existsSync(citationDocPath)).toBe(true);
      const doc = fs.readFileSync(citationDocPath, 'utf8');
      expect(doc).toContain(PREPRINT_DOI);
      expect(doc).toContain('## Primary Research Publication');
      expect(doc).toContain('## Software Archive & Versioned Tool');
      expect(doc).not.toContain('zenodo.org/badge/latestdoi');
      expect(doc).toContain('@article{rank2025nephro');
      expect(doc).toContain('@software{nc_scorer');
      expect(doc).toContain('CITATION.cff');
    });
  });
});

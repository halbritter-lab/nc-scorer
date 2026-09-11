export const UNSUPPORTED_ASSEMBLY_MESSAGE =
  'Unsupported genome assembly. Choose GRCh37 or GRCh38.';

/** Return the canonical supported assembly, or null for unsupported input. */
export function normalizeAssembly(assembly) {
  if (typeof assembly !== 'string') return null;
  switch (assembly.trim().toUpperCase()) {
    case 'GRCH37':
      return 'GRCh37';
    case 'GRCH38':
      return 'GRCh38';
    default:
      return null;
  }
}

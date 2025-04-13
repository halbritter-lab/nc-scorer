/**
 * Utility functions for working with transcript data in variant annotations
 */

/**
 * Prioritizes transcripts based on:
 * 1. MANE Select transcript status
 * 2. Impact severity (HIGH > MODERATE > LOW > MODIFIER)
 * 3. First transcript in the list as fallback
 *
 * @param {Array} transcripts - Array of transcript consequences from variant annotation
 * @returns {Object|null} - The prioritized transcript, or null if no transcripts
 */
export function prioritizeTranscript(transcripts) {
  if (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0) {
    return null;
  }

  const impactPriority = {
    HIGH: 4,
    MODERATE: 3,
    LOW: 2,
    MODIFIER: 1,
  };

  // First try to find MANE Select transcripts
  const maneSelectTranscripts = transcripts.filter(
    (tc) => tc.mane && tc.mane.includes('MANE_Select')
  );

  // If we have MANE Select transcripts, prioritize by impact
  if (maneSelectTranscripts.length > 0) {
    maneSelectTranscripts.sort((a, b) => {
      return (impactPriority[b.impact] || 0) - (impactPriority[a.impact] || 0);
    });
    return maneSelectTranscripts[0];
  }

  // If no MANE Select, prioritize all transcripts by impact
  const sortedTranscripts = [...transcripts].sort((a, b) => {
    return (impactPriority[b.impact] || 0) - (impactPriority[a.impact] || 0);
  });

  // Return the transcript with highest impact or first one as fallback
  return sortedTranscripts.length > 0 ? sortedTranscripts[0] : null;
}

/**
 * Formats transcript options for display in dropdown
 * 
 * @param {Array} transcripts - Array of transcript consequences from variant annotation
 * @returns {Array} - Array of formatted dropdown items with title, value, and metadata
 */
export function formatTranscriptOptions(transcripts) {
  if (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0) {
    return [];
  }

  return transcripts.map(transcript => {
    const isMANE = transcript.mane && transcript.mane.includes('MANE_Select');
    const geneSymbol = transcript.gene_symbol || '';
    const impact = transcript.impact || '';
    
    return {
      title: `${transcript.transcript_id}${geneSymbol ? ` (${geneSymbol})` : ''}${isMANE ? ' ★' : ''}`,
      value: transcript.transcript_id,
      mane: isMANE,
      impact: impact,
      gene: geneSymbol
    };
  });
}

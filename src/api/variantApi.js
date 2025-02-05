import variantLinker from 'variant-linker'; // Import the default export

export async function queryVariant(variantInput) {
  if (typeof variantLinker.processVariantLinking !== 'function') {
    throw new Error('processVariantLinking is not a function. Check the module exports.');
  }
  return await variantLinker.analyzeVariant({
    variant: variantInput
  });
}
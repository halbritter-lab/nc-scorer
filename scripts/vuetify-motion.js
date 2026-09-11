import postcss from 'postcss';

const vuetifyCssPattern = /[\\/]vuetify[\\/]lib[\\/].*\.css$/;
const layoutProperty =
  /^(?:(?:min|max)-)?(?:width|height)$|^(?:padding|margin)(?:-[a-z-]+)?$|^(?:left|right|top|bottom)$/i;

// Keep framework sizing rules, but update layout immediately. Parse transition
// lists so commas inside timing functions and safe opacity/transform/color
// transitions remain intact. CSS overrides would retain the original animation
// declarations in the emitted stylesheet.
export function vuetifyMotionPlugin() {
  return {
    name: 'nc-scorer-vuetify-motion',
    enforce: 'pre',
    transform(code, id) {
      if (!vuetifyCssPattern.test(id.split('?')[0])) return;
      const stylesheet = postcss.parse(code, { from: id });
      let changed = false;
      stylesheet.walkDecls(/^transition(?:-property)?$/i, (declaration) => {
        const items = postcss.list.comma(declaration.value);
        const safeItems = items.filter(
          (item) =>
            !postcss.list
              .space(item)
              .some((token) => layoutProperty.test(token)),
        );
        if (safeItems.length === items.length) return;
        declaration.value = safeItems.join(', ') || 'none';
        changed = true;
      });
      if (changed) return { code: stylesheet.toString(), map: null };
    },
  };
}

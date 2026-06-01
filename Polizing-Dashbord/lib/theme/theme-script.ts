/**
 * Inline script ejecutado antes de la hidratación para evitar el FOUC del tema:
 * lee `polizing-theme` de localStorage y setea `data-theme` en <html> antes de
 * que React renderice. Mantener sincronizado con `STORAGE_KEY` de
 * `lib/theme/theme-provider.tsx`.
 */
export const THEME_INIT_SCRIPT = `
(function(){try{var t=localStorage.getItem('polizing-theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}}catch(_){}})();
`.trim();

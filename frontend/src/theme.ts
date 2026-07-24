export const applyTheme = (theme: any) => {
  const root = document.documentElement;
  const opacity = theme?.opacity !== undefined ? theme.opacity : 0.08;
  const blur = theme?.blur !== undefined ? theme.blur : 24;
  const borderOpacity = theme?.borderOpacity !== undefined ? theme.borderOpacity : 0.15;
  const saturate = theme?.saturate !== undefined ? theme.saturate : 180;

  root.style.setProperty('--glass-bg-opacity', String(opacity));
  root.style.setProperty('--glass-blur', `${blur}px`);
  root.style.setProperty('--glass-border-opacity', String(borderOpacity));
  root.style.setProperty('--glass-saturate', `${saturate}%`);
  
  const bgImg = (!theme?.bgImage || theme.bgImage === 'none')
    ? 'none'
    : theme.bgImage;
  root.style.setProperty('--bg-image', bgImg === 'none' ? 'none' : `url('${bgImg}')`);

  // Dynamically inject stylesheet rules with hardcoded values for backdrop-filter.
  let styleEl = document.getElementById('dynamic-glass-blur-styles') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-glass-blur-styles';
    document.head.appendChild(styleEl);
  }

  const glassClasses = [
    '.glass-panel',
    '.glass-panel-dark',
    '.premium-card',
    '.bg-\\[\\#06070a\\]',
    '.bg-\\[\\#08090e\\]',
    '.bg-\\[\\#0d1018\\]',
    '.bg-\\[\\#0f121a\\]',
    '.bg-\\[\\#141824\\]',
    '.bg-\\[\\#181d2f\\]',
    '.bg-\\[\\#0c101d\\]', 
    '.bg-\\[\\#080b12\\]', 
    '.bg-\\[\\#090b11\\]', 
    '.bg-\\[\\#0a0d16\\]', 
    '.bg-\\[\\#0B0F19\\]', 
    '.bg-\\[\\#070b14\\]', 
    '.bg-\\[\\#070B14\\]', 
    '.bg-\\[\\#0b0f19\\]', 
    '.bg-\\[\\#0a0d15\\]', 
    '.bg-\\[\\#0A0D1A\\]', 
    '.bg-\\[\\#101b2e\\]', 
    '.bg-\\[\\#101B2E\\]', 
    '.bg-\\[\\#111827\\]', 
    '.bg-\\[\\#151f32\\]', 
    '.bg-\\[\\#0F172A\\]', 
    '.bg-slate-900\\/50',
    '.bg-slate-900\\/60',
    '.bg-slate-900\\/80',
    '.bg-slate-900\\/90',
    '.bg-slate-950\\/80',
    '.bg-slate-950\\/90',
    '.bg-slate-950\\/50',
    '.bg-slate-900',
    '.bg-slate-950',
    '.bg-slate-850',
    '.bg-slate-800'
  ];

  styleEl.innerHTML = `
    ${glassClasses.join(',\n')} {
      background-color: rgba(${theme?.bgColorRGB || '255, 255, 255'}, ${opacity}) !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      border-color: rgba(255, 255, 255, ${borderOpacity}) !important;
    }
  `;
};

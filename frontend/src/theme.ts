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
    '.premium-card'
  ];

  styleEl.innerHTML = `
    ${glassClasses.join(',\n')} {
      background-color: rgba(${theme?.bgColorRGB || '255, 255, 255'}, ${opacity});
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border-color: rgba(255, 255, 255, ${borderOpacity});
    }
  `;
};

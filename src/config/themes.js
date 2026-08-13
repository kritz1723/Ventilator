// Selectable display themes. Each theme overrides the palette tokens
// declared in index.css; `id` is written to data-theme on the root element.
export const THEMES = [
  { id: 'midnight', label: 'Midnight', swatch: ['#070910', '#4cc4f5'] },
  { id: 'slate', label: 'Slate', swatch: ['#151a21', '#7fd1c5'] },
  { id: 'contrast', label: 'High contrast', swatch: ['#000000', '#ffffff'] },
  { id: 'day', label: 'Day', swatch: ['#eef1f6', '#0d6ea8'] },
]

export const DEFAULT_THEME = 'midnight'

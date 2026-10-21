export type Palette = 'jade' | 'graphite' | 'rice';

const palettes: { id: Palette; number: number; name: string }[] = [
  { id: 'jade', number: 1, name: 'Нефрит и бронза' },
  { id: 'graphite', number: 2, name: 'Графит и электрический янтарь' },
  { id: 'rice', number: 3, name: 'Рисовая бумага, тушь и киноварь' },
];

export default function PalettePicker({ palette, onChange }: { palette: Palette; onChange: (value: Palette) => void }) {
  const selected = palettes.find(item => item.id === palette)!;
  return <details className="palette-picker" name="prototype-controls">
    <summary aria-label={`Палитра ${selected.number}: ${selected.name}`}>
      <span className="palette-swatches" data-palette={palette} aria-hidden="true"><i /><i /><i /></span>
      Палитра {selected.number}<span aria-hidden="true">⌄</span>
    </summary>
    <fieldset className="palette-options">
      <legend className="sr-only">Палитра прототипа</legend>
      {palettes.map(item => <label key={item.id} className={`palette-option type-menu-option ${palette === item.id ? 'is-selected' : ''}`}>
        <input type="radio" name="palette" value={item.id} checked={palette === item.id} onChange={event => {
          onChange(item.id);
          const menu = event.currentTarget.closest('details');
          menu?.removeAttribute('open');
          menu?.querySelector('summary')?.focus();
        }} />
        <span className="palette-swatches" data-palette={item.id} aria-hidden="true"><i /><i /><i /></span>
        <span>{item.number}. {item.name}</span>
        <span className="palette-check" aria-hidden="true">{palette === item.id ? '✓' : ''}</span>
      </label>)}
    </fieldset>
  </details>;
}

import { ZONAS_DANO, type ZonaDano } from '../types'

function etiqueta(zona: ZonaDano): string {
  return zona.charAt(0).toUpperCase() + zona.slice(1)
}

export function DamageCheckboxes({
  selected,
  onChange,
}: {
  selected: ZonaDano[]
  onChange: (zonas: ZonaDano[]) => void
}) {
  function toggle(zona: ZonaDano) {
    if (selected.includes(zona)) {
      onChange(selected.filter((seleccionada) => seleccionada !== zona))
    } else {
      onChange([...selected, zona])
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {ZONAS_DANO.map((zona) => (
        <label key={zona} className="flex items-center gap-2 text-sm font-sans">
          <input type="checkbox" checked={selected.includes(zona)} onChange={() => toggle(zona)} />
          {etiqueta(zona)}
        </label>
      ))}
    </div>
  )
}

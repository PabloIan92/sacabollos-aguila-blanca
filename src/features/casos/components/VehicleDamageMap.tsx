import React from 'react'
import { Stage, Layer, Rect, Circle, Text, Group, Line } from 'react-konva'
import type { ReparacionDano, ZonaDano } from '../types'

export interface VehicleDamageMapProps {
  damages: ReparacionDano[]
  onAdd?: (coords: { x: number; y: number; zona: ZonaDano }) => void
  onToggleRepaired?: (damage: ReparacionDano) => void
  onDelete?: (damageId: string) => void
  readonly?: boolean
  width?: number
  height?: number
}

function detectZone(x: number, y: number): ZonaDano {
  if (y < 0.2) return 'paragolpes delantero'
  if (y > 0.8) return 'paragolpes trasero'
  if (x < 0.3) {
    if (y < 0.45) return 'guardabarros'
    if (y < 0.65) return 'puerta delantera izquierda'
    return 'puerta trasera izquierda'
  }
  if (x > 0.7) {
    if (y < 0.45) return 'guardabarros'
    if (y < 0.65) return 'puerta delantera derecha'
    return 'puerta trasera derecha'
  }
  if (y < 0.45) return 'capot'
  if (y < 0.7) return 'techo'
  return 'baul'
}

export function VehicleDamageMap({
  damages,
  onAdd,
  onToggleRepaired,
  onDelete,
  readonly = false,
  width = 320,
  height = 400,
}: VehicleDamageMapProps) {
  const handleStageClick = (e: any) => {
    if (readonly || !onAdd) return
    const stage = e.target.getStage ? e.target.getStage() : e.currentTarget
    const pos = stage && stage.getPointerPosition ? stage.getPointerPosition() : null
    const stageWidth = (stage && stage.width && stage.width()) || width
    const stageHeight = (stage && stage.height && stage.height()) || height

    const clientX = pos ? pos.x : e.clientX || 0
    const clientY = pos ? pos.y : e.clientY || 0

    const normX = Math.max(0, Math.min(1, Number((clientX / stageWidth).toFixed(4))))
    const normY = Math.max(0, Math.min(1, Number((clientY / stageHeight).toFixed(4))))

    const zona = detectZone(normX, normY)
    onAdd({ x: normX, y: normY, zona })
  }

  return (
    <div className="flex flex-col gap-4 font-sans">
      <div className="relative border-2 border-graphite rounded bg-steel-100 p-2 flex justify-center items-center select-none overflow-hidden">
        <Stage
          width={width}
          height={height}
          onClick={handleStageClick}
          onPointerDown={handleStageClick}
          data-testid="konva-stage"
        >
          <Layer data-testid="konva-layer">
            {/* Silueta esquemática del vehículo */}
            {/* Paragolpes delantero */}
            <Rect
              x={width * 0.2}
              y={height * 0.05}
              width={width * 0.6}
              height={height * 0.08}
              cornerRadius={8}
              fill="#e2e8f0"
              stroke="#0f172a"
              strokeWidth={2}
            />
            {/* Capot */}
            <Rect
              x={width * 0.22}
              y={height * 0.14}
              width={width * 0.56}
              height={height * 0.2}
              cornerRadius={4}
              fill="#f8fafc"
              stroke="#0f172a"
              strokeWidth={2}
            />
            {/* Techo y habitáculo */}
            <Rect
              x={width * 0.25}
              y={height * 0.36}
              width={width * 0.5}
              height={height * 0.32}
              cornerRadius={6}
              fill="#f1f5f9"
              stroke="#0f172a"
              strokeWidth={2}
            />
            {/* Baúl */}
            <Rect
              x={width * 0.22}
              y={height * 0.7}
              width={width * 0.56}
              height={height * 0.16}
              cornerRadius={4}
              fill="#f8fafc"
              stroke="#0f172a"
              strokeWidth={2}
            />
            {/* Paragolpes trasero */}
            <Rect
              x={width * 0.2}
              y={height * 0.88}
              width={width * 0.6}
              height={height * 0.07}
              cornerRadius={8}
              fill="#e2e8f0"
              stroke="#0f172a"
              strokeWidth={2}
            />
            {/* Laterales / Puertas */}
            <Line
              points={[width * 0.2, height * 0.15, width * 0.2, height * 0.87]}
              stroke="#0f172a"
              strokeWidth={2}
            />
            <Line
              points={[width * 0.8, height * 0.15, width * 0.8, height * 0.87]}
              stroke="#0f172a"
              strokeWidth={2}
            />

            {/* Marcadores de daños */}
            {damages.map((d) => {
              const mx = d.x * width
              const my = d.y * height
              return (
                <Group
                  key={d.id}
                  x={mx}
                  y={my}
                  onClick={(e) => {
                    e.cancelBubble = true
                    if (!readonly && onToggleRepaired) onToggleRepaired(d)
                  }}
                >
                  <Circle
                    radius={10}
                    fill={d.reparado ? '#16a34a' : '#dc2626'}
                    stroke="#ffffff"
                    strokeWidth={2}
                    data-testid={`marker-reparado-${d.id}`}
                    data-reparado={d.reparado ? 'true' : 'false'}
                  />
                  <Text
                    text={d.reparado ? '✓' : '!'}
                    x={-4}
                    y={-5}
                    fontSize={11}
                    fontStyle="bold"
                    fill="#ffffff"
                  />
                </Group>
              )
            })}
          </Layer>
        </Stage>
      </div>

      {/* Lista accesible de daños debajo del croquis */}
      <div className="bg-white border-2 border-graphite p-3 rounded">
        <h3 className="font-mono text-xs uppercase font-bold text-steel-700 mb-2">
          Daños del caso ({damages.length})
        </h3>
        {damages.length === 0 ? (
          <p className="text-sm text-steel-600">No hay daños registrados en este caso.</p>
        ) : (
          <ul className="divide-y divide-steel-200">
            {damages.map((d) => (
              <li
                key={d.id}
                className="py-2 flex items-center justify-between gap-2 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-bold capitalize">{d.zona}</span>
                  {d.descripcion && (
                    <span className="text-xs text-steel-600">{d.descripcion}</span>
                  )}
                  {d.origen_inspeccion && (
                    <span className="text-xs text-blue font-mono font-medium">
                      Inspección previa
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={readonly}
                    onClick={() => onToggleRepaired && onToggleRepaired(d)}
                    className={`px-2 py-1 text-xs rounded border font-mono font-semibold cursor-pointer ${
                      d.reparado
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                        : 'bg-amber-100 text-amber-800 border-amber-400'
                    } ${readonly ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {d.reparado ? 'Reparado ✓' : 'Marcar reparado'}
                  </button>

                  {!readonly && onDelete && (
                    <button
                      type="button"
                      aria-label={`Eliminar daño ${d.zona}`}
                      onClick={() => onDelete(d.id)}
                      className="px-2 py-1 text-xs bg-red-50 text-red border border-red rounded hover:bg-red hover:text-white cursor-pointer"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

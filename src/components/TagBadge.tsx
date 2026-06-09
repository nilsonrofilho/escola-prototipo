// ============================================================================
// TagBadge.tsx — etiqueta colorida (cor determinística pelo texto).
// Opcionalmente mostra um "x" para remover.
// ============================================================================
import { corDaTag } from '@/lib/types'

interface Props {
  tag: string
  onRemove?: () => void
}

export function TagBadge({ tag, onRemove }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${corDaTag(tag)}`}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full leading-none opacity-60 hover:opacity-100"
          aria-label={`Remover tag ${tag}`}
        >
          ×
        </button>
      )}
    </span>
  )
}

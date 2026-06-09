// ============================================================================
// TagInput.tsx — editor de tags livres. Digite e Enter (ou vírgula) para criar;
// clique no × para remover. Sugere tags já existentes em outros leads.
// ============================================================================
import { useState } from 'react'
import { TagBadge } from '@/components/TagBadge'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
  sugestoes?: string[] // tags já usadas em outros leads (autocompletar)
}

export function TagInput({ tags, onChange, sugestoes = [] }: Props) {
  const [texto, setTexto] = useState('')

  function adicionar(raw: string) {
    const t = raw.trim().toLowerCase()
    if (!t) return
    if (tags.includes(t)) {
      setTexto('')
      return
    }
    onChange([...tags, t])
    setTexto('')
  }

  function remover(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      adicionar(texto)
    } else if (e.key === 'Backspace' && !texto && tags.length) {
      // Backspace com input vazio remove a última tag.
      remover(tags[tags.length - 1])
    }
  }

  // Sugestões ainda não aplicadas a este lead.
  const sugestoesFiltradas = sugestoes
    .filter((s) => !tags.includes(s))
    .filter((s) => (texto ? s.includes(texto.trim().toLowerCase()) : true))
    .slice(0, 6)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-slate-300 p-2 focus-within:border-inter focus-within:ring-1 focus-within:ring-inter">
        {tags.map((t) => (
          <TagBadge key={t} tag={t} onRemove={() => remover(t)} />
        ))}
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={tags.length ? '' : 'Digite uma tag e Enter…'}
          className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {sugestoesFiltradas.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          <span className="text-xs text-slate-400">Sugestões:</span>
          {sugestoesFiltradas.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => adicionar(s)}
              className="text-xs text-inter underline-offset-2 hover:underline"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

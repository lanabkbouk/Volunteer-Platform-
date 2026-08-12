import { Pencil, Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import Chip from '../ui/Chip'
import { CARD_BASE } from '../../utils/surfaceStyles'
import { getCategoryLabel } from '../../utils/categoryStyles'

export default function SkillRow({ skill, onEdit, onDelete, isDeleting }) {
  return (
    <div className={`${CARD_BASE} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
      <div className="flex items-center gap-2 min-w-0">
        <h3 className="font-semibold text-heading truncate">{skill.name}</h3>
        {skill.category?.name && <Chip color="blue">{getCategoryLabel(skill.category.name)}</Chip>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="small" onClick={() => onEdit(skill)} className="min-h-11 min-w-11" aria-label={`Edit ${skill.name}`}>
          <Pencil size={16} />
        </Button>
        <Button
          variant="ghost"
          size="small"
          disabled={isDeleting}
          onClick={() => onDelete(skill)}
          className="min-h-11 min-w-11 text-danger hover:bg-danger/10"
          aria-label={`Delete ${skill.name}`}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  )
}
// Dotted rounded square with a + used by admins to add a playlist, video or attachment.
export function AddTile({ label, onClick, variant = 'row' }: { label: string; onClick: () => void; variant?: 'card' | 'row' }) {
  return (
    <button type="button" className={`add-tile add-tile--${variant}`} onClick={onClick}>
      <span className="add-tile__plus" aria-hidden="true">+</span>
      <span>{label}</span>
    </button>
  )
}

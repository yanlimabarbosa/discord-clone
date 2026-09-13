import { useState, type DragEvent, type KeyboardEvent } from 'react';
import { ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { Tooltip } from '../../components/tooltip';
import { useRenameCategory } from '../../hooks/channels/use-rename-category';
import { useDeleteCategory } from '../../hooks/channels/use-delete-category';
import type { ChannelCategory } from '../../types/channel-category';

type CategoryHeaderProps = {
  category: ChannelCategory;
  serverId: string;
  canManage: boolean;
  collapsed: boolean;
  isDragOver: boolean;
  onToggle: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: () => void;
  onDragLeave: () => void;
};

export function CategoryHeader({
  category,
  serverId,
  canManage,
  collapsed,
  isDragOver,
  onToggle,
  onDragOver,
  onDrop,
  onDragLeave,
}: CategoryHeaderProps) {
  const rename = useRenameCategory(serverId);
  const del = useDeleteCategory(serverId);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  function commit() {
    const value = name.trim();
    if (value && value !== category.name) {
      rename.mutate({ categoryId: category.id, name: value });
    } else {
      setName(category.name);
    }
    setEditing(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') {
      setName(category.name);
      setEditing(false);
    }
  }

  return (
    <div
      className={`category-header ${isDragOver ? 'category-drop-active' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
    >
      <button className="category-toggle" onClick={onToggle}>
        {collapsed ? (
          <ChevronRight size={12} />
        ) : (
          <ChevronDown size={12} />
        )}
        {editing && canManage ? (
          <input
            className="category-name-input"
            value={name}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
          />
        ) : (
          <span
            className="category-name"
            onDoubleClick={(e) => {
              if (!canManage) return;
              e.stopPropagation();
              setEditing(true);
            }}
          >
            {category.name}
          </span>
        )}
      </button>
      {canManage && (
        <Tooltip label="Delete category">
          <button
            className="category-delete"
            aria-label={`Delete category ${category.name}`}
            onClick={() => del.mutate(category.id)}
            disabled={del.isPending}
          >
            <Trash2 size={13} />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

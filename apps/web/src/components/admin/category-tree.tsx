'use client';

import { useState } from 'react';
import { Category } from '@/lib/api/categories';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { Badge } from '@nextpik/ui';

interface CategoryTreeProps {
  categories: Category[];
  onSelect?: (category: Category) => void;
  selectedId?: string;
}

export function CategoryTree({ categories, onSelect, selectedId }: CategoryTreeProps) {
  return (
    <div className="space-y-1">
      {categories.map((category) => (
        <CategoryTreeNode
          key={category.id}
          category={category}
          onSelect={onSelect}
          selectedId={selectedId}
          depth={0}
        />
      ))}
    </div>
  );
}

function CategoryTreeNode({
  category,
  onSelect,
  selectedId,
  depth,
}: {
  category: Category;
  onSelect?: (category: Category) => void;
  selectedId?: string;
  depth: number;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedId === category.id;

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer
          hover:bg-gray-100 transition-colors
          ${isSelected ? 'bg-blue-100 hover:bg-blue-200' : ''}
        `}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => onSelect?.(category)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {isExpanded ? (
          <FolderOpen className="h-5 w-5 text-blue-500" />
        ) : (
          <Folder className="h-5 w-5 text-gray-500" />
        )}

        <span className="flex-1 text-sm font-medium">{category.name}</span>

        {category._count?.products && category._count.products > 0 && (
          <Badge variant="secondary" className="text-xs">
            {category._count.products} products
          </Badge>
        )}

        <Badge variant="outline" className="text-xs">
          L{depth + 1}
        </Badge>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {category.children?.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              onSelect={onSelect}
              selectedId={selectedId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import GalleryCard from './GalleryCard';
import EmptyState from './EmptyState';

const GalleryGrid = ({
  mediaList,
  loading = false,
  onItemClick,
  isAdminMode = false,
  onEditClick,
  onDeleteClick,
  onReorder,
  onReorderEnd,
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Loading skeleton card renderer
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-2xl overflow-hidden border border-gray-150 animate-pulse space-y-4 p-4">
            <div className="aspect-video bg-gray-200 rounded-xl" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded-md w-3/4" />
              <div className="h-3 bg-gray-250 rounded-md w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!mediaList || mediaList.length === 0) {
    return (
      <EmptyState
        title="No gallery items found"
        message="There are no photos or videos uploaded for this selection yet."
      />
    );
  }

  // HTML5 Drag and Drop event handlers
  const handleDragStart = (e, index) => {
    if (!isAdminMode || !onReorder) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    if (!isAdminMode || !onReorder || draggedIndex === null || draggedIndex === index) return;
    e.preventDefault();
    
    const reorderedList = [...mediaList];
    const draggedItem = reorderedList[draggedIndex];
    reorderedList.splice(draggedIndex, 1);
    reorderedList.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    onReorder(reorderedList);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    if (onReorderEnd) onReorderEnd();
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {mediaList.map((item, index) => (
        <div
          key={item.id}
          draggable={isAdminMode && !!onReorder}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`${
            draggedIndex === index ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
          } transition-all duration-150`}
        >
          <GalleryCard
            item={item}
            onClick={() => onItemClick && onItemClick(index)}
            isAdminMode={isAdminMode}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
          />
        </div>
      ))}
    </div>
  );
};

export default GalleryGrid;

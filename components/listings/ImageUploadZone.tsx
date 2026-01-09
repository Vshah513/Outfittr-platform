'use client';

import React, { useState, useRef, DragEvent } from 'react';
import Image from 'next/image';

interface ImageUploadZoneProps {
  images: string[];
  maxImages?: number;
  coverIndex: number;
  onImagesChange: (files: File[]) => void;
  onRemove: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onSetCover: (index: number) => void;
  error?: string;
}

export default function ImageUploadZone({
  images,
  maxImages = 5,
  coverIndex,
  onImagesChange,
  onRemove,
  onReorder,
  onSetCover,
  error,
}: ImageUploadZoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length + images.length > maxImages) {
      return;
    }

    onImagesChange(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + images.length > maxImages) {
      return;
    }

    onImagesChange(files);
  };

  const handleImageDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const handleImageDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggingIndex !== null && draggingIndex !== index) {
      onReorder(draggingIndex, index);
      setDraggingIndex(index);
    }
  };

  const handleImageDragEnd = () => {
    setDraggingIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {images.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-vintage cursor-pointer transition-all duration-200
            ${isDraggingOver 
              ? 'border-vintage-primary bg-vintage-paper scale-[1.02]' 
              : 'border-vintage hover:border-vintage-primary bg-vintage-cream'
            }
            ${error ? 'border-red-300' : ''}
          `}
        >
          <div className="py-12 px-6 text-center">
            <div className="mb-3 flex justify-center">
              <svg 
                className="w-12 h-12 text-vintage-muted" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <p className="text-vintage-primary font-medium mb-1">
              Drag photos here or click to browse
            </p>
            <p className="text-xs text-vintage-secondary">
              Upload up to {maxImages} images • JPG, PNG, WEBP
            </p>
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded px-3 py-2 inline-block">
              <p className="text-xs text-amber-900 font-medium flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                The first image will be your marketplace cover
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-vintage-muted">
              {images.length} / {maxImages} photos • Drag to reorder
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-vintage-primary hover:text-black transition-colors font-medium"
              disabled={images.length >= maxImages}
            >
              + Add more
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {images.map((preview, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleImageDragStart(index)}
                onDragOver={(e) => handleImageDragOver(e, index)}
                onDragEnd={handleImageDragEnd}
                className={`
                  relative group cursor-move bg-white rounded-vintage overflow-hidden
                  transition-all duration-200
                  ${draggingIndex === index ? 'opacity-50 scale-95' : 'hover:shadow-md'}
                  ${index === 0 ? 'ring-2 ring-vintage-primary' : 'ring-1 ring-vintage-border'}
                `}
              >
                {/* Cover Badge - Always on first image */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 z-10 bg-vintage-primary text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm">
                    Marketplace Cover
                  </div>
                )}

                {/* Position indicator for other images */}
                {index > 0 && (
                  <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                    #{index + 1}
                  </div>
                )}

                {/* Image */}
                <div className="relative aspect-square">
                  <Image
                    src={preview}
                    alt={`Upload ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded transition-all"
                    title="Remove"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Drag Handle Indicator */}
                <div className="absolute bottom-1 right-1 bg-black/30 rounded p-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helper Text */}
      {images.length > 0 && (
        <div className="bg-vintage-paper border border-vintage rounded-vintage p-3 space-y-2">
          <p className="text-xs text-vintage-muted">
            <strong className="text-vintage-primary">Pro tip:</strong> High-quality photos get 3x more views. 
            Show your item from multiple angles with good lighting.
          </p>
          <p className="text-xs text-vintage-secondary flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Drag images to reorder. The first image is always your marketplace cover.
          </p>
        </div>
      )}
    </div>
  );
}


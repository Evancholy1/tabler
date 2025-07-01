// src/app/setup-layout/components/ColorPicker.tsx
'use client';

import React, { useState } from 'react';
import { SketchPicker, ColorResult } from 'react-color';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  sectionName: string;
}

export default function ColorPicker({ color, onChange, sectionName }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleColorChange = (color: ColorResult) => {
    onChange(color.hex);
  };

  const handleClose = () => {
    setShowPicker(false);
  };

  return (
    <div className="relative">
      {/* Color Card - Click to open picker */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors shadow-sm"
        style={{ backgroundColor: color }}
        title={`Change color for Section ${sectionName}`}
      />
      
      {/* Color Picker Popup */}
      {showPicker && (
        <>
          {/* Backdrop - click to close */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={handleClose}
          />
          
          {/* Picker */}
          <div className="absolute top-10 left-0 z-20">
            <SketchPicker
              color={color}
              onChange={handleColorChange}
              disableAlpha={true}
              presetColors={[
                '#3B82F6', // Blue
                '#10B981', // Green  
                '#8B5CF6', // Purple
                '#EF4444', // Red
                '#F59E0B', // Yellow
                '#EC4899', // Pink
                '#6366F1', // Indigo
                '#F97316', // Orange
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
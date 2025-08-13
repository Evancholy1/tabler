// src/app/setup-layout/SetupLayoutForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ColorPicker from './components/ColorPicker';


// Color options for sections
const SECTION_COLORS = [
  { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500' },
  { name: 'Green', value: '#10B981', bg: 'bg-green-500' },
  { name: 'Purple', value: '#8B5CF6', bg: 'bg-purple-500' },
  { name: 'Red', value: '#EF4444', bg: 'bg-red-500' },
  { name: 'Yellow', value: '#F59E0B', bg: 'bg-yellow-500' },
  { name: 'Pink', value: '#EC4899', bg: 'bg-pink-500' },
  { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-500' },
  { name: 'Gray', value: '#6B7280', bg: 'bg-gray-500' },
];

interface SectionData {
  id: number;
  name: string;
  color: string;
}

interface SetupLayoutFormProps {
  userId?: string; // Optional prop
}

export default function SetupLayoutForm({ userId }: SetupLayoutFormProps = {}) {
  const router = useRouter();
  
  // Form state
  const [tablesWidth, setTablesWidth] = useState<number>(1);
  const [tablesLength, setTablesLength] = useState<number>(1);
  const [numSections, setNumSections] = useState<number>(1);
  const [sections, setSections] = useState<SectionData[]>([
    { id: 1, name: 'A', color: '#3B82F6' },
    // { id: 2, name: 'B', color: '#10B981' },
    // { id: 3, name: 'C', color: '#8B5CF6' },
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update sections when number changes
  const handleSectionsChange = (newNum: number) => {
    setNumSections(newNum);
    
    const currentSections = [...sections];
    
    if (newNum > sections.length) {
      // Add new sections
      for (let i = sections.length; i < newNum; i++) {
        currentSections.push({
          id: i + 1,
          name: String.fromCharCode(65 + i), // A, B, C, D, etc.
          color: SECTION_COLORS[i % SECTION_COLORS.length].value,
        });
      }
    } else {
      // Remove excess sections
      currentSections.splice(newNum);
    }
    
    setSections(currentSections);
  };

  // Update individual section
  const updateSection = (id: number, field: 'name' | 'color', value: string) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      let currentUserId = userId;
      
      // If no userId prop provided, get it from auth
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setErrorMsg('No user found. Please log in again.');
          setIsLoading(false);
          return;
        }
        currentUserId = user.id;
      }

      console.log('Setting up layout for user:', currentUserId);

      // 1. Create the main layout
      const { data: layoutData, error: layoutError } = await supabase
        .from('layouts')
        .insert({
          owner_user_id: currentUserId,
          name: 'Main Layout',
          description: 'Restaurant layout',
          width: tablesWidth,
          height: tablesLength,
        })
        .select()
        .single();

      if (layoutError) {
        throw layoutError;
      }

      // 2. Create sections
      const sectionsToInsert = sections.map(section => ({
        layout_id: layoutData.id,
        name: section.name,
        color: section.color,
        priority_rank: section.id,
        //think this is fine?
    
        customers_served: 0,
      }));

      const { error: sectionsError } = await supabase
        .from('sections')
        .insert(sectionsToInsert);

      if (sectionsError) {
        throw sectionsError;
      }


      // 5. Success! Redirect to next part of setup 
      router.push('/layout-editor');

    } catch (error: any) {
      console.error('Setup error:', error);
      setErrorMsg(error.message || 'An error occurred during setup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-8">Setup</h1>

        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-3 mb-6 rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tables Width */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Number of tables width?
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[1-9]*"
              value={tablesWidth}
              onChange={(e) => {
                const raw = e.target.value;
                const num = parseInt(raw);
                if (!raw) {
                  setTablesWidth(0); // allow clear
                } else if (!isNaN(num)) {
                    setTablesWidth(Math.min(Math.max(num, 1), 20)); // clamp between 1-20
                }
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Tables Length */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Number of tables length?
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[1-9]*"
              value={tablesLength}
              onChange={(e) => {
                const raw = e.target.value;
                const num = parseInt(raw);
                if (!raw) {
                  setTablesLength(0); // allow clear
                } else if (!isNaN(num)) {
                    setTablesLength(Math.min(Math.max(num, 1), 20)); // clamp between 1-20
                }
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Number of Sections */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Sections
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[1-9]*"
              value={numSections}
              onChange={(e) => {
                const raw = e.target.value;
                const num = parseInt(raw);
                if (!raw) {
                  handleSectionsChange(0); // allow clear
                } else if (!isNaN(num)) {
                    handleSectionsChange(Math.min(Math.max(num, 1), 20)); // clamp between 1-20
                }
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Section Names and Colors */}
          {sections.map((section, index) => (
            <div key={section.id}>
              <label className="block text-sm font-medium mb-2">
                Section {section.id} Name
              </label>
              <div className="flex items-center gap-3">
                <ColorPicker
                  color={section.color}
                  onChange={(color) => updateSection(section.id, 'color', color)}
                  sectionName={section.name}
                />
                <input
                  type="text"
                  value={section.name}
                  onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder={`Section ${section.id}`}
                />
              </div>
            </div>
          ))}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Setting up...' : 'Proceed to layout'}
            </button>
          </div>
        </form>

        {/* Preview */}
        <div className="mt-8 p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium mb-3">Preview:</h3>
          <div className="text-sm space-y-1">
            <div>Grid: {tablesWidth} × {tablesLength} tables</div>
            <div>Sections: {sections.length}</div>
            <div className="flex gap-2 mt-2">
              {sections.map(section => (
                <div key={section.id} className="flex items-center gap-1">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: section.color }}
                  />
                  <span className="text-xs">{section.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
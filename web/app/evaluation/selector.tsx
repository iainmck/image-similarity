"use client"

import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

async function getUniqueModels(): Promise<string[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data, error } = await supabase.rpc('get_unique_models');
    
  if (error) {
    console.error('Error fetching unique models:', error);
    return [];
  }
  
  return data;
}

export function ModelSelector(props: { onModelSelect: (model: string) => void }) {
  const [uniqueModels, setUniqueModels] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchModels = async () => {
      const models = await getUniqueModels();
      setUniqueModels(models);
    };
    
    fetchModels();
  }, []);
  
  return (
    <div className="w-full mb-6">
      <label htmlFor="model-select" className="block text-sm font-medium mb-2">
        Select Model
      </label>
      <select 
        id="model-select"
        className="w-full p-2 border rounded"
        onChange={(e) => props.onModelSelect(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>Select a model</option>
        {uniqueModels.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );
}

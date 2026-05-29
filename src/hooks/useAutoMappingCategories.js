import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useAutoMappingCategories = () => {
  const { user } = useAuth();
  const [mappings, setMappings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMappings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_category_mappings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      if (data) setMappings(data);
    } catch (error) {
      console.error("Error fetching category mappings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const saveCategoryMapping = async (description, categoryId) => {
    if (!description || !categoryId || !user) return;
    const normalizedDesc = description.trim().toLowerCase();
    
    try {
      const existing = mappings.find(m => m.description.toLowerCase() === normalizedDesc);

      if (existing && existing.categoria_id === categoryId) return; // No change needed

      if (existing) {
        await supabase
          .from('custom_category_mappings')
          .update({ categoria_id: categoryId })
          .eq('id', existing.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('custom_category_mappings')
          .insert({ 
            user_id: user.id, 
            description: normalizedDesc, 
            categoria_id: categoryId 
          });
      }
      // Refresh mappings in background
      fetchMappings();
    } catch (error) {
      console.error("Error saving category mapping:", error);
    }
  };

  const getSuggestedCategory = useCallback((description) => {
    if (!description || !mappings.length) return null;
    const normalized = description.trim().toLowerCase();
    
    // 1. Exact match
    let match = mappings.find(m => m.description.toLowerCase() === normalized);
    if (match) return match.categoria_id;
    
    // 2. Contains match (fuzzy)
    match = mappings.find(m => 
      normalized.includes(m.description.toLowerCase()) || 
      m.description.toLowerCase().includes(normalized)
    );
    
    return match ? match.categoria_id : null;
  }, [mappings]);

  return { 
    mappings, 
    saveCategoryMapping, 
    getSuggestedCategory, 
    isLoading 
  };
};
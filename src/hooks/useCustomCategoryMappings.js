import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useCustomCategoryMappings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMappings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_category_mappings')
        .select(`*, categories(name, color, icon)`)
        .eq('user_id', user.id);
      
      if (error) throw error;
      setMappings(data || []);
    } catch (error) {
      console.error("Error fetching mappings:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const saveMapping = async (description, category_id) => {
    if (!user?.id) return null;
    try {
      const descLower = description.toLowerCase().trim();
      
      // Upsert to handle existing mappings for the same description
      const { data, error } = await supabase
        .from('custom_category_mappings')
        .upsert({ 
          user_id: user.id, 
          description: descLower, 
          category_id 
        }, { onConflict: 'user_id, description' })
        .select()
        .single();
        
      if (error) throw error;
      
      await fetchMappings();
      return data;
    } catch (error) {
      console.error("Error saving mapping:", error);
      toast({ title: "Erro ao salvar mapeamento", variant: "destructive" });
      return null;
    }
  };

  const deleteMapping = async (id) => {
    if (!user?.id) return false;
    try {
      const { error } = await supabase
        .from('custom_category_mappings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setMappings(prev => prev.filter(m => m.id !== id));
      toast({ title: "Mapeamento removido com sucesso" });
      return true;
    } catch (error) {
      console.error("Error deleting mapping:", error);
      toast({ title: "Erro ao remover mapeamento", variant: "destructive" });
      return false;
    }
  };

  return { mappings, loading, fetchMappings, saveMapping, deleteMapping };
};
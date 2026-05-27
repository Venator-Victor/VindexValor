import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { logSecurityEvent } from '@/utils/securityUtils';

export const useCategories = () => {
  const { categories, addCategory, deleteCategory } = useFinance();
  const { user } = useAuth();
  const { toast } = useToast();

  const defaultCategories = [
    { name: "Alimentação", icon: "bx bx-restaurant", color: "#EF4444" },
    { name: "Transporte", icon: "bx bx-car", color: "#F59E0B" },
    { name: "Saúde", icon: "bx bx-heart", color: "#10B981" },
    { name: "Educação", icon: "bx bx-book", color: "#3B82F6" },
    { name: "Lazer", icon: "bx bx-joystick", color: "#8B5CF6" },
    { name: "Utilidades", icon: "bx bx-bulb", color: "#F97316" },
    { name: "Outros", icon: "bx bx-help-circle", color: "#64748B" }
  ];

  const getCategoriesWithNone = () => {
    if (!user) return [];
    return [
      { id: 'none', name: 'Nenhuma', color: '#9CA3AF', icon: 'bx bx-x' },
      ...categories
    ];
  };

  const createCategory = async (categoryData) => {
    if (!user) {
      logSecurityEvent('UNAUTHORIZED_CATEGORY_CREATE', null, { action: 'createCategory' });
      toast({ title: 'Acesso Negado', description: 'Usuário não autenticado.', variant: 'destructive' });
      return false;
    }
    try {
      await addCategory(categoryData);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const safeDeleteCategory = async (id) => {
    if (!user) {
      logSecurityEvent('UNAUTHORIZED_CATEGORY_DELETE', null, { categoryId: id });
      toast({ title: 'Acesso Negado', description: 'Usuário não autenticado.', variant: 'destructive' });
      return;
    }
    await deleteCategory(id);
  }

  return {
    categories: getCategoriesWithNone(),
    rawCategories: categories,
    defaultCategories,
    addCategory: createCategory,
    deleteCategory: safeDeleteCategory
  };
};
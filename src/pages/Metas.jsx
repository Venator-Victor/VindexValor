import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { AnimatePresence, motion } from 'framer-motion';
import { Target, Grid as LayoutGrid, ListUl as List, Calendar } from '@/components/BxIcon';
import BxIcon, { Plus, Pencil, Trash } from '@/components/BxIcon';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MetaForm from '@/components/MetaForm';
import MetaProgressCard from '@/components/MetaProgressCard';
import MetaCategorySelector from '@/components/MetaCategorySelector';
import GaugeChart from '@/components/GaugeChart'; // Importing GaugeChart
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/utils/calculations';
import { differenceInDays, parseISO, isPast } from 'date-fns';

const Metas = () => {
  const { goals, addGoal, updateGoal, deleteGoal } = useFinance();
  const { metasViewMode, setMetasViewPreference } = useTheme();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  
  // Filter States
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');
  const [filterType, setFilterType] = useState('valor_final'); // 'valor_final' (Meta Fixa) | 'valor_mensal' (Meta Recorrente)

  // State for creation flow
  const [creationStep, setCreationStep] = useState('selector'); // 'selector' | 'form'
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  const handleCreate = (data) => {
    const goalData = {
      ...data,
      targetAmount: Number(data.targetAmount),
      contributionValue: Number(data.contributionValue),
      accumulated_amount: Number(data.accumulated_amount) || 0,
      reserved_amount: 0, 
      deadline: data.deadline && data.deadline.trim() !== '' ? data.deadline : null
    };
    addGoal(goalData);
    resetAndClose();
  };

  const handleUpdate = (data) => {
    if (!editingGoal) return;
    
    const goalData = {
      ...data,
      targetAmount: Number(data.targetAmount),
      contributionValue: Number(data.contributionValue),
      accumulated_amount: Number(data.accumulated_amount) || 0,
      deadline: data.deadline && data.deadline.trim() !== '' ? data.deadline : null
    };
    updateGoal(editingGoal.id, goalData);
    resetAndClose();
  };

  const resetAndClose = () => {
    setIsDialogOpen(false);
    setEditingGoal(null);
    setCreationStep('selector');
    setSelectedCategoryName('');
  };

  const openNewGoalModal = () => {
    setEditingGoal(null);
    setCreationStep('selector');
    setSelectedCategoryName('');
    setIsDialogOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setCreationStep('form');
    setIsDialogOpen(true);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategoryName(category.name);
    setCreationStep('form');
  };

  const handleCustomSelect = () => {
    setSelectedCategoryName('');
    setCreationStep('form');
  };

  const CYAN_COLOR = PRIMARY;
  const CYAN_HOVER = PRIMARY_HOVER;

  // --- List View Helper ---
  const calculateProgress = (goal) => {
      const isTargetMode = goal.goal_type === 'valor_final';
      if (isTargetMode && goal.targetAmount > 0) {
          return Math.min((goal.accumulated_amount / goal.targetAmount) * 100, 100);
      } else if (!isTargetMode && goal.contributionValue > 0 && goal.targetAmount > 0) {
          return Math.min((goal.accumulated_amount / goal.targetAmount) * 100, 100);
      }
      return 0; 
  };
  
  // Helper for small gauge in table
  const renderSmallGauge = (percentage) => {
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;
    
    let color = DANGER;
    if (percentage >= 70) color = SUCCESS;
    else if (percentage >= 30) color = WARNING;

    return (
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg width="32" height="32" className="transform -rotate-90">
          <circle cx="16" cy="16" r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
          <circle 
            cx="16" cy="16" r={radius} fill="none" stroke={color} strokeWidth="3" 
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
          />
        </svg>
      </div>
    );
  };

  // Filter Goals
  const filteredGoals = goals.filter(goal => {
      if (filterType === 'valor_final') return goal.goal_type === 'valor_final';
      if (filterType === 'valor_mensal') return goal.goal_type === 'valor_mensal';
      return true;
  });

  // Calculate totals for the main Gauge Chart
  const totalAccumulated = filteredGoals.reduce((sum, goal) => sum + (Number(goal.accumulated_amount) || 0), 0);
  const totalTarget = filteredGoals.reduce((sum, goal) => sum + (Number(goal.targetAmount) || 0), 0);
  const totalPercentage = totalTarget > 0 ? (totalAccumulated / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6 pb-20">
      <Helmet>
        <title>VindexValor - Metas Financeiras</title>
        <meta name="description" content="Defina e acompanhe seus objetivos financeiros" />
      </Helmet>

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Metas Financeiras</h1>
          <p className="text-gray-700 dark:text-gray-300">Transforme sonhos em realidade com planejamento.</p>
        </div>
        
        {/* Right Controls Container */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            
            {/* Period Selector (Only for Recurrent) */}
            {filterType === 'valor_mensal' && (
                <div className="w-full sm:w-40 animate-in fade-in slide-in-from-right-4">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="bg-white dark:bg-vindex-card border-gray-200 dark:border-vindex-border text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <SelectValue />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="semana">Semana</SelectItem>
                            <SelectItem value="mensal">Mês</SelectItem>
                            <SelectItem value="trimestre">Trimestre</SelectItem>
                            <SelectItem value="semestre">Semestre</SelectItem>
                            <SelectItem value="ano">Ano</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex items-center gap-3 justify-end">
                {/* Type Filter Toggle */}
                <div className="flex items-center bg-white dark:bg-vindex-card rounded-lg border border-gray-200 dark:border-vindex-border p-1 shadow-sm">
                    <button
                        onClick={() => setFilterType('valor_final')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${filterType === 'valor_final' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        title="Meta Fixa"
                    >
                        <Target size={14} />
                        <span className="hidden sm:inline">Meta Fixa</span>
                    </button>
                    <button
                        onClick={() => setFilterType('valor_mensal')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${filterType === 'valor_mensal' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        title="Recorrência"
                    >
                        <Calendar size={14} />
                        <span className="hidden sm:inline">Recorrência</span>
                    </button>
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-white dark:bg-vindex-card rounded-lg border border-gray-200 dark:border-vindex-border p-1 shadow-sm">
                    <button
                        onClick={() => setMetasViewPreference('list')}
                        className={`p-2 rounded-md transition-all ${metasViewMode === 'list' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        title="Visualização em Lista"
                    >
                        <List size={20} />
                    </button>
                    <button
                        onClick={() => setMetasViewPreference('card')}
                        className={`p-2 rounded-md transition-all ${metasViewMode === 'card' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        title="Visualização em Grade"
                    >
                        <LayoutGrid size={20} />
                    </button>
                </div>

                <Button 
                    onClick={openNewGoalModal}
                    className="text-gray-900 rounded-lg border-none font-semibold shadow-md hover:shadow-lg transition-all px-3 sm:px-4"
                    style={{ backgroundColor: CYAN_COLOR }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = CYAN_HOVER}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = CYAN_COLOR}
                >
                    <Plus size={20} className="sm:mr-2" />
                    <span className="hidden sm:inline">Nova</span>
                </Button>
            </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl max-h-[90vh] overflow-y-auto sm:max-w-[600px] p-0 gap-0">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle>
                        {editingGoal 
                            ? 'Editar Meta' 
                            : (creationStep === 'selector' ? 'Nova Meta' : 'Detalhes da Meta')
                        }
                    </DialogTitle>
                </DialogHeader>
            </div>
            
            <div className="p-6">
                {creationStep === 'selector' && !editingGoal ? (
                    <MetaCategorySelector 
                        onSelect={handleCategorySelect}
                        onCustomSelect={handleCustomSelect}
                    />
                ) : (
                    <MetaForm 
                        initialData={editingGoal}
                        initialName={selectedCategoryName}
                        onSubmit={editingGoal ? handleUpdate : handleCreate}
                        onCancel={resetAndClose}
                    />
                )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Gauge Chart Section */}
      <AnimatePresence mode="wait">
        <motion.div 
            key={filterType}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-vindex-card rounded-xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm flex flex-col md:flex-row justify-around items-center gap-6"
        >
             <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Acumulado</p>
                <p className="text-2xl font-bold text-green-600 dark:text-vindex-success">{formatCurrency(totalAccumulated)}</p>
             </div>
             
             <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {filterType === 'valor_final' ? 'Metas Fixas' : 'Metas Recorrentes'}
                </h3>
                <GaugeChart 
                    value={totalAccumulated} 
                    max={totalTarget > 0 ? totalTarget : 100} 
                    size={180} 
                    strokeWidth={18}
                    className="my-2"
                />
             </div>

             <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Alvo</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalTarget)}</p>
             </div>
        </motion.div>
      </AnimatePresence>

      {goals.length === 0 ? (
         <div className="text-center py-16 bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border border-dashed shadow-sm">
            <div className="mx-auto h-20 w-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <Target className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhuma meta encontrada</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
              Definir metas é o primeiro passo para transformar o invisível em visível. Comece agora!
            </p>
            <Button onClick={openNewGoalModal} className="bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200">
              Criar Primeira Meta
            </Button>
         </div>
      ) : (
        <>
            {/* If goals exist but filter returns empty */}
            {filteredGoals.length === 0 && (
                 <div className="text-center py-12">
                     <p className="text-gray-500 dark:text-gray-400">Nenhuma meta encontrada para este filtro.</p>
                     <Button variant="link" onClick={() => setFilterType(filterType === 'valor_final' ? 'valor_mensal' : 'valor_final')} className="mt-2 text-blue-600">
                        Ver {filterType === 'valor_final' ? 'metas recorrentes' : 'metas fixas'}
                     </Button>
                 </div>
            )}

            {metasViewMode === 'card' ? (
                // --- GRID VIEW ---
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredGoals.map((goal, index) => (
                    <MetaProgressCard
                        key={goal.id}
                        goal={goal}
                        index={index}
                        onEdit={openEditModal}
                        onDelete={setDeleteId}
                    />
                    ))}
                </AnimatePresence>
                </div>
            ) : (
                // --- LIST VIEW ---
                <div className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-vindex-bg/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-vindex-border">
                                <tr>
                                    <th className="px-6 py-4">Nome</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Progresso</th>
                                    <th className="px-6 py-4">Acumulado</th>
                                    <th className="px-6 py-4">Alvo</th>
                                    <th className="px-6 py-4">Prazo</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-vindex-border">
                                {filteredGoals.map((goal) => {
                                    const progress = calculateProgress(goal);
                                    const isTarget = goal.goal_type === 'valor_final';
                                    const daysLeft = goal.deadline ? differenceInDays(parseISO(goal.deadline), new Date()) : null;
                                    const isOverdue = goal.deadline && isPast(parseISO(goal.deadline));

                                    return (
                                        <tr key={goal.id} className="hover:bg-gray-50 dark:hover:bg-vindex-bg/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                                                        style={{ 
                                                            backgroundColor: goal.color + '22', 
                                                            color: goal.color
                                                        }}
                                                    >
                                                        <BxIcon iconClass={`bx ${goal.icon || 'bx-target-lock'}`} size={18} />
                                                    </div>
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{goal.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                    {isTarget ? 'Valor Final' : 'Recorrente'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {renderSmallGauge(progress)}
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{progress.toFixed(0)}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(goal.accumulated_amount)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {isTarget 
                                                    ? formatCurrency(goal.targetAmount) 
                                                    : <span title="Valor da Contribuição">{formatCurrency(goal.contributionValue)} <span className="text-xs text-gray-400">/ {goal.periodFrequency}</span></span>
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                {goal.deadline ? (
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                                                            {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {isOverdue ? 'Atrasado' : `${daysLeft} dias`}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">Sem prazo</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button 
                                                        size="icon" 
                                                        variant="ghost" 
                                                        onClick={() => openEditModal(goal)}
                                                        className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                                                    >
                                                        <Pencil size={14} />
                                                    </Button>
                                                    <Button 
                                                        size="icon" 
                                                        variant="ghost" 
                                                        onClick={() => setDeleteId(goal.id)}
                                                        className="h-8 w-8 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                                    >
                                                        <Trash size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Esta ação removerá a meta permanentemente. O histórico de progresso será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 dark:bg-vindex-bg hover:bg-gray-200 dark:hover:bg-vindex-bg/80 border-gray-200 dark:border-vindex-border text-gray-900 dark:text-gray-100 rounded-lg">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                deleteGoal(deleteId);
                setDeleteId(null);
              }} 
              className="bg-red-600 hover:bg-red-700 dark:bg-vindex-danger dark:hover:bg-vindex-danger/90 rounded-lg text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Metas;
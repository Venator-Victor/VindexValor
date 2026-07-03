import { PRIMARY, PRIMARY_HOVER, SUCCESS, DANGER, DANGER_DARK, WARNING, INFO, successAlpha, dangerAlpha, infoAlpha, primaryAlpha, chartGrid, chartTooltipBg, chartTooltipBorder, chartText, chartCursor } from '@/utils/colors';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { AnimatePresence, motion } from 'framer-motion';
import { Target, Grid as LayoutGrid, ListUl as List, Calendar } from '@/components/BxIcon';
import BxIcon, { Plus, Edit as Edit2, TrashAlt as Trash2 } from '@/components/BxIcon';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import GaugeSummaryCard from '@/components/GaugeSummaryCard';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import GoalDetailModal from '@/components/GoalDetailModal';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/utils/calculations';
import { differenceInDays, parseISO, isPast } from 'date-fns';

const Goals = () => {
  const { t } = useTranslation();
  const { goals, addGoal, updateGoal, deleteGoal } = useFinance();
  const { goalsViewMode, setGoalsViewPreference } = useTheme();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedDetailGoal, setSelectedDetailGoal] = useState(null);

  // Filter States
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');
  const [filterType, setFilterType] = useState('target_value'); // 'target_value' (Meta Fixa) | 'monthly_value' (Meta Recorrente)

  // State for creation flow
  const [creationStep, setCreationStep] = useState('selector'); // 'selector' | 'form'
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState('');
  const [selectedCategoryColor, setSelectedCategoryColor] = useState('');

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
    setSelectedCategoryIcon('');
    setSelectedCategoryColor('');
  };

  const openNewGoalModal = () => {
    setEditingGoal(null);
    setCreationStep('selector');
    setSelectedCategoryName('');
    setSelectedCategoryIcon('');
    setSelectedCategoryColor('');
    setIsDialogOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setCreationStep('form');
    setIsDialogOpen(true);
  };

  const handleCardClick = (goal) => {
    setSelectedDetailGoal(goal);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategoryName(category.name);
    setSelectedCategoryIcon(category.icon);
    setSelectedCategoryColor(category.color);
    setCreationStep('form');
  };

  const handleCustomSelect = () => {
    setSelectedCategoryName('');
    setSelectedCategoryIcon('');
    setSelectedCategoryColor('');
    setCreationStep('form');
  };

  const CYAN_COLOR = PRIMARY;
  const CYAN_HOVER = PRIMARY_HOVER;

  // --- List View Helper ---
  const calculateProgress = (goal) => {
      const accumulated = Number(goal.accumulated_amount) || 0;
      const isTargetMode = goal.goal_type === 'target_value';
      const target = Number(isTargetMode ? goal.targetAmount : goal.contributionValue) || 0;
      if (target > 0) {
          return Math.min((accumulated / target) * 100, 100);
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
      if (filterType === 'target_value') return goal.goal_type === 'target_value';
      if (filterType === 'monthly_value') return goal.goal_type === 'monthly_value';
      return true;
  });

  // Calculate totals for the main Gauge Chart
  const totalAccumulated = filteredGoals.reduce((sum, goal) => sum + (Number(goal.accumulated_amount) || 0), 0);
  const totalTarget = filteredGoals.reduce((sum, goal) => sum + (Number(goal.targetAmount) || 0), 0);
  const totalPercentage = totalTarget > 0 ? (totalAccumulated / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6 pb-20">
      <Helmet>
        <title>VindexValor - {t('goals.title')}</title>
        <meta name="description" content={t('goals.subtitle')} />
      </Helmet>

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t('goals.title')}</h1>
          <p className="text-gray-700 dark:text-gray-300">{t('goals.subtitle')}</p>
        </div>
        
        {/* Right Controls Container */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            
            {/* Period Selector (Only for Recurrent) */}
            {filterType === 'monthly_value' && (
                <div className="w-full sm:w-40 animate-in fade-in slide-in-from-right-4">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="bg-white dark:bg-vindex-card border-gray-200 dark:border-vindex-border text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <SelectValue />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="semana">{t('goals.period_week')}</SelectItem>
                            <SelectItem value="mensal">{t('goals.period_month')}</SelectItem>
                            <SelectItem value="trimestre">{t('goals.period_quarter')}</SelectItem>
                            <SelectItem value="semestre">{t('goals.period_semester')}</SelectItem>
                            <SelectItem value="ano">{t('goals.period_year')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex items-center gap-3 justify-end">
                {/* Type Filter Toggle */}
                <div className="flex items-center bg-white dark:bg-vindex-card rounded-lg border border-gray-200 dark:border-vindex-border p-1 shadow-sm">
                    <button
                        onClick={() => setFilterType('target_value')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${filterType === 'target_value' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        title={t('goals.filter_fixed')}
                    >
                        <Target size={14} />
                        <span className="hidden sm:inline">{t('goals.filter_fixed')}</span>
                    </button>
                    <button
                        onClick={() => setFilterType('monthly_value')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${filterType === 'monthly_value' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        title={t('goals.filter_recurring')}
                    >
                        <Calendar size={14} />
                        <span className="hidden sm:inline">{t('goals.filter_recurring')}</span>
                    </button>
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-white dark:bg-vindex-card rounded-lg border border-gray-200 dark:border-vindex-border p-1 shadow-sm">
                    <button
                        onClick={() => setGoalsViewPreference('list')}
                        className={`p-2 rounded-md transition-all ${goalsViewMode === 'list' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        title={t('goals.view_list_title')}
                    >
                        <List size={20} />
                    </button>
                    <button
                        onClick={() => setGoalsViewPreference('card')}
                        className={`p-2 rounded-md transition-all ${goalsViewMode === 'card' ? 'bg-gray-100 dark:bg-vindex-bg text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        title={t('goals.view_grid_title')}
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
                    <span className="hidden sm:inline">{t('goals.new')}</span>
                    <span className="sm:hidden">{t('goals.new_short')}</span>
                </Button>
            </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className={`bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl max-h-[90vh] overflow-y-auto p-0 gap-0 ${creationStep === 'selector' && !editingGoal ? 'sm:max-w-4xl' : 'sm:max-w-[600px]'}`}>
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle className={creationStep === 'selector' && !editingGoal ? 'text-xl font-bold text-gray-900 dark:text-vindex-text' : undefined}>
                        {editingGoal
                            ? t('goals.edit')
                            : (creationStep === 'selector' ? t('goals.selector_title') : t('goals.details'))
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
                        initialIcon={selectedCategoryIcon}
                        initialColor={selectedCategoryColor}
                        onSubmit={editingGoal ? handleUpdate : handleCreate}
                        onCancel={resetAndClose}
                    />
                )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <AnimatePresence mode="wait">
        <GaugeSummaryCard
          motionKey={filterType}
          leftLabel={t('goals.accumulated')}
          leftValue={formatCurrency(totalAccumulated)}
          gaugeValue={totalAccumulated}
          gaugeMax={totalTarget}
          title={filterType === 'target_value' ? t('goals.fixed_goals') : t('goals.recurring_goals')}
          rightLabel={t('goals.total_target')}
          rightValue={formatCurrency(totalTarget)}
          mode="progress"
        />
      </AnimatePresence>

      {goals.length === 0 ? (
         <div className="text-center py-16 bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border border-dashed shadow-sm">
            <div className="mx-auto h-20 w-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <Target className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('goals.empty_title')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
              {t('goals.empty_desc')}
            </p>
            <Button onClick={openNewGoalModal} className="bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200">
              {t('goals.create_first')}
            </Button>
         </div>
      ) : (
        <>
            {/* If goals exist but filter returns empty */}
            {filteredGoals.length === 0 && (
                 <div className="text-center py-12">
                     <p className="text-gray-500 dark:text-gray-400">{t('goals.filter_empty')}</p>
                     <Button variant="link" onClick={() => setFilterType(filterType === 'target_value' ? 'monthly_value' : 'target_value')} className="mt-2 text-blue-600">
                        {filterType === 'target_value' ? t('goals.see_recurring') : t('goals.see_fixed')}
                     </Button>
                 </div>
            )}

            {goalsViewMode === 'card' ? (
                // --- GRID VIEW ---
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredGoals.map((goal, index) => (
                    <MetaProgressCard
                        key={goal.id}
                        goal={goal}
                        index={index}
                        onClick={handleCardClick}
                    />
                    ))}
                </AnimatePresence>
                </div>
            ) : (
                // --- LIST VIEW ---
                <div className="bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-vindex-bg border-b border-gray-200 dark:border-vindex-border">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">{t('goals.col_name')}</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">{t('goals.col_type')}</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">{t('goals.col_progress')}</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">{t('goals.col_accumulated')}</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">{t('goals.col_target')}</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-700 dark:text-gray-300">{t('goals.col_deadline')}</th>
                                    <th className="px-6 py-3 text-right font-medium text-gray-700 dark:text-gray-300">{t('goals.col_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-vindex-border">
                                {filteredGoals.map((goal) => {
                                    const progress = calculateProgress(goal);
                                    const isTarget = goal.goal_type === 'target_value';
                                    const daysLeft = goal.deadline ? differenceInDays(parseISO(goal.deadline), new Date()) : null;
                                    const isOverdue = goal.deadline && isPast(parseISO(goal.deadline));

                                    return (
                                        <tr key={goal.id} onClick={() => handleCardClick(goal)} className="cursor-pointer transition-colors" onMouseEnter={e => e.currentTarget.style.backgroundColor = PRIMARY + '18'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
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
                                                    <span className="font-medium text-gray-900 dark:text-gray-50">{goal.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                    {isTarget ? t('goals.type_fixed') : t('goals.type_recurring')}
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
                                                    : <span title={t('goals.contribution_value')}>{formatCurrency(goal.contributionValue)} <span className="text-xs text-gray-400">/ {t(`period.${goal.periodFrequency}`)}</span></span>
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                {goal.deadline ? (
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                                                            {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {isOverdue ? t('goals.overdue') : t('goals.days_left', { count: daysLeft })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">{t('goals.no_deadline')}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(goal); }}
                                                        className="h-8 w-8 rounded-lg border transition-colors bg-transparent"
                                                        style={{ borderColor: PRIMARY, color: PRIMARY }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={(e) => { e.stopPropagation(); setDeleteId(goal.id); }}
                                                        className="h-8 w-8 rounded-lg border transition-colors bg-transparent"
                                                        style={{ borderColor: DANGER, color: DANGER }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = DANGER; e.currentTarget.style.color = '#fff'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = DANGER; }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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

      <GoalDetailModal
        isOpen={!!selectedDetailGoal}
        onClose={() => setSelectedDetailGoal(null)}
        goal={selectedDetailGoal}
        onEdit={(goal) => openEditModal(goal)}
        onDelete={(id) => { setSelectedDetailGoal(null); setDeleteId(id); }}
      />

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        description={t('goals.delete_desc')}
        onConfirm={() => {
          deleteGoal(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
};

export default Goals;
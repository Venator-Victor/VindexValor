import { describe, it, expect } from 'vitest';
import { buildFlatIndentedOptions, getParentCategoryOptions, groupChildrenByParent } from '../categoryTree';

const categories = [
  { id: 'food', name: 'Alimentação', parent_id: null },
  { id: 'restaurants', name: 'Restaurantes', parent_id: 'food' },
  { id: 'groceries', name: 'Mercado', parent_id: 'food' },
  { id: 'transport', name: 'Transporte', parent_id: null },
];

describe('buildFlatIndentedOptions', () => {
  it('places each subcategory right after its parent', () => {
    const options = buildFlatIndentedOptions(categories);
    expect(options.map(o => o.value)).toEqual(['food', 'groceries', 'restaurants', 'transport']);
  });

  it('indents subcategory labels but not top-level labels', () => {
    const options = buildFlatIndentedOptions(categories);
    const food = options.find(o => o.value === 'food');
    const groceries = options.find(o => o.value === 'groceries');
    expect(food.label).toBe('Alimentação');
    expect(groceries.label).toContain('Mercado');
    expect(groceries.label).not.toBe('Mercado');
  });

  it('sorts subcategories under a parent alphabetically', () => {
    const options = buildFlatIndentedOptions(categories);
    const childLabels = options.filter(o => o.value === 'restaurants' || o.value === 'groceries').map(o => o.value);
    expect(childLabels).toEqual(['groceries', 'restaurants']);
  });

  it('surfaces an orphaned child (parent not in the list) as top-level', () => {
    const options = buildFlatIndentedOptions([
      { id: 'orphan', name: 'Órfã', parent_id: 'missing-parent' },
    ]);
    expect(options).toEqual([{ value: 'orphan', label: 'Órfã' }]);
  });

  it('returns an empty array for no categories', () => {
    expect(buildFlatIndentedOptions([])).toEqual([]);
    expect(buildFlatIndentedOptions()).toEqual([]);
  });
});

describe('getParentCategoryOptions', () => {
  it('only includes top-level categories', () => {
    const options = getParentCategoryOptions(categories);
    expect(options.map(o => o.value).sort()).toEqual(['food', 'transport']);
  });

  it('excludes the category currently being edited', () => {
    const options = getParentCategoryOptions(categories, 'food');
    expect(options.map(o => o.value)).toEqual(['transport']);
  });
});

describe('groupChildrenByParent', () => {
  it('groups subcategories under their parent id, sorted by name', () => {
    const map = groupChildrenByParent(categories);
    expect(map.get('food').map(c => c.id)).toEqual(['groceries', 'restaurants']);
    expect(map.has('transport')).toBe(false);
  });
});

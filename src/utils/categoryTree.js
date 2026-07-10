// Categories are flat with an optional parent_id, one level deep
// (a subcategory never has children of its own).

const SUBCATEGORY_PREFIX = '↳ ';

// Flattens categories into picker-ready { value, label } options, placing
// each subcategory right after its parent with an indent prefix. Used
// anywhere a category is assigned to another entity (transactions,
// recurring items, invoice items, CSV import, filters).
export const buildFlatIndentedOptions = (categories = []) => {
  const topLevel = categories.filter((c) => !c.parent_id).sort((a, b) => a.name.localeCompare(b.name));
  const childrenByParent = new Map();

  categories.forEach((c) => {
    if (!c.parent_id) return;
    if (!childrenByParent.has(c.parent_id)) childrenByParent.set(c.parent_id, []);
    childrenByParent.get(c.parent_id).push(c);
  });

  const options = [];
  topLevel.forEach((parent) => {
    options.push({ value: parent.id, label: parent.name });
    const children = (childrenByParent.get(parent.id) || [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
    children.forEach((child) => {
      options.push({ value: child.id, label: `${SUBCATEGORY_PREFIX}${child.name}` });
    });
    childrenByParent.delete(parent.id);
  });

  // Orphaned rows (parent_id pointing at a category not in the list) still
  // need to be selectable — surface them as top-level.
  childrenByParent.forEach((orphans) => {
    orphans.forEach((orphan) => options.push({ value: orphan.id, label: orphan.name }));
  });

  return options;
};

// Top-level categories eligible to be picked as a parent in the category
// form, excluding the category currently being edited.
export const getParentCategoryOptions = (categories = [], excludeId = null) =>
  categories
    .filter((c) => !c.parent_id && c.id !== excludeId)
    .map((c) => ({ value: c.id, label: c.name }));

// Builds a { parentId: childCategory[] } map for rendering nested table rows
// and rolling up parent totals.
export const groupChildrenByParent = (categories = []) => {
  const map = new Map();
  categories.forEach((c) => {
    if (!c.parent_id) return;
    if (!map.has(c.parent_id)) map.set(c.parent_id, []);
    map.get(c.parent_id).push(c);
  });
  map.forEach((children) => children.sort((a, b) => a.name.localeCompare(b.name)));
  return map;
};

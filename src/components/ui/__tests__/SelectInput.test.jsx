import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectInput from '../SelectInput';

const options = [
  { label: 'Alimentação', value: 'food' },
  { label: 'Transporte', value: 'transport' },
  { label: 'Moradia', value: 'housing' },
];

function renderSelect(props = {}) {
  const defaults = { value: '', onChange: vi.fn(), options, id: 'test-select' };
  return render(<SelectInput {...defaults} {...props} />);
}

describe('SelectInput', () => {
  it('shows every option when not searchable', async () => {
    renderSelect();
    await userEvent.click(screen.getByRole('button', { name: 'Selecione...' }));
    expect(screen.getByText('Alimentação')).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();
    expect(screen.getByText('Moradia')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Buscar...')).not.toBeInTheDocument();
  });

  it('filters options as the user types when searchable', async () => {
    renderSelect({ searchable: true });
    await userEvent.click(screen.getByRole('button', { name: 'Selecione...' }));
    const searchBox = screen.getByPlaceholderText('Buscar...');
    await userEvent.type(searchBox, 'trans');
    expect(screen.getByText('Transporte')).toBeInTheDocument();
    expect(screen.queryByText('Alimentação')).not.toBeInTheDocument();
    expect(screen.queryByText('Moradia')).not.toBeInTheDocument();
  });

  it('is accent- and case-insensitive', async () => {
    renderSelect({ searchable: true });
    await userEvent.click(screen.getByRole('button', { name: 'Selecione...' }));
    await userEvent.type(screen.getByPlaceholderText('Buscar...'), 'ALIMENTACAO');
    expect(screen.getByText('Alimentação')).toBeInTheDocument();
    expect(screen.queryByText('Transporte')).not.toBeInTheDocument();
  });

  it('shows a no-results message when nothing matches', async () => {
    renderSelect({ searchable: true });
    await userEvent.click(screen.getByRole('button', { name: 'Selecione...' }));
    await userEvent.type(screen.getByPlaceholderText('Buscar...'), 'zzzzz');
    expect(screen.getByText('Nenhum resultado encontrado.')).toBeInTheDocument();
  });

  it('calls onChange with the selected value and closes the dropdown', async () => {
    const onChange = vi.fn();
    renderSelect({ searchable: true, onChange });
    await userEvent.click(screen.getByRole('button', { name: 'Selecione...' }));
    await userEvent.type(screen.getByPlaceholderText('Buscar...'), 'trans');
    await userEvent.click(screen.getByText('Transporte'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ value: 'transport' }) }));
    await waitFor(() => expect(screen.queryByPlaceholderText('Buscar...')).not.toBeInTheDocument());
  });

  it('clears the search term after the dropdown is closed and reopened', async () => {
    renderSelect({ searchable: true });
    await userEvent.click(screen.getByRole('button', { name: 'Selecione...' }));
    await userEvent.type(screen.getByPlaceholderText('Buscar...'), 'trans');
    await userEvent.click(screen.getByRole('button', { name: 'Selecione...' })); // close
    await userEvent.click(screen.getByRole('button', { name: 'Selecione...' })); // reopen
    expect(screen.getByPlaceholderText('Buscar...')).toHaveValue('');
    expect(screen.getByText('Alimentação')).toBeInTheDocument();
  });

  it('renders the dropdown panel outside an overflow-clipped ancestor (e.g. a modal)', async () => {
    const { container } = render(
      <div data-testid="clipping-modal" style={{ overflow: 'hidden', height: 50 }}>
        <SelectInput value="" onChange={vi.fn()} options={options} id="test-select" />
      </div>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Selecione...' }));
    const option = await screen.findByText('Transporte');
    const clippingModal = container.querySelector('[data-testid="clipping-modal"]');
    expect(clippingModal.contains(option)).toBe(false);
  });

  it('scrolls the options list manually on wheel, bypassing a Dialog scroll-lock', async () => {
    renderSelect();
    await userEvent.click(screen.getByRole('button', { name: 'Selecione...' }));
    const list = screen.getByText('Transporte').closest('div.overflow-auto');
    list.scrollTop = 0;
    list.dispatchEvent(new WheelEvent('wheel', { deltaY: 40, bubbles: true }));
    expect(list.scrollTop).toBe(40);
  });

  describe('multiple mode', () => {
    it('toggles values in and out of the array and keeps the dropdown open', async () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <SelectInput value={[]} onChange={onChange} options={options} id="test-select" multiple />
      );
      await userEvent.click(screen.getByRole('button', { name: 'Selecione...' }));
      await userEvent.click(screen.getByText('Transporte'));
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ value: ['transport'] }) }));

      rerender(<SelectInput value={['transport']} onChange={onChange} options={options} id="test-select" multiple />);
      // dropdown stayed open: "Transporte" now appears both as the trigger label and as an option
      expect(screen.getAllByText('Transporte')).toHaveLength(2);

      await userEvent.click(screen.getByText('Alimentação'));
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ value: ['transport', 'food'] }) }));

      rerender(<SelectInput value={['transport', 'food']} onChange={onChange} options={options} id="test-select" multiple />);
      await userEvent.click(screen.getByText('Transporte')); // deselect
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ target: expect.objectContaining({ value: ['food'] }) }));
    });

    it('shows a count once more than one option is selected', () => {
      renderSelect({ value: ['food', 'transport'], multiple: true });
      expect(screen.getByRole('button', { name: '2 selecionadas' })).toBeInTheDocument();
    });

    it('shows the single label when exactly one option is selected', () => {
      renderSelect({ value: ['transport'], multiple: true });
      expect(screen.getByRole('button', { name: 'Transporte' })).toBeInTheDocument();
    });
  });
});
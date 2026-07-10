import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { useScrollRestoration } from '../useScrollRestoration';

const Page = ({ label, other }) => {
  useScrollRestoration();
  return (
    <div>
      <span>{label}</span>
      <Link to={other}>go</Link>
    </div>
  );
};

// Each test uses its own route pair since the position map is module-level state
// shared across the whole test file.
function renderPages(suffix) {
  const a = `/a${suffix}`;
  const b = `/b${suffix}`;
  return render(
    <MemoryRouter initialEntries={[a]}>
      <Routes>
        <Route path={a} element={<Page label="A" other={b} />} />
        <Route path={b} element={<Page label="B" other={a} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('useScrollRestoration', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  it('restores the scroll position saved for a route when navigating back to it', async () => {
    renderPages('1');
    expect(screen.getByText('A')).toBeInTheDocument();

    // Simulate the user having scrolled down on page A.
    Object.defineProperty(window, 'scrollY', { value: 350, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    await userEvent.click(screen.getByText('go'));
    expect(screen.getByText('B')).toBeInTheDocument();
    window.scrollTo.mockClear();

    await userEvent.click(screen.getByText('go'));
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 350);
  });

  it('starts a never-visited route at the top', () => {
    renderPages('2');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});

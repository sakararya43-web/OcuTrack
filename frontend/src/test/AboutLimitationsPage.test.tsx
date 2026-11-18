import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AboutLimitationsPage } from '../pages/AboutLimitationsPage';

describe('AboutLimitationsPage', () => {
  it('renders regulatory limitations and non-diagnostic disclaimers', () => {
    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AboutLimitationsPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/About OcuTrack & System Limitations/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Investigational Prototype: Not a Diagnostic Medical Device/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/What OcuTrack Measures/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/What OcuTrack Does NOT Conclude/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Hardware, Illumination & Temporal Constraints/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Current Model Status: Experimental/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Privacy, De-Identification & Ephemeral Retention/i)
    ).toBeInTheDocument();
  });
});

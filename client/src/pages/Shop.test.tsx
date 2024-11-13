import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Shop } from './Shop';
import useSWR from 'swr';
import { Pet } from 'db/schema';

vi.mock('swr');
vi.mock('wouter', () => ({
  Link: vi.fn(({ children, ...props }) => (
    <span data-testid="mock-link" {...props}>
      {children}
    </span>
  )),
}));

describe('Shop', () => {
  const mockPets: Pet[] = [
    {
      id: 1,
      name: 'Max',
      species: 'dog',
      breed: 'Golden Retriever',
      age: 2,
      price: '500.00',
      description: 'Friendly dog',
      imageUrl: 'dog.jpg',
      stock: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Luna',
      species: 'cat',
      breed: 'Siamese',
      age: 1,
      price: '300.00',
      description: 'Playful cat',
      imageUrl: 'cat.jpg',
      stock: 1,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useSWR as any).mockImplementation(() => ({
      data: mockPets,
      error: null,
    }));
  });

  it('renders all pets initially', () => {
    render(<Shop />);
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('Luna')).toBeInTheDocument();
  });

  it('filters pets by search term', () => {
    render(<Shop />);
    const searchInput = screen.getByPlaceholderText('Search pets...');
    fireEvent.change(searchInput, { target: { value: 'Max' } });
    
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.queryByText('Luna')).not.toBeInTheDocument();
  });

  it('filters pets by species', async () => {
    render(<Shop />);
    const speciesSelect = screen.getByRole('combobox');
    fireEvent.change(speciesSelect, { target: { value: 'cat' } });
    
    // Use queryByText to avoid throwing if element is not found
    const dogElement = screen.queryByText('Max');
    const catElement = screen.queryByText('Luna');
    
    expect(dogElement).not.toBeInTheDocument();
    expect(catElement).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useSWR as any).mockImplementation(() => ({
      data: null,
      error: null,
    }));

    render(<Shop />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useSWR as any).mockImplementation(() => ({
      data: null,
      error: new Error('Failed to fetch'),
    }));

    render(<Shop />);
    expect(screen.getByText('Failed to load pets')).toBeInTheDocument();
  });
});

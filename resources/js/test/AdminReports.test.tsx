import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AdminReports from '@/pages/admin/AdminReports';

vi.mock('@/hooks/useAdminGuard', () => ({
    useAdminGuard: () => undefined,
}));

vi.mock('@/hooks/useBooking', () => ({
    useAdminBookings: () => ({ data: [] }),
}));

vi.mock('@/components/layout/AdminLayout', () => ({
    AdminLayout: ({
        children,
        title,
    }: {
        children: React.ReactNode;
        title: string;
    }) => (
        <div>
            <h1>{title}</h1>
            {children}
        </div>
    ),
}));

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    PieChart: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Cell: () => null,
    Tooltip: () => null,
    Legend: () => null,
}));

describe('AdminReports', () => {
    it('renders without crashing when there are no bookings', () => {
        render(
            <LanguageProvider>
                <MemoryRouter initialEntries={['/admin/reports']}>
                    <AdminReports />
                </MemoryRouter>
            </LanguageProvider>,
        );

        expect(screen.getByText('Reports')).toBeInTheDocument();
        expect(screen.getByText(/Bookings by Status/i)).toBeInTheDocument();
        expect(screen.getByText(/Top Items by Revenue/i)).toBeInTheDocument();
    });
});

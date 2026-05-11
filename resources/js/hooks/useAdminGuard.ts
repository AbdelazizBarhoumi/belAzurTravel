import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAdminGuard() {
    const navigate = useNavigate();
    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            navigate('/login');
        }
    }, [navigate]);
}

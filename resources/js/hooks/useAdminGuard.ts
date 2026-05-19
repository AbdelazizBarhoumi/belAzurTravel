import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '@/hooks/useAuthUser';

export function useAdminGuard() {
    const navigate = useNavigate();
    const { data, isPending, isFetching, isError } = useAuthUser();

    useEffect(() => {
        if (isPending || isFetching) {
            return;
        }

        if (isError || !data) {
            navigate('/login', { replace: true });
            return;
        }

        if (data.role !== 'admin') {
            navigate('/unauthorized', { replace: true });
        }
    }, [data, isError, isFetching, isPending, navigate]);
}

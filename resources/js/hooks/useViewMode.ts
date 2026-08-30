import { useCallback, useState } from 'react';

export type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'viewMode';

function getStoredViewMode(): ViewMode {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'grid' || stored === 'list') return stored;
    } catch {}
    return 'grid';
}

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
    const [viewMode, setViewModeState] = useState<ViewMode>(getStoredViewMode);

    const setViewMode = useCallback((mode: ViewMode) => {
        setViewModeState(mode);
        try {
            localStorage.setItem(STORAGE_KEY, mode);
        } catch {}
    }, []);

    return [viewMode, setViewMode];
}

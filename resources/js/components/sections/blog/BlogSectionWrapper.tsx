import { useSiteSettings } from '@/hooks/useSiteSettings';
import { isPageEnabled } from '@/lib/pageVisibility';
import { BlogSection } from './BlogSection';

interface BlogSectionWrapperProps {
    showHeader?: boolean;
    previewCount?: number;
}

export function BlogSectionWrapper({
    showHeader = true,
    previewCount = 3,
}: BlogSectionWrapperProps) {
    const { settings } = useSiteSettings();

    // Don't render if blog page is disabled
    if (!isPageEnabled('blog', settings.content?.nav?.settings)) {
        return null;
    }

    return <BlogSection showHeader={showHeader} previewCount={previewCount} />;
}

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
    JsonListEditor,
    type JsonFieldDef,
} from '@/components/forms/JsonListEditor';

vi.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => `translated:${key}`,
        lang: 'en',
        setLang: vi.fn(),
        dir: 'ltr',
    }),
}));

const schema: JsonFieldDef[] = [
    {
        key: 'title',
        labelKey: 'admin.noItemsYet',
    },
];

describe('JsonListEditor', () => {
    it('renders translated field labels for sortable items without crashing', () => {
        render(
            <JsonListEditor
                items={[{ id: 'item-1', title: 'Hello' }]}
                onItemsChange={vi.fn()}
                schema={schema}
                activeLang="en"
            />,
        );

        expect(
            screen.getByText('translated:admin.noItemsYet'),
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    });
});

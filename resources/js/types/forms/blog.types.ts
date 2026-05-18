/**
 * Blog form data type definitions for form field validation
 */
export interface BlogFormDataTypes {
    title_en: string;
    title_fr: string;
    title_ar: string;
    excerpt_en: string;
    excerpt_fr: string;
    excerpt_ar: string;
    category_en: string;
    category_fr: string;
    category_ar: string;
}

/**
 * Form field definition for entity dialogs
 */
export interface FormFieldDef {
    id: string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'select' | 'image' | 'array';
    required?: boolean;
    localized?: boolean;
    options?: Array<{ value: string; label: string }>;
}

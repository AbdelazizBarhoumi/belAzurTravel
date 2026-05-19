import type { LocalizedText } from '../common';

/**
 * Blog post item - public view
 */
export interface BlogPostItem {
    slug: string;
    title: LocalizedText;
    excerpt: LocalizedText;
    date: string;
    // category key (optional) for filtering
    category_key?: string;
    category: LocalizedText;
    image: string;
    content: BlogContentValue;
}

/**
 * Blog content section with localized heading and body
 */
export interface BlogContentSection {
    id?: string | null;
    heading: LocalizedText;
    body: LocalizedText;
}

/**
 * Complete blog content with main body and sections
 */
export interface BlogContent {
    body: LocalizedText;
    sections: BlogContentSection[];
}

/**
 * Blog content can be full content object or simple localized text
 */
export type BlogContentValue = BlogContent | LocalizedText | string | null;

/**
 * Blog form data for creating/editing posts
 */
export interface BlogFormData {
    id?: string;
    slug?: string;
    title_en: string;
    title_fr: string;
    title_ar: string;
    excerpt_en: string;
    excerpt_fr: string;
    excerpt_ar: string;
    category_en: string;
    category_fr: string;
    category_ar: string;
    date: string;
    image: string | File;
    imagePath?: string;
    imageFile?: File | null;
    content: BlogContent;
}

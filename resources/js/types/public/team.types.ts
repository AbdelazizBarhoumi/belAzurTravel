import type { LocalizedText } from '../common';

export interface TeamMember {
    id?: string | number;
    name: string | LocalizedText;
    role?: string | LocalizedText;
    image?: string;
    bio?: string | LocalizedText;
    linkedin?: string | null;
    twitter?: string | null;
    email?: string | null;
    slug?: string;
}

export type { TeamMember as TeamMemberType };

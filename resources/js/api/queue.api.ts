import { apiFetch } from './http';

export interface QueueAudit {
    id: number;
    action: string;
    actor_id: number | null;
    actor_role: string | null;
    actor_name?: string | null;
    from_status?: string | null;
    to_status?: string | null;
    notes?: string | null;
    created_at: string;
}

export interface QueueBooking {
    id: number;
    user_id: number | null;
    type: string;
    items: unknown[];
    start_date?: string | null;
    end_date?: string | null;
    client?: {
        name?: string;
        email?: string;
        phone?: string;
    } | null;
    total_amount: number;
    status: 'Pending' | 'Approved';
    created_at: string;
    expires_at?: string | null;
    reject_reason?: string | null;
    cancel_reason?: string | null;
    provider_booking_id?: string | null;
    is_provider: boolean;
    audits: QueueAudit[];
}

export interface QueueComplaintReply {
    id: number;
    sender: 'admin' | 'client';
    message: Record<string, string>;
    created_at: string;
}

export interface QueueComplaint {
    id: number;
    type: 'complaint' | 'refund_request';
    subject: Record<string, string>;
    description: Record<string, string>;
    booking_id: number | null;
    booking?: {
        id: number;
        type: string;
        total_amount: number;
        status: string;
        start_date?: string | null;
        end_date?: string | null;
    } | null;
    user?: { id: number; name: string; email: string } | null;
    refund_amount: number | null;
    status: 'pending' | 'in_review' | 'resolved' | 'rejected' | 'refunded';
    priority: 'low' | 'medium' | 'high';
    admin_reply: Record<string, string> | null;
    replies: QueueComplaintReply[];
    created_at: string;
}

export interface QueueSupportReply {
    author_id?: number | null;
    author?: string;
    message: string;
    created_at: string;
}

export interface QueueSupportInquiry {
    id: number;
    user_id: number | null;
    client?: { name?: string; email?: string } | null;
    subject: Record<string, string> | string;
    message: Record<string, string> | string;
    status: 'new' | 'in-progress' | 'resolved';
    priority: 'low' | 'medium' | 'high';
    replies: QueueSupportReply[];
    created_at: string;
}

export interface QueueCounts {
    bookings: number;
    complaints: number;
    refund_requests: number;
    support: number;
    total: number;
}

export interface AdminQueuePayload {
    counts: QueueCounts;
    bookings: QueueBooking[];
    complaints: QueueComplaint[];
    refund_requests: QueueComplaint[];
    support: QueueSupportInquiry[];
}

export type QueueSection =
    | 'bookings'
    | 'complaints'
    | 'refund_requests'
    | 'support';

export async function getAdminQueue() {
    return apiFetch<AdminQueuePayload>('/api/admin/queue');
}

export async function getAdminQueueCounts() {
    return apiFetch<QueueCounts>('/api/admin/queue/counts');
}

export async function getAdminSupportInquiries() {
    return apiFetch<QueueSupportInquiry[]>('/api/admin/support-inquiries');
}

export async function updateSupportInquiry(
    id: number,
    data: { status?: string; priority?: string },
) {
    return apiFetch<QueueSupportInquiry>(`/api/admin/support-inquiries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function replyToSupportInquiry(id: number, message: string) {
    return apiFetch<QueueSupportInquiry>(
        `/api/admin/support-inquiries/${id}/reply`,
        {
            method: 'POST',
            body: JSON.stringify({ message }),
        },
    );
}

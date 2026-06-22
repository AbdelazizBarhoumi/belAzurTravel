import { apiFetch } from './http';

export interface ComplaintReply {
    id: number;
    sender: 'admin' | 'client';
    message: Record<string, string>;
    created_at: string;
}

export interface Complaint {
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
    refund_amount: number | null;
    status: 'pending' | 'in_review' | 'resolved' | 'rejected' | 'refunded';
    priority: 'low' | 'medium' | 'high';
    admin_reply: Record<string, string> | null;
    replies: ComplaintReply[];
    resolved_at: string | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

export async function getClientComplaints() {
    return apiFetch<Complaint[]>('/api/client/complaints');
}

export async function getClientComplaint(id: number) {
    return apiFetch<Complaint>(`/api/client/complaints/${id}`);
}

export async function createComplaint(payload: {
    type: 'complaint' | 'refund_request';
    subject: string;
    description: string;
    booking_id?: number;
}) {
    return apiFetch<Complaint>('/api/client/complaints', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function replyToClientComplaint(id: number, message: string) {
    return apiFetch<Complaint>(`/api/client/complaints/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

export async function getAdminComplaints(filters?: {
    type?: string;
    status?: string;
}) {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    const qs = params.toString();
    return apiFetch<Complaint[]>(`/api/admin/complaints${qs ? `?${qs}` : ''}`);
}

export async function getAdminComplaint(id: number) {
    return apiFetch<Complaint>(`/api/admin/complaints/${id}`);
}

export async function updateAdminComplaint(
    id: number,
    data: { status?: string; priority?: string; refund_amount?: number },
) {
    return apiFetch<Complaint>(`/api/admin/complaints/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function replyToComplaint(id: number, message: string) {
    return apiFetch<Complaint>(`/api/admin/complaints/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

export async function resolveComplaint(id: number) {
    return apiFetch<Complaint>(`/api/admin/complaints/${id}/resolve`, {
        method: 'POST',
    });
}

<?php

return [
    'brand' => 'BelAzur Travel',
    'support_email' => 'support@belazurtravel.tn',
    'rights' => 'All rights reserved.',
    'footer_questions' => 'If you have questions, contact us at :email',
    'footer_automatic' => 'This is an automated notification from BelAzur Travel.',

    'action' => [
        'view_booking' => 'View Booking',
        'view_details' => 'View Details',
        'search_again' => 'Search Again',
        'contact_support' => 'Contact Support',
        'open_dashboard' => 'Open Dashboard',
        'review' => 'Review',
    ],

    'booking' => [
        'labels' => [
            'details' => 'Booking Details',
            'ref' => 'Reference',
            'type' => 'Type',
            'item' => 'Item',
            'dates' => 'Dates',
            'amount' => 'Amount',
            'status' => 'Status',
            'provider_ref' => 'Provider Reference',
            'reason' => 'Reason',
        ],
        'approved' => [
            'subject' => 'Booking #:id Confirmed',
            'greeting' => 'Your Booking is Confirmed!',
            'intro' => 'Great news! Your booking #:id has been confirmed.',
            'next_steps' => 'You will receive your travel documents shortly. If you have any questions, do not hesitate to contact us.',
        ],
        'approved_pending' => [
            'subject' => 'Booking #:id Approved',
            'greeting' => 'Your Booking is Approved',
            'intro' => 'Your booking #:id has been approved and is being finalised.',
            'next_steps' => 'You will receive a confirmation once the reservation is secured.',
        ],
        'rejected' => [
            'subject' => 'Booking #:id Rejected',
            'greeting' => 'Your Booking Was Rejected',
            'intro' => 'Your booking #:id could not be accepted.',
            'next_steps' => 'You can contact our support team or reserve a different option.',
        ],
        'expired' => [
            'subject' => 'Booking #:id Expired',
            'greeting' => 'Your Booking Has Expired',
            'intro' => 'Your booking #:id expired because it was not confirmed in time.',
            'next_steps' => 'Please search again to find a new offer for your dates.',
        ],
        'cancelled' => [
            'subject' => 'Booking #:id Cancelled',
            'greeting' => 'Your Booking Has Been Cancelled',
            'intro' => 'Your booking #:id has been cancelled.',
            'penalty' => 'Cancellation fees may apply according to the provider\'s policy. Any refund due will be processed within 5–10 business days.',
            'next_steps' => 'If you believe this is an error, please contact support.',
        ],
    ],

    'admin_booking' => [
        'labels' => [
            'details' => 'Booking Details',
            'ref' => 'Reference',
            'client' => 'Client',
            'type' => 'Type',
            'dates' => 'Dates',
            'amount' => 'Amount',
            'status' => 'Status',
            'reason' => 'Reason',
        ],
        'created' => [
            'subject' => 'New Booking #:id from :client',
            'greeting' => 'New Booking Received',
            'intro' => 'A new booking has been submitted by :client.',
        ],
        'approved' => [
            'subject' => 'Booking Approved - #:id',
            'greeting' => 'Booking Approved',
            'intro' => 'Booking #:id has been approved.',
        ],
        'confirmed' => [
            'subject' => 'Booking Confirmed - #:id',
            'greeting' => 'Booking Confirmed',
            'intro' => 'Booking #:id has been confirmed.',
        ],
        'rejected' => [
            'subject' => 'Booking Rejected - #:id',
            'greeting' => 'Booking Rejected',
            'intro' => 'Booking #:id has been rejected.',
        ],
        'cancelled' => [
            'subject' => 'Booking Cancelled - #:id',
            'greeting' => 'Booking Cancelled',
            'intro' => 'Booking #:id has been cancelled.',
        ],
        'expired' => [
            'subject' => 'Booking Expired - #:id',
            'greeting' => 'Booking Expired',
            'intro' => 'Booking #:id has expired — the offer is no longer available.',
        ],
        'paid' => [
            'subject' => 'New Payment - Booking #:id',
            'greeting' => 'Payment Received!',
            'intro' => 'A payment has been received for booking #:id.',
        ],
    ],

    'trip_reminder' => [
        'subject' => 'Your trip starts in :days day(s)',
        'greeting' => 'Your trip is coming up!',
        'intro' => 'Your booking #:id starts on :date. Here is a quick reminder with your trip details.',
        'next_steps' => 'If you have any questions about your upcoming trip, please contact our support team.',
    ],

    'digest' => [
        'subject' => 'Daily Operations Digest',
        'greeting' => 'Good morning,',
        'intro' => 'Here is a summary of activity for :date.',
        'empty' => 'No new activity today.',
        'labels' => [
            'new_bookings' => 'New Bookings',
            'approvals' => 'Approvals',
            'rejections' => 'Rejections',
            'cancellations' => 'Cancellations',
            'complaints' => 'Complaints',
            'refunds' => 'Refund Requests',
            'messages' => 'Support Messages',
        ],
    ],

    'support' => [
        'inquiry' => [
            'subject' => 'New Support Message from :client',
            'greeting' => 'New Support Message',
            'intro' => ':client has sent a new support message.',
            'labels' => [
                'message' => 'Message',
                'contact' => 'Contact',
                'booking' => 'Related Booking',
                'type' => 'Type',
            ],
        ],
        'reply' => [
            'subject' => 'Reply regarding your inquiry',
            'greeting' => 'New Message',
            'intro' => 'You have a new message from our team regarding your inquiry.',
            'labels' => [
                'message' => 'Message',
                'inquiry' => 'Inquiry',
                'support' => 'Support Team',
            ],
        ],
    ],
];
<?php

return [
    'brand' => 'BelAzur Travel',
    'support_email' => 'contact@belazurtravel.com',
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
        'received' => [
            'subject' => 'Booking request #:id received',
            'greeting' => 'We have received your request',
            'intro' => 'Thank you! Your booking request #:id has been received and is being reviewed by our team.',
            'next_steps' => 'We usually answer within 24 hours. No payment is taken until your booking is confirmed.',
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
    'visa' => [
        'team' => [
            'subject' => 'New visa application — :country — :name',
            'greeting' => 'New visa application',
            'intro' => ':name has just submitted a visa application for :country. The passport copy is attached when provided.',
            'closing' => 'Reply directly to this email to contact the applicant.',
        ],
        'applicant' => [
            'subject' => 'Your visa application for :country has been received',
            'greeting' => 'Hello :name,',
            'intro' => 'We have received your visa application for :country. A BelAzur Travel advisor is reviewing your file and will contact you shortly about the next steps.',
            'closing' => 'Thank you for your trust. — The BelAzur Travel team',
        ],
        'labels' => [
            'details' => 'Application details',
            'country' => 'Destination',
            'visa_type' => 'Visa type',
            'travel_date' => 'Travel date',
            'name' => 'Applicant',
            'email' => 'Email',
            'phone' => 'Phone',
            'passport_number' => 'Passport number',
            'birth_date' => 'Date of birth',
            'previous_visa' => 'Previous visa',
            'notes' => 'Notes',
            'passport_copy' => 'Passport copy',
        ],
        'yes' => 'Yes',
        'no' => 'No',
        'attached' => 'Attached to this email',
        'not_provided' => 'Not provided',
    ],
];

<?php

return [
    'brand' => 'BelAzur Travel',
    'support_email' => 'contact@belazurtravel.com',
    'rights' => 'Tous droits réservés.',
    'footer_questions' => 'Si vous avez des questions, contactez-nous à :email',
    'footer_automatic' => 'Ceci est une notification automatique de BelAzur Travel.',

    'action' => [
        'view_booking' => 'Voir la réservation',
        'view_details' => 'Voir les détails',
        'search_again' => 'Rechercher à nouveau',
        'contact_support' => 'Contacter le support',
        'open_dashboard' => 'Ouvrir le tableau de bord',
        'review' => 'Examiner',
    ],

    'booking' => [
        'labels' => [
            'details' => 'Détails de la réservation',
            'ref' => 'Référence',
            'type' => 'Type',
            'item' => 'Article',
            'dates' => 'Dates',
            'amount' => 'Montant',
            'status' => 'Statut',
            'provider_ref' => 'Référence du prestataire',
            'reason' => 'Raison',
        ],
        'approved' => [
            'subject' => 'Réservation #:id confirmée',
            'greeting' => 'Votre réservation est confirmée !',
            'intro' => 'Bonne nouvelle ! Votre réservation #:id a été confirmée.',
            'next_steps' => 'Vous recevrez vos documents de voyage sous peu. Si vous avez des questions, n\'hésitez pas à nous contacter.',
        ],
        'approved_pending' => [
            'subject' => 'Réservation #:id approuvée',
            'greeting' => 'Votre réservation est approuvée',
            'intro' => 'Votre réservation #:id a été approuvée et est en cours de finalisation.',
            'next_steps' => 'Vous recevrez une confirmation dès que la réservation sera sécurisée.',
        ],
        'rejected' => [
            'subject' => 'Réservation #:id refusée',
            'greeting' => 'Votre réservation a été refusée',
            'intro' => 'Votre réservation #:id n\'a pas pu être acceptée.',
            'next_steps' => 'Vous pouvez contacter notre équipe de support ou réserver une autre option.',
        ],
        'expired' => [
            'subject' => 'Réservation #:id expirée',
            'greeting' => 'Votre réservation a expiré',
            'intro' => 'Votre réservation #:id a expiré car elle n\'a pas été confirmée à temps.',
            'next_steps' => 'Veuillez relancer une recherche pour trouver une nouvelle offre pour vos dates.',
        ],
        'cancelled' => [
            'subject' => 'Réservation #:id annulée',
            'greeting' => 'Votre réservation a été annulée',
            'intro' => 'Votre réservation #:id a été annulée.',
            'penalty' => 'Des frais d\'annulation peuvent s\'appliquer selon la politique du prestataire. Tout remboursement dû sera traité sous 5 à 10 jours ouvrables.',
            'next_steps' => 'Si vous pensez qu\'il s\'agit d\'une erreur, veuillez contacter le support.',
        ],
    ],

    'admin_booking' => [
        'labels' => [
            'details' => 'Détails de la réservation',
            'ref' => 'Référence',
            'client' => 'Client',
            'type' => 'Type',
            'dates' => 'Dates',
            'amount' => 'Montant',
            'status' => 'Statut',
            'reason' => 'Raison',
        ],
        'created' => [
            'subject' => 'Nouvelle réservation #:id de :client',
            'greeting' => 'Nouvelle réservation reçue',
            'intro' => 'Une nouvelle réservation a été soumise par :client.',
        ],
        'approved' => [
            'subject' => 'Réservation approuvée - #:id',
            'greeting' => 'Réservation approuvée',
            'intro' => 'La réservation #:id a été approuvée.',
        ],
        'confirmed' => [
            'subject' => 'Réservation confirmée - #:id',
            'greeting' => 'Réservation confirmée',
            'intro' => 'La réservation #:id a été confirmée.',
        ],
        'rejected' => [
            'subject' => 'Réservation refusée - #:id',
            'greeting' => 'Réservation refusée',
            'intro' => 'La réservation #:id a été refusée.',
        ],
        'cancelled' => [
            'subject' => 'Réservation annulée - #:id',
            'greeting' => 'Réservation annulée',
            'intro' => 'La réservation #:id a été annulée.',
        ],
        'expired' => [
            'subject' => 'Réservation expirée - #:id',
            'greeting' => 'Réservation expirée',
            'intro' => 'La réservation #:id a expiré — l\'offre n\'est plus disponible.',
        ],
        'paid' => [
            'subject' => 'Nouveau paiement - Réservation #:id',
            'greeting' => 'Paiement reçu !',
            'intro' => 'Un paiement a été reçu pour la réservation #:id.',
        ],
    ],

    'trip_reminder' => [
        'subject' => 'Votre voyage commence dans :days jour(s)',
        'greeting' => 'Votre voyage approche !',
        'intro' => 'Votre réservation #:id commence le :date. Voici un rappel avec les détails de votre voyage.',
        'next_steps' => 'Si vous avez des questions concernant votre voyage, veuillez contacter notre équipe de support.',
    ],

    'digest' => [
        'subject' => 'Résumé quotidien des opérations',
        'greeting' => 'Bonjour,',
        'intro' => 'Voici un résumé de l\'activité du :date.',
        'empty' => 'Aucune nouvelle activité aujourd\'hui.',
        'labels' => [
            'new_bookings' => 'Nouvelles réservations',
            'approvals' => 'Approbations',
            'rejections' => 'Refus',
            'cancellations' => 'Annulations',
            'complaints' => 'Réclamations',
            'refunds' => 'Demandes de remboursement',
            'messages' => 'Messages de support',
        ],
    ],

    'support' => [
        'inquiry' => [
            'subject' => 'Nouveau message de support de :client',
            'greeting' => 'Nouveau message de support',
            'intro' => ':client a envoyé un nouveau message de support.',
            'labels' => [
                'message' => 'Message',
                'contact' => 'Contact',
                'booking' => 'Réservation associée',
                'type' => 'Type',
            ],
        ],
        'reply' => [
            'subject' => 'Réponse concernant votre demande',
            'greeting' => 'Nouveau message',
            'intro' => 'Vous avez un nouveau message de notre équipe concernant votre demande.',
            'labels' => [
                'message' => 'Message',
                'inquiry' => 'Demande',
                'support' => 'Équipe de support',
            ],
        ],
    ],
];

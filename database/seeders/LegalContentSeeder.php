<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

/**
 * Default legal texts (Mentions légales, privacy policy, terms of sale) in
 * French and English, written for a Tunisian licensed travel agency.
 *
 * Only empty entries are filled, so running it again never overwrites what
 * an admin has edited. Values in [brackets] must be completed by the agency.
 */
class LegalContentSeeder extends Seeder
{
    public function run(): void
    {
        $row = SiteSetting::query()->first() ?? SiteSetting::query()->create([
            'company_name' => config('site.company_name'),
            'email' => config('site.email'),
            'phone' => config('site.phone'),
        ]);

        $vars = [
            '{company}' => $row->company_name ?: 'BelAzur Travel',
            '{email}' => $row->email ?: 'contact@belazurtravel.com',
            '{phone}' => $row->phone ?: '+216 23 777 771',
            '{address}' => $this->realAddress($row->address) ?? '[Adresse du siège — à compléter]',
            '{site}' => preg_replace('#^https?://#', '', rtrim((string) config('app.url'), '/')) ?: 'belazurtravel.com',
            '{year}' => (string) ($row->year ?: date('Y')),
        ];
        $fill = fn (string $text) => strtr($text, $vars);

        $changed = false;

        if (empty($row->legal_sections)) {
            $row->legal_sections = array_map(fn (array $section) => [
                'title' => ['fr' => $section['fr'][0], 'en' => $section['en'][0], 'ar' => ''],
                'body' => [
                    'format' => 'markdown',
                    'content' => ['fr' => $fill($section['fr'][1]), 'en' => $fill($section['en'][1]), 'ar' => ''],
                ],
            ], $this->legalSections());
            $changed = true;
        }

        $content = $row->content ?? [];
        foreach ([
            'privacy_policy' => $this->privacyPolicy(),
            'purchase_policy' => $this->purchasePolicy(),
        ] as $key => $policy) {
            $existing = $content[$key]['body']['content'] ?? [];
            if (trim((string) ($existing['fr'] ?? '')) !== '' || trim((string) ($existing['en'] ?? '')) !== '') {
                continue;
            }

            $content[$key] = [
                'title' => ['fr' => $policy['fr'][0], 'en' => $policy['en'][0], 'ar' => $content[$key]['title']['ar'] ?? ''],
                'body' => [
                    'format' => 'markdown',
                    'content' => ['fr' => $fill($policy['fr'][1]), 'en' => $fill($policy['en'][1]), 'ar' => ''],
                ],
            ];
            $changed = true;
        }

        if ($changed) {
            $row->content = $content;
            $row->save();

            foreach (['site-settings', 'site-settings:fr', 'site-settings:en', 'site-settings:ar'] as $key) {
                Cache::forget($key);
            }
        }
    }

    /** The settings default ("123 Travel St, NY…") is a placeholder, not an address. */
    private function realAddress(?string $address): ?string
    {
        if (! $address || str_contains($address, 'Travel St')) {
            return null;
        }

        return $address;
    }

    /** @return list<array{fr: array{0: string, 1: string}, en: array{0: string, 1: string}}> */
    private function legalSections(): array
    {
        return [
            [
                'fr' => ['Éditeur du site', <<<'MD'
Le site **{site}** est édité par **{company}**, agence de voyages de droit tunisien.

- **Raison sociale :** [Raison sociale exacte — à compléter]
- **Forme juridique :** [SARL / SUARL / SA — à compléter]
- **Siège social :** {address}
- **Registre national des entreprises (RNE) :** [Identifiant unique — à compléter]
- **Matricule fiscal :** [à compléter]
- **Téléphone :** {phone}
- **Email :** {email}
- **Directeur de la publication :** [Nom du gérant — à compléter]
MD],
                'en' => ['Site publisher', <<<'MD'
The website **{site}** is published by **{company}**, a travel agency incorporated under Tunisian law.

- **Company name:** [Exact registered name — to be completed]
- **Legal form:** [SARL / SUARL / SA — to be completed]
- **Registered office:** {address}
- **National Business Register (RNE):** [Unique identifier — to be completed]
- **Tax ID (matricule fiscal):** [to be completed]
- **Phone:** {phone}
- **Email:** {email}
- **Publication director:** [Manager's name — to be completed]
MD],
            ],
            [
                'fr' => ['Agence de voyages agréée', <<<'MD'
{company} exerce l'activité d'agence de voyages conformément à la loi n° 73-21 du 14 avril 1973 relative à l'organisation de la profession d'agent de voyages et à ses textes d'application.

- **Licence d'agence de voyages :** catégorie [A / B — à compléter], n° [à compléter], délivrée par le Ministère du Tourisme
- **Autorité de tutelle :** Office National du Tourisme Tunisien (ONTT)
- **Garantie financière / assurance responsabilité civile professionnelle :** [Organisme et n° de police — à compléter]

Les prestations proposées sur le site (hôtels, circuits, voyages organisés, billets d'avion, location de voitures, assistance visa) sont vendues par {company} en qualité d'intermédiaire ou d'organisateur, selon les cas précisés dans nos conditions générales de vente.
MD],
                'en' => ['Licensed travel agency', <<<'MD'
{company} operates as a travel agency in accordance with Tunisian Law No. 73-21 of 14 April 1973 governing the travel agent profession and its implementing texts.

- **Travel agency licence:** category [A / B — to be completed], No. [to be completed], issued by the Ministry of Tourism
- **Supervisory authority:** Tunisian National Tourism Office (ONTT)
- **Financial guarantee / professional liability insurance:** [Insurer and policy number — to be completed]

The services offered on the website (hotels, tours, organised trips, flight tickets, car rental, visa assistance) are sold by {company} acting either as intermediary or as organiser, as specified in our terms and conditions of sale.
MD],
            ],
            [
                'fr' => ['Hébergement', <<<'MD'
Le site est hébergé par **OVH SAS**, 2 rue Kellermann, 59100 Roubaix, France — www.ovhcloud.com.
MD],
                'en' => ['Hosting', <<<'MD'
The website is hosted by **OVH SAS**, 2 rue Kellermann, 59100 Roubaix, France — www.ovhcloud.com.
MD],
            ],
            [
                'fr' => ['Propriété intellectuelle', <<<'MD'
L'ensemble des éléments du site (textes, photographies, logos, marques, vidéos, mise en page, code) est la propriété de {company} ou de ses partenaires et est protégé par la législation tunisienne et internationale relative à la propriété littéraire, artistique et industrielle.

Toute reproduction, représentation, adaptation ou diffusion, totale ou partielle, sans autorisation écrite préalable de {company} est interdite et peut donner lieu à des poursuites.

Les photographies d'hôtels et de destinations peuvent être fournies par nos partenaires et prestataires ; elles sont non contractuelles.
MD],
                'en' => ['Intellectual property', <<<'MD'
All content on the website (text, photographs, logos, trademarks, videos, layout, code) is the property of {company} or its partners and is protected by Tunisian and international intellectual property law.

Any reproduction, representation, adaptation or distribution, in whole or in part, without the prior written consent of {company} is prohibited and may lead to legal action.

Hotel and destination photographs may be supplied by our partners and suppliers and are for illustration only.
MD],
            ],
            [
                'fr' => ['Responsabilité, liens et droit applicable', <<<'MD'
**Exactitude des informations.** {company} s'efforce de publier des informations exactes et à jour. Les prix, disponibilités et descriptifs sont toutefois susceptibles d'évoluer et ne deviennent définitifs qu'à la confirmation de la réservation par notre équipe.

**Disponibilité du site.** L'accès au site peut être interrompu pour maintenance ou pour des raisons indépendantes de notre volonté, sans que la responsabilité de {company} puisse être engagée.

**Liens externes.** Le site peut contenir des liens vers des sites tiers (compagnies aériennes, ambassades, partenaires). {company} n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.

**Données personnelles.** Le traitement de vos données est décrit dans notre [Politique de confidentialité](/privacy-policy).

**Droit applicable.** Les présentes mentions légales sont régies par le droit tunisien. Tout litige relève de la compétence des tribunaux de Tunis, sous réserve des dispositions impératives applicables aux consommateurs.

*Dernière mise à jour : {year}.*
MD],
                'en' => ['Liability, links and governing law', <<<'MD'
**Accuracy of information.** {company} strives to publish accurate, up-to-date information. Prices, availability and descriptions may change, however, and only become final once our team has confirmed the booking.

**Website availability.** Access to the website may be interrupted for maintenance or for reasons beyond our control, without {company} being held liable.

**External links.** The website may link to third-party websites (airlines, embassies, partners). {company} has no control over these websites and accepts no responsibility for their content.

**Personal data.** How we process your data is described in our [Privacy Policy](/privacy-policy).

**Governing law.** This legal notice is governed by Tunisian law. Any dispute falls within the jurisdiction of the courts of Tunis, subject to mandatory consumer protection rules.

*Last updated: {year}.*
MD],
            ],
        ];
    }

    /** @return array{fr: array{0: string, 1: string}, en: array{0: string, 1: string}} */
    private function privacyPolicy(): array
    {
        return [
            'fr' => ['Politique de confidentialité', <<<'MD'
{company} attache une grande importance à la protection de vos données personnelles. La présente politique explique quelles données nous collectons, pourquoi, et quels sont vos droits, conformément à la **loi organique n° 2004-63 du 27 juillet 2004** portant sur la protection des données à caractère personnel.

## 1. Responsable du traitement

{company} — {address} — {email} — {phone}.

Les traitements effectués par {company} font l'objet des déclarations requises auprès de l'**Instance Nationale de Protection des Données Personnelles (INPDP)** [n° de déclaration / autorisation — à compléter].

## 2. Données collectées

Nous collectons uniquement les données nécessaires à votre demande :

- **Identité et contact :** civilité, nom, prénom, email, téléphone.
- **Compte client :** identifiants de connexion, langue préférée, historique de réservations.
- **Voyageurs :** nom, prénom et âge des participants (âge des enfants pour la tarification hôtelière).
- **Demande de visa :** numéro de passeport, date de naissance, date de voyage, type de visa, copie du passeport, informations sur un visa antérieur.
- **Billets d'avion :** données exigées par les compagnies aériennes (nom tel qu'il figure sur le passeport, date d'expiration du passeport le cas échéant).
- **Données techniques :** adresse IP, type de navigateur, pages consultées, cookies (voir section 8).

Nous ne collectons pas vos données bancaires : aucun paiement en ligne n'est actuellement effectué sur le site.

## 3. Finalités et base légale

Vos données sont utilisées pour :

1. traiter vos demandes de réservation, de devis et de visa, et en assurer le suivi ;
2. transmettre aux prestataires (hôtels, compagnies aériennes, loueurs, réceptifs, ambassades et centres de visa) les informations indispensables à l'exécution de votre voyage ;
3. vous contacter au sujet de votre dossier (email, téléphone, WhatsApp) ;
4. respecter nos obligations légales, comptables et fiscales ;
5. améliorer le site et prévenir la fraude ;
6. vous adresser nos offres, **uniquement avec votre consentement**, retirable à tout moment.

Le traitement repose sur votre consentement et sur l'exécution du contrat de voyage que vous concluez avec nous.

## 4. Destinataires

Vos données sont destinées à l'équipe commerciale et administrative de {company}. Elles peuvent être communiquées, pour les seuls besoins de votre voyage :

- aux hôtels, compagnies aériennes, transporteurs, loueurs de voitures et agences réceptives ;
- aux ambassades, consulats et centres de traitement des visas ;
- à notre hébergeur (OVH) et à nos prestataires techniques (envoi d'emails), tenus à la confidentialité ;
- aux autorités, lorsque la loi l'exige.

Nous ne vendons ni ne louons vos données.

## 5. Transferts hors de Tunisie

Un voyage à l'étranger ou une demande de visa implique nécessairement la transmission de certaines données à des prestataires ou autorités situés hors de Tunisie. Ces transferts sont limités au strict nécessaire et réalisés dans le respect des conditions prévues par la loi organique n° 2004-63 et des autorisations de l'INPDP.

## 6. Durée de conservation

- **Demandes et réservations :** pendant la durée de la relation commerciale, puis 10 ans pour les pièces comptables.
- **Copies de passeport et dossiers visa :** supprimées au plus tard **12 mois** après la date de voyage, sauf obligation légale contraire.
- **Compte client :** jusqu'à sa suppression, ou 3 ans après la dernière activité.
- **Cookies de mesure d'audience :** 13 mois maximum.

## 7. Vos droits

Vous disposez d'un droit d'**accès**, de **rectification** et d'**opposition** au traitement de vos données pour des motifs légitimes, ainsi que du droit de retirer votre consentement à la prospection. Pour les exercer, écrivez-nous à **{email}** en joignant un justificatif d'identité.

Vous pouvez également saisir l'INPDP (www.inpdp.tn).

## 8. Cookies

Le site utilise des cookies indispensables à son fonctionnement (session, sécurité, langue, favoris) et, le cas échéant, des cookies de mesure d'audience. Vous pouvez les refuser ou les supprimer à tout moment depuis les réglages de votre navigateur ; certaines fonctionnalités (connexion, réservation) pourraient alors ne plus fonctionner.

## 9. Sécurité

Nous mettons en œuvre des mesures techniques et organisationnelles adaptées (connexion chiffrée HTTPS, accès restreint aux seules personnes habilitées, mots de passe chiffrés) pour protéger vos données contre la perte, l'accès non autorisé ou la divulgation.

## 10. Modifications

Cette politique peut être mise à jour. La version en vigueur est celle publiée sur cette page.

*Dernière mise à jour : {year}.*
MD],
            'en' => ['Privacy Policy', <<<'MD'
{company} takes the protection of your personal data seriously. This policy explains what data we collect, why, and what your rights are, in accordance with Tunisian **Organic Law No. 2004-63 of 27 July 2004** on the protection of personal data.

## 1. Data controller

{company} — {address} — {email} — {phone}.

Processing carried out by {company} is declared to the **National Authority for the Protection of Personal Data (INPDP)** [declaration / authorisation number — to be completed].

## 2. Data we collect

We only collect the data needed for your request:

- **Identity and contact details:** title, first name, last name, email, phone.
- **Customer account:** login credentials, preferred language, booking history.
- **Travellers:** names and ages of participants (children's ages for hotel pricing).
- **Visa applications:** passport number, date of birth, travel date, visa type, passport copy, details of any previous visa.
- **Flight tickets:** data required by airlines (name as shown on the passport, passport expiry date where applicable).
- **Technical data:** IP address, browser type, pages visited, cookies (see section 8).

We do not collect your card details: no online payment is currently taken on the website.

## 3. Purposes and legal basis

Your data is used to:

1. process and follow up your booking, quote and visa requests;
2. pass on to suppliers (hotels, airlines, car rental companies, ground handlers, embassies and visa centres) the information required to deliver your trip;
3. contact you about your file (email, phone, WhatsApp);
4. meet our legal, accounting and tax obligations;
5. improve the website and prevent fraud;
6. send you our offers, **only with your consent**, which you may withdraw at any time.

Processing is based on your consent and on the performance of the travel contract you enter into with us.

## 4. Recipients

Your data is intended for {company}'s sales and administrative staff. It may be shared, solely for the purpose of your trip, with:

- hotels, airlines, carriers, car rental companies and local ground handlers;
- embassies, consulates and visa processing centres;
- our hosting provider (OVH) and technical providers (email delivery), who are bound by confidentiality;
- public authorities, where required by law.

We never sell or rent your data.

## 5. Transfers outside Tunisia

Travelling abroad or applying for a visa necessarily involves sending some data to suppliers or authorities located outside Tunisia. Such transfers are limited to what is strictly necessary and made in compliance with Organic Law No. 2004-63 and INPDP authorisations.

## 6. Retention

- **Requests and bookings:** for the duration of the business relationship, then 10 years for accounting records.
- **Passport copies and visa files:** deleted no later than **12 months** after the travel date, unless the law requires otherwise.
- **Customer account:** until deleted, or 3 years after the last activity.
- **Audience measurement cookies:** 13 months maximum.

## 7. Your rights

You have the right to **access** and **correct** your data and to **object** to its processing on legitimate grounds, as well as the right to withdraw your consent to marketing. To exercise these rights, write to **{email}** enclosing proof of identity.

You may also contact the INPDP (www.inpdp.tn).

## 8. Cookies

The website uses cookies that are essential to its operation (session, security, language, favourites) and, where applicable, audience measurement cookies. You can refuse or delete them at any time in your browser settings; some features (login, booking) may then stop working.

## 9. Security

We apply appropriate technical and organisational measures (encrypted HTTPS connection, access restricted to authorised staff, hashed passwords) to protect your data against loss, unauthorised access or disclosure.

## 10. Changes

This policy may be updated. The version in force is the one published on this page.

*Last updated: {year}.*
MD],
        ];
    }

    /** @return array{fr: array{0: string, 1: string}, en: array{0: string, 1: string}} */
    private function purchasePolicy(): array
    {
        return [
            'fr' => ['Conditions générales de vente', <<<'MD'
Les présentes conditions générales de vente (CGV) régissent les ventes de prestations touristiques réalisées par **{company}**, agence de voyages agréée (licence n° [à compléter]), via le site {site}, par téléphone, WhatsApp ou en agence. Elles s'inscrivent dans le cadre de la loi n° 73-21 du 14 avril 1973 relative aux agences de voyages, de la loi n° 92-117 du 7 décembre 1992 relative à la protection du consommateur et de la loi n° 2000-83 du 9 août 2000 relative aux échanges et au commerce électroniques.

Toute demande de réservation implique l'acceptation sans réserve des présentes CGV ainsi que des conditions particulières propres à chaque prestation (conditions de l'hôtel, de la compagnie aérienne, du loueur…), qui prévalent en cas de contradiction.

## 1. Prestations

{company} propose : séjours en hôtel en Tunisie et à l'étranger, circuits et excursions, voyages organisés et à la carte, billets d'avion, location de voitures, événements et assistance aux demandes de visa. Les descriptifs, photos et programmes sont fournis à titre indicatif et peuvent être modifiés par les prestataires.

## 2. Prix

- Les prix sont indiqués en **dinars tunisiens (TND)**, toutes taxes comprises, sauf mention contraire.
- Les prix « à partir de » correspondent au tarif le plus bas pour la période et les conditions indiquées.
- Les tarifs hôteliers et aériens étant dynamiques, **seul le prix confirmé par notre équipe** au moment de la validation de la réservation fait foi.
- Sauf mention contraire, ne sont pas inclus : taxes de séjour locales, frais de visa consulaires, assurances, pourboires, dépenses personnelles et suppléments optionnels.

## 3. Réservation

1. Vous envoyez une **demande de réservation** depuis le site (compte client requis) ou auprès de nos conseillers.
2. Votre demande est enregistrée avec le statut **« en attente »** ; elle ne constitue pas encore une réservation ferme.
3. Notre équipe vérifie la disponibilité et le prix auprès du prestataire, puis **confirme** ou **refuse** la demande par email. Une demande non confirmée dans le délai indiqué expire automatiquement.
4. Le contrat est formé à la réception de la confirmation, accompagnée, le cas échéant, du paiement de l'acompte demandé.

Vous êtes responsable de l'exactitude des informations transmises (noms identiques au passeport, âges des enfants, dates). Les frais résultant d'une erreur de saisie restent à votre charge.

## 4. Paiement

Aucun paiement n'est prélevé en ligne à ce jour. Après confirmation, notre équipe vous communique les modalités de règlement : espèces ou carte en agence, virement bancaire ou tout autre moyen indiqué.

- **Acompte :** 30 % du prix total à la confirmation, sauf conditions particulières.
- **Solde :** au plus tard 15 jours avant le départ (ou à la réservation pour un départ plus proche).
- **Billets d'avion et tarifs non remboursables :** paiement intégral à l'émission.

À défaut de paiement dans les délais, {company} peut annuler la réservation et appliquer les frais d'annulation prévus à l'article 6.

## 5. Modification par le client

Toute demande de modification (dates, nombre de personnes, hébergement) doit être adressée par écrit à {email}. Elle est soumise à la disponibilité et peut entraîner des frais facturés par le prestataire, ainsi que des frais de dossier de **[20] TND** par modification. Un changement de dates ou de destination peut être traité comme une annulation suivie d'une nouvelle réservation.

## 6. Annulation par le client

L'annulation doit être notifiée par écrit (email ou espace client). Sauf conditions particulières plus favorables ou plus strictes indiquées lors de la réservation (notamment les tarifs « non remboursables »), les frais suivants s'appliquent sur le prix total :

| Date d'annulation | Frais retenus |
|---|---|
| Plus de 30 jours avant le départ | 10 % (minimum frais de dossier) |
| De 30 à 15 jours avant le départ | 30 % |
| De 14 à 8 jours avant le départ | 50 % |
| De 7 à 3 jours avant le départ | 75 % |
| Moins de 3 jours ou non-présentation | 100 % |

- **Billets d'avion :** conditions de la compagnie aérienne (souvent non remboursables), majorées des frais d'émission.
- **Hôtels :** lorsque l'hôtel accorde une annulation gratuite jusqu'à une date donnée, cette date est indiquée sur votre réservation et prévaut.
- **Visas :** les frais consulaires et frais de service engagés ne sont pas remboursables, quelle que soit la décision de l'ambassade.

L'annulation en ligne depuis l'espace client n'est plus possible moins de 24 heures avant le début de la prestation.

## 7. Modification ou annulation par l'agence

Si {company} ou un prestataire doit modifier un élément essentiel du voyage avant le départ, vous en êtes informé dans les meilleurs délais et pouvez accepter la modification ou annuler sans frais avec remboursement intégral des sommes versées. Si un voyage de groupe n'atteint pas le nombre minimal de participants indiqué, il peut être annulé au plus tard 15 jours avant le départ, avec remboursement intégral.

## 8. Force majeure

Aucune des parties ne peut être tenue responsable d'une inexécution due à un événement de force majeure (catastrophe naturelle, épidémie, conflit, fermeture des frontières, grève générale, décision des autorités…). Les sommes versées sont alors remboursées, déduction faite des frais réellement engagés et non récupérables auprès des prestataires, ou converties en avoir avec votre accord.

## 9. Formalités et assistance visa

Il appartient à chaque voyageur de disposer d'un passeport valide (généralement au moins 6 mois après le retour), des visas, autorisations de sortie pour les mineurs et documents sanitaires exigés. Notre service visa vous accompagne dans la constitution du dossier, mais **la délivrance du visa relève de la seule décision des autorités consulaires**. Un refus de visa ou un retard de traitement ne peut engager la responsabilité de {company} ; les frais de voyage restent soumis aux conditions d'annulation ci-dessus.

## 10. Responsabilité

{company} est responsable de la bonne exécution des prestations vendues, dans les limites fixées par la réglementation et par les conventions internationales applicables au transport aérien. Sa responsabilité ne peut être engagée en cas de faute du voyageur, de fait imprévisible et insurmontable d'un tiers ou de force majeure. Les horaires de vol sont communiqués à titre indicatif et peuvent être modifiés par les compagnies.

Nous vous recommandons vivement de souscrire une **assurance voyage** couvrant l'annulation, l'assistance rapatriement et les frais médicaux.

## 11. Réclamations

Toute réclamation doit être adressée de préférence depuis votre espace client (rubrique réclamations) ou par email à **{email}**, accompagnée des justificatifs, au plus tard **30 jours** après la fin du voyage. Nous nous engageons à y répondre dans un délai de 15 jours. Tout dysfonctionnement constaté sur place doit être signalé immédiatement au prestataire et à notre équipe afin qu'une solution puisse être recherchée.

## 12. Données personnelles

Les informations communiquées sont traitées conformément à notre [Politique de confidentialité](/privacy-policy).

## 13. Droit applicable et litiges

Les présentes CGV sont soumises au droit tunisien. En cas de litige, une solution amiable sera recherchée en priorité ; à défaut, les tribunaux de Tunis seront compétents, sous réserve des dispositions impératives protégeant le consommateur.

*Dernière mise à jour : {year}.*
MD],
            'en' => ['Terms and Conditions of Sale', <<<'MD'
These terms and conditions of sale govern the sale of travel services by **{company}**, a licensed travel agency (licence No. [to be completed]), through the website {site}, by phone, WhatsApp or at our office. They are subject to Tunisian Law No. 73-21 of 14 April 1973 on travel agencies, Law No. 92-117 of 7 December 1992 on consumer protection and Law No. 2000-83 of 9 August 2000 on electronic commerce.

Submitting a booking request means you fully accept these terms, together with the specific conditions of each service (hotel, airline, car rental company…), which prevail in the event of conflict.

## 1. Services

{company} offers hotel stays in Tunisia and abroad, tours and excursions, organised and tailor-made trips, flight tickets, car rental, events and visa application assistance. Descriptions, photos and itineraries are for guidance and may be changed by suppliers.

## 2. Prices

- Prices are shown in **Tunisian dinars (TND)**, including taxes, unless stated otherwise.
- "From" prices are the lowest rate for the stated period and conditions.
- Because hotel and airfare rates are dynamic, **only the price confirmed by our team** when the booking is validated is binding.
- Unless stated otherwise, prices exclude local tourist taxes, consular visa fees, insurance, tips, personal expenses and optional extras.

## 3. Booking

1. You send a **booking request** through the website (customer account required) or through our advisors.
2. Your request is recorded with the status **"pending"**; it is not yet a firm booking.
3. Our team checks availability and price with the supplier, then **confirms** or **declines** the request by email. A request that is not confirmed within the stated time expires automatically.
4. The contract is formed when you receive the confirmation, together with payment of any deposit requested.

You are responsible for the accuracy of the information provided (names exactly as on the passport, children's ages, dates). Costs arising from incorrect information remain your responsibility.

## 4. Payment

No payment is currently taken online. After confirmation, our team will tell you how to pay: cash or card at our office, bank transfer or any other method indicated.

- **Deposit:** 30% of the total price on confirmation, unless otherwise specified.
- **Balance:** no later than 15 days before departure (or at booking for later bookings).
- **Flight tickets and non-refundable rates:** full payment on issue.

If payment is not received on time, {company} may cancel the booking and apply the cancellation fees set out in section 6.

## 5. Changes requested by the customer

Change requests (dates, number of travellers, accommodation) must be sent in writing to {email}. They are subject to availability and may incur supplier charges plus an administration fee of **[20] TND** per change. A change of dates or destination may be treated as a cancellation followed by a new booking.

## 6. Cancellation by the customer

Cancellations must be notified in writing (email or customer area). Unless more favourable or stricter specific conditions were stated at booking (in particular "non-refundable" rates), the following fees apply to the total price:

| Cancellation date | Fee |
|---|---|
| More than 30 days before departure | 10% (minimum: administration fee) |
| 30 to 15 days before departure | 30% |
| 14 to 8 days before departure | 50% |
| 7 to 3 days before departure | 75% |
| Less than 3 days or no-show | 100% |

- **Flight tickets:** airline conditions apply (often non-refundable), plus ticketing fees.
- **Hotels:** where the hotel allows free cancellation until a given date, that date is shown on your booking and prevails.
- **Visas:** consular fees and service fees already incurred are non-refundable, whatever the embassy's decision.

Online cancellation from the customer area is no longer possible less than 24 hours before the service starts.

## 7. Changes or cancellation by the agency

If {company} or a supplier has to change an essential element of the trip before departure, you will be informed as soon as possible and may either accept the change or cancel free of charge with a full refund. If a group trip does not reach the stated minimum number of participants, it may be cancelled no later than 15 days before departure, with a full refund.

## 8. Force majeure

Neither party can be held liable for non-performance caused by force majeure (natural disaster, epidemic, conflict, border closure, general strike, government decision…). Amounts paid are then refunded, less costs actually incurred and not recoverable from suppliers, or converted into a credit note with your agreement.

## 9. Travel documents and visa assistance

Each traveller must hold a valid passport (usually valid for at least 6 months after return), the required visas, exit authorisations for minors and any health documents. Our visa service helps you prepare your application, but **the visa decision rests solely with the consular authorities**. A visa refusal or processing delay cannot engage {company}'s liability; travel bookings remain subject to the cancellation terms above.

## 10. Liability

{company} is responsible for the proper performance of the services sold, within the limits set by regulations and by the international conventions applicable to air transport. It is not liable where the failure is due to the traveller, to the unforeseeable and unavoidable act of a third party, or to force majeure. Flight times are given for guidance and may be changed by airlines.

We strongly recommend taking out **travel insurance** covering cancellation, repatriation assistance and medical expenses.

## 11. Complaints

Complaints should preferably be submitted from your customer area (complaints section) or by email to **{email}**, with supporting documents, no later than **30 days** after the end of the trip. We undertake to reply within 15 days. Any problem on site must be reported immediately to the supplier and to our team so that a solution can be sought.

## 12. Personal data

The information you provide is processed in accordance with our [Privacy Policy](/privacy-policy).

## 13. Governing law and disputes

These terms are governed by Tunisian law. In the event of a dispute, an amicable solution will be sought first; failing that, the courts of Tunis shall have jurisdiction, subject to mandatory consumer protection provisions.

*Last updated: {year}.*
MD],
        ];
    }
}

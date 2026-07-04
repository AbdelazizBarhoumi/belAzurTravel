export interface Airport {
    iata: string;
    city: string;
    country: string;
    countryCode: string;
}

export const AIRPORTS: Airport[] = [
    // Tunisia
    { iata: 'TUN', city: 'Tunis', country: 'Tunisia', countryCode: 'TN' },
    { iata: 'NBE', city: 'Monastir', country: 'Tunisia', countryCode: 'TN' },
    { iata: 'DJE', city: 'Djerba', country: 'Tunisia', countryCode: 'TN' },
    { iata: 'TOE', city: 'Tozeur', country: 'Tunisia', countryCode: 'TN' },
    { iata: 'GAE', city: 'Gabès', country: 'Tunisia', countryCode: 'TN' },
    { iata: 'SFA', city: 'Sfax', country: 'Tunisia', countryCode: 'TN' },
    { iata: 'TBJ', city: 'Tabarka', country: 'Tunisia', countryCode: 'TN' },

    // France
    { iata: 'CDG', city: 'Paris', country: 'France', countryCode: 'FR' },
    { iata: 'ORY', city: 'Paris', country: 'France', countryCode: 'FR' },
    { iata: 'LYS', city: 'Lyon', country: 'France', countryCode: 'FR' },
    { iata: 'MRS', city: 'Marseille', country: 'France', countryCode: 'FR' },
    { iata: 'NCE', city: 'Nice', country: 'France', countryCode: 'FR' },
    { iata: 'TLS', city: 'Toulouse', country: 'France', countryCode: 'FR' },
    { iata: 'BOD', city: 'Bordeaux', country: 'France', countryCode: 'FR' },
    { iata: 'NTE', city: 'Nantes', country: 'France', countryCode: 'FR' },
    { iata: 'BVA', city: 'Beauvais', country: 'France', countryCode: 'FR' },
    { iata: 'SXB', city: 'Strasbourg', country: 'France', countryCode: 'FR' },
    { iata: 'MPL', city: 'Montpellier', country: 'France', countryCode: 'FR' },

    // Germany
    { iata: 'FRA', city: 'Frankfurt', country: 'Germany', countryCode: 'DE' },
    { iata: 'MUC', city: 'Munich', country: 'Germany', countryCode: 'DE' },
    { iata: 'TXL', city: 'Berlin', country: 'Germany', countryCode: 'DE' },
    { iata: 'BER', city: 'Berlin', country: 'Germany', countryCode: 'DE' },
    { iata: 'DUS', city: 'Düsseldorf', country: 'Germany', countryCode: 'DE' },
    { iata: 'CGN', city: 'Cologne', country: 'Germany', countryCode: 'DE' },
    { iata: 'HAM', city: 'Hamburg', country: 'Germany', countryCode: 'DE' },
    { iata: 'STR', city: 'Stuttgart', country: 'Germany', countryCode: 'DE' },

    // Italy
    { iata: 'FCO', city: 'Rome', country: 'Italy', countryCode: 'IT' },
    { iata: 'MXP', city: 'Milan', country: 'Italy', countryCode: 'IT' },
    { iata: 'VCE', city: 'Venice', country: 'Italy', countryCode: 'IT' },
    { iata: 'NAP', city: 'Naples', country: 'Italy', countryCode: 'IT' },
    { iata: 'BGY', city: 'Milan', country: 'Italy', countryCode: 'IT' },
    { iata: 'BLQ', city: 'Bologna', country: 'Italy', countryCode: 'IT' },
    { iata: 'FLR', city: 'Florence', country: 'Italy', countryCode: 'IT' },
    { iata: 'CIA', city: 'Rome', country: 'Italy', countryCode: 'IT' },

    // Spain
    { iata: 'MAD', city: 'Madrid', country: 'Spain', countryCode: 'ES' },
    { iata: 'BCN', city: 'Barcelona', country: 'Spain', countryCode: 'ES' },
    { iata: 'AGP', city: 'Málaga', country: 'Spain', countryCode: 'ES' },
    { iata: 'ALC', city: 'Alicante', country: 'Spain', countryCode: 'ES' },
    { iata: 'PMI', city: 'Palma de Mallorca', country: 'Spain', countryCode: 'ES' },
    { iata: 'TFS', city: 'Tenerife', country: 'Spain', countryCode: 'ES' },
    { iata: 'SVQ', city: 'Seville', country: 'Spain', countryCode: 'ES' },
    { iata: 'VLC', city: 'Valencia', country: 'Spain', countryCode: 'ES' },

    // Portugal
    { iata: 'LIS', city: 'Lisbon', country: 'Portugal', countryCode: 'PT' },
    { iata: 'OPO', city: 'Porto', country: 'Portugal', countryCode: 'PT' },
    { iata: 'FNC', city: 'Funchal', country: 'Portugal', countryCode: 'PT' },

    // United Kingdom
    { iata: 'LHR', city: 'London', country: 'United Kingdom', countryCode: 'GB' },
    { iata: 'LGW', city: 'London', country: 'United Kingdom', countryCode: 'GB' },
    { iata: 'STN', city: 'London', country: 'United Kingdom', countryCode: 'GB' },
    { iata: 'LTN', city: 'London', country: 'United Kingdom', countryCode: 'GB' },
    { iata: 'MAN', city: 'Manchester', country: 'United Kingdom', countryCode: 'GB' },
    { iata: 'EDI', city: 'Edinburgh', country: 'United Kingdom', countryCode: 'GB' },
    { iata: 'BHX', city: 'Birmingham', country: 'United Kingdom', countryCode: 'GB' },
    { iata: 'GLA', city: 'Glasgow', country: 'United Kingdom', countryCode: 'GB' },

    // Netherlands
    { iata: 'AMS', city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL' },
    { iata: 'RTM', city: 'Rotterdam', country: 'Netherlands', countryCode: 'NL' },

    // Belgium
    { iata: 'BRU', city: 'Brussels', country: 'Belgium', countryCode: 'BE' },
    { iata: 'CRL', city: 'Charleroi', country: 'Belgium', countryCode: 'BE' },

    // Switzerland
    { iata: 'ZRH', city: 'Zurich', country: 'Switzerland', countryCode: 'CH' },
    { iata: 'GVA', city: 'Geneva', country: 'Switzerland', countryCode: 'CH' },
    { iata: 'BSL', city: 'Basel', country: 'Switzerland', countryCode: 'CH' },

    // United Arab Emirates
    { iata: 'DXB', city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE' },
    { iata: 'AUH', city: 'Abu Dhabi', country: 'United Arab Emirates', countryCode: 'AE' },
    { iata: 'SHJ', city: 'Sharjah', country: 'United Arab Emirates', countryCode: 'AE' },

    // Saudi Arabia
    { iata: 'RUH', city: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA' },
    { iata: 'JED', city: 'Jeddah', country: 'Saudi Arabia', countryCode: 'SA' },
    { iata: 'DMM', city: 'Dammam', country: 'Saudi Arabia', countryCode: 'SA' },
    { iata: 'MED', city: 'Medina', country: 'Saudi Arabia', countryCode: 'SA' },
    { iata: 'ABT', city: 'Al Baha', country: 'Saudi Arabia', countryCode: 'SA' },

    // Qatar
    { iata: 'DOH', city: 'Doha', country: 'Qatar', countryCode: 'QA' },

    // Kuwait
    { iata: 'KWI', city: 'Kuwait City', country: 'Kuwait', countryCode: 'KW' },

    // Bahrain
    { iata: 'BAH', city: 'Bahrain', country: 'Bahrain', countryCode: 'BH' },

    // Oman
    { iata: 'MCT', city: 'Muscat', country: 'Oman', countryCode: 'OM' },

    // Turkey
    { iata: 'IST', city: 'Istanbul', country: 'Turkey', countryCode: 'TR' },
    { iata: 'SAW', city: 'Istanbul', country: 'Turkey', countryCode: 'TR' },
    { iata: 'ADB', city: 'Izmir', country: 'Turkey', countryCode: 'TR' },
    { iata: 'AYT', city: 'Antalya', country: 'Turkey', countryCode: 'TR' },
    { iata: 'ESB', city: 'Ankara', country: 'Turkey', countryCode: 'TR' },
    { iata: 'ADB', city: 'Antalya', country: 'Turkey', countryCode: 'TR' },

    // Egypt
    { iata: 'CAI', city: 'Cairo', country: 'Egypt', countryCode: 'EG' },
    { iata: 'HBE', city: 'Alexandria', country: 'Egypt', countryCode: 'EG' },
    { iata: 'HRG', city: 'Hurghada', country: 'Egypt', countryCode: 'EG' },
    { iata: 'SSH', city: 'Sharm El Sheikh', country: 'Egypt', countryCode: 'EG' },
    { iata: 'LXR', city: 'Luxor', country: 'Egypt', countryCode: 'EG' },
    { iata: 'ASW', city: 'Aswan', country: 'Egypt', countryCode: 'EG' },

    // Morocco
    { iata: 'CMN', city: 'Casablanca', country: 'Morocco', countryCode: 'MA' },
    { iata: 'RAK', city: 'Marrakech', country: 'Morocco', countryCode: 'MA' },
    { iata: 'FEZ', city: 'Fez', country: 'Morocco', countryCode: 'MA' },
    { iata: 'RBA', city: 'Rabat', country: 'Morocco', countryCode: 'MA' },
    { iata: 'AGA', city: 'Agadir', country: 'Morocco', countryCode: 'MA' },
    { iata: 'TNG', city: 'Tangier', country: 'Morocco', countryCode: 'MA' },

    // Algeria
    { iata: 'ALG', city: 'Algiers', country: 'Algeria', countryCode: 'DZ' },
    { iata: 'ORN', city: 'Oran', country: 'Algeria', countryCode: 'DZ' },

    // Libya
    { iata: 'TIP', city: 'Tripoli', country: 'Libya', countryCode: 'LY' },
    { iata: 'BEN', city: 'Benghazi', country: 'Libya', countryCode: 'LY' },

    // Greece
    { iata: 'ATH', city: 'Athens', country: 'Greece', countryCode: 'GR' },
    { iata: 'CHQ', city: 'Chania', country: 'Greece', countryCode: 'GR' },
    { iata: 'HER', city: 'Heraklion', country: 'Greece', countryCode: 'GR' },
    { iata: 'RHO', city: 'Rhodes', country: 'Greece', countryCode: 'GR' },
    { iata: 'JMK', city: 'Mykonos', country: 'Greece', countryCode: 'GR' },
    { iata: 'JTR', city: 'Santorini', country: 'Greece', countryCode: 'GR' },
    { iata: 'SKG', city: 'Thessaloniki', country: 'Greece', countryCode: 'GR' },

    // Croatia
    { iata: 'DBV', city: 'Dubrovnik', country: 'Croatia', countryCode: 'HR' },
    { iata: 'SPU', city: 'Split', country: 'Croatia', countryCode: 'HR' },
    { iata: 'ZAG', city: 'Zagreb', country: 'Croatia', countryCode: 'HR' },

    // Thailand
    { iata: 'BKK', city: 'Bangkok', country: 'Thailand', countryCode: 'TH' },
    { iata: 'DMK', city: 'Bangkok', country: 'Thailand', countryCode: 'TH' },
    { iata: 'HKT', city: 'Phuket', country: 'Thailand', countryCode: 'TH' },
    { iata: 'CNX', city: 'Chiang Mai', country: 'Thailand', countryCode: 'TH' },
    { iata: 'USM', city: 'Koh Samui', country: 'Thailand', countryCode: 'TH' },

    // Malaysia
    { iata: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', countryCode: 'MY' },
    { iata: 'PEN', city: 'Penang', country: 'Malaysia', countryCode: 'MY' },

    // Indonesia
    { iata: 'CGK', city: 'Jakarta', country: 'Indonesia', countryCode: 'ID' },
    { iata: 'DPS', city: 'Bali', country: 'Indonesia', countryCode: 'ID' },
    { iata: 'SUB', city: 'Surabaya', country: 'Indonesia', countryCode: 'ID' },

    // Singapore
    { iata: 'SIN', city: 'Singapore', country: 'Singapore', countryCode: 'SG' },

    // Maldives
    { iata: 'MLE', city: 'Malé', country: 'Maldives', countryCode: 'MV' },

    // India
    { iata: 'DEL', city: 'New Delhi', country: 'India', countryCode: 'IN' },
    { iata: 'BOM', city: 'Mumbai', country: 'India', countryCode: 'IN' },
    { iata: 'GOI', city: 'Goa', country: 'India', countryCode: 'IN' },
    { iata: 'COK', city: 'Kochi', country: 'India', countryCode: 'IN' },
    { iata: 'BLR', city: 'Bangalore', country: 'India', countryCode: 'IN' },
    { iata: 'MAA', city: 'Chennai', country: 'India', countryCode: 'IN' },

    // China
    { iata: 'PEK', city: 'Beijing', country: 'China', countryCode: 'CN' },
    { iata: 'PVG', city: 'Shanghai', country: 'China', countryCode: 'CN' },
    { iata: 'HKG', city: 'Hong Kong', country: 'China', countryCode: 'HK' },
    { iata: 'CAN', city: 'Guangzhou', country: 'China', countryCode: 'CN' },
    { iata: 'CTU', city: 'Chengdu', country: 'China', countryCode: 'CN' },

    // Japan
    { iata: 'NRT', city: 'Tokyo', country: 'Japan', countryCode: 'JP' },
    { iata: 'HND', city: 'Tokyo', country: 'Japan', countryCode: 'JP' },
    { iata: 'KIX', city: 'Osaka', country: 'Japan', countryCode: 'JP' },
    { iata: 'CTS', city: 'Sapporo', country: 'Japan', countryCode: 'JP' },
    { iata: 'FUK', city: 'Fukuoka', country: 'Japan', countryCode: 'JP' },

    // South Korea
    { iata: 'ICN', city: 'Seoul', country: 'South Korea', countryCode: 'KR' },
    { iata: 'GMP', city: 'Seoul', country: 'South Korea', countryCode: 'KR' },
    { iata: 'PUS', city: 'Busan', country: 'South Korea', countryCode: 'KR' },

    // United States
    { iata: 'JFK', city: 'New York', country: 'United States', countryCode: 'US' },
    { iata: 'LGA', city: 'New York', country: 'United States', countryCode: 'US' },
    { iata: 'EWR', city: 'Newark', country: 'United States', countryCode: 'US' },
    { iata: 'LAX', city: 'Los Angeles', country: 'United States', countryCode: 'US' },
    { iata: 'ORD', city: 'Chicago', country: 'United States', countryCode: 'US' },
    { iata: 'MIA', city: 'Miami', country: 'United States', countryCode: 'US' },
    { iata: 'SFO', city: 'San Francisco', country: 'United States', countryCode: 'US' },
    { iata: 'IAH', city: 'Houston', country: 'United States', countryCode: 'US' },
    { iata: 'ATL', city: 'Atlanta', country: 'United States', countryCode: 'US' },
    { iata: 'BOS', city: 'Boston', country: 'United States', countryCode: 'US' },
    { iata: 'IAD', city: 'Washington', country: 'United States', countryCode: 'US' },
    { iata: 'SEA', city: 'Seattle', country: 'United States', countryCode: 'US' },

    // Canada
    { iata: 'YYZ', city: 'Toronto', country: 'Canada', countryCode: 'CA' },
    { iata: 'YUL', city: 'Montreal', country: 'Canada', countryCode: 'CA' },
    { iata: 'YVR', city: 'Vancouver', country: 'Canada', countryCode: 'CA' },
    { iata: 'YOW', city: 'Ottawa', country: 'Canada', countryCode: 'CA' },

    // Brazil
    { iata: 'GRU', city: 'São Paulo', country: 'Brazil', countryCode: 'BR' },
    { iata: 'GIG', city: 'Rio de Janeiro', country: 'Brazil', countryCode: 'BR' },
    { iata: 'BSB', city: 'Brasília', country: 'Brazil', countryCode: 'BR' },

    // Mexico
    { iata: 'MEX', city: 'Mexico City', country: 'Mexico', countryCode: 'MX' },
    { iata: 'CUN', city: 'Cancún', country: 'Mexico', countryCode: 'MX' },
    { iata: 'GDL', city: 'Guadalajara', country: 'Mexico', countryCode: 'MX' },

    // Russia
    { iata: 'SVO', city: 'Moscow', country: 'Russia', countryCode: 'RU' },
    { iata: 'DME', city: 'Moscow', country: 'Russia', countryCode: 'RU' },
    { iata: 'LED', city: 'Saint Petersburg', country: 'Russia', countryCode: 'RU' },

    // Australia
    { iata: 'SYD', city: 'Sydney', country: 'Australia', countryCode: 'AU' },
    { iata: 'MEL', city: 'Melbourne', country: 'Australia', countryCode: 'AU' },
    { iata: 'BNE', city: 'Brisbane', country: 'Australia', countryCode: 'AU' },
    { iata: 'PER', city: 'Perth', country: 'Australia', countryCode: 'AU' },
    { iata: 'CBR', city: 'Canberra', country: 'Australia', countryCode: 'AU' },

    // New Zealand
    { iata: 'AKL', city: 'Auckland', country: 'New Zealand', countryCode: 'NZ' },
    { iata: 'WLG', city: 'Wellington', country: 'New Zealand', countryCode: 'NZ' },
    { iata: 'CHC', city: 'Christchurch', country: 'New Zealand', countryCode: 'NZ' },

    // South Africa
    { iata: 'JNB', city: 'Johannesburg', country: 'South Africa', countryCode: 'ZA' },
    { iata: 'CPT', city: 'Cape Town', country: 'South Africa', countryCode: 'ZA' },
    { iata: 'DUR', city: 'Durban', country: 'South Africa', countryCode: 'ZA' },

    // Kenya
    { iata: 'NBO', city: 'Nairobi', country: 'Kenya', countryCode: 'KE' },
    { iata: 'MBA', city: 'Mombasa', country: 'Kenya', countryCode: 'KE' },

    // Ethiopia
    { iata: 'ADD', city: 'Addis Ababa', country: 'Ethiopia', countryCode: 'ET' },

    // Senegal
    { iata: 'DSS', city: 'Dakar', country: 'Senegal', countryCode: 'SN' },

    // Côte d'Ivoire
    { iata: 'ABJ', city: 'Abidjan', country: "Côte d'Ivoire", countryCode: 'CI' },

    // Jordan
    { iata: 'AMM', city: 'Amman', country: 'Jordan', countryCode: 'JO' },
    { iata: 'AQJ', city: 'Aqaba', country: 'Jordan', countryCode: 'JO' },

    // Lebanon
    { iata: 'BEY', city: 'Beirut', country: 'Lebanon', countryCode: 'LB' },

    // Iraq
    { iata: 'BGW', city: 'Baghdad', country: 'Iraq', countryCode: 'IQ' },
    { iata: 'EBL', city: 'Erbil', country: 'Iraq', countryCode: 'IQ' },

    // Iran
    { iata: 'IKA', city: 'Tehran', country: 'Iran', countryCode: 'IR' },
    { iata: 'THR', city: 'Tehran', country: 'Iran', countryCode: 'IR' },

    // Sri Lanka
    { iata: 'CMB', city: 'Colombo', country: 'Sri Lanka', countryCode: 'LK' },

    // Maldives
    { iata: 'MLE', city: 'Malé', country: 'Maldives', countryCode: 'MV' },
];

export function getAirportByIata(iata: string): Airport | undefined {
    return AIRPORTS.find((a) => a.iata === iata);
}

export function searchAirports(query: string): Airport[] {
    const lower = query.toLowerCase();
    return AIRPORTS.filter(
        (a) =>
            a.iata.toLowerCase().includes(lower) ||
            a.city.toLowerCase().includes(lower) ||
            a.country.toLowerCase().includes(lower),
    );
}

import visaImg from '@/assets/visa.png';
import mastercardImg from '@/assets/mastercard.png';
import cibImg from '@/assets/Cib.png';
import virementImg from '@/assets/Virement bancaire.png';

const payments = [
    { src: visaImg, alt: 'Visa' },
    { src: mastercardImg, alt: 'Mastercard' },
    { src: cibImg, alt: 'CIB' },
    { src: virementImg, alt: 'Virement Bancaire' },
];

export function PaymentLogos() {
    return (
        <div className="flex flex-wrap items-center justify-center gap-3">
            {payments.map((p) => (
                <div
                    key={p.alt}
                    className="flex h-10 items-center justify-center rounded-lg bg-white px-3 shadow-sm"
                >
                    <img
                        src={p.src}
                        alt={p.alt}
                        className="h-8 w-auto object-contain"
                    />
                </div>
            ))}
        </div>
    );
}
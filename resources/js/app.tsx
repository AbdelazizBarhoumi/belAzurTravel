import { QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
    useNavigate,
} from 'react-router-dom';
import { redirectAfterLogin } from '@/auth';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { RouteLoader } from '@/components/layout/RouteLoader';
import { SocialSidebar } from '@/components/layout/SocialSidebar';
import { NavRouteGuard } from '@/components/nav/NavRouteGuard';
import CookieConsent from '@/components/ui/CookieConsent';
import { RoleGuard } from '@/components/ui/RoleGuard';
import ScrollToTop from '@/components/ui/ScrollToTop';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { queryClient } from '@/lib/queryClient';
import { traceRoute } from '@/lib/routeTrace';
import AdminDashboard from './pages/admin';
import AdminBlog from './pages/admin/AdminBlog';
import AdminCars from './pages/admin/AdminCars';
import AdminDeals from './pages/admin/AdminDeals';
import AdminDestinations from './pages/admin/AdminDestinations';
import AdminEvents from './pages/admin/AdminEvents';
import AdminFlights from './pages/admin/AdminFlights';
import AdminGallery from './pages/admin/AdminGallery';
import AdminHotels from './pages/admin/AdminHotels';
import AdminOsTravel from './pages/admin/AdminOsTravel';
import AdminPartners from './pages/admin/AdminPartners';
import AdminPromos from './pages/admin/AdminPromos';
import AdminQueue from './pages/admin/AdminQueue';
import AdminReports from './pages/admin/AdminReports';
import AdminTeam from './pages/admin/AdminTeam';
import AdminTours from './pages/admin/AdminTours';
import AdminTravels from './pages/admin/AdminTravels';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVisas from './pages/admin/AdminVisas';
import AdminSiteSettingsCompany from './pages/admin/site-settings/AdminSiteSettingsCompany';
import AdminSiteSettingsFooter from './pages/admin/site-settings/AdminSiteSettingsFooter';
import AdminSiteSettingsLandingSections from './pages/admin/site-settings/AdminSiteSettingsLandingSections';
import AdminSiteSettingsLegal from './pages/admin/site-settings/AdminSiteSettingsLegal';
import AdminSiteSettingsNav from './pages/admin/site-settings/AdminSiteSettingsNav';
import AdminSiteSettingsPrivacyPolicy from './pages/admin/site-settings/AdminSiteSettingsPrivacyPolicy';
import AdminSiteSettingsPurchasePolicy from './pages/admin/site-settings/AdminSiteSettingsPurchasePolicy';
import AdminSiteSettingsSocial from './pages/admin/site-settings/AdminSiteSettingsSocial';
import VerifyEmail from './pages/auth/VerifyEmail';
import Blog from './pages/blog';
import BlogPostDetail from './pages/blog/show';
import Cars from './pages/cars';
import CarDetail from './pages/cars/show';
import BookingDetail from './pages/dashboards/BookingDetail';
import ClientDashboard from './pages/dashboards/Client';
import Deals from './pages/deals';
import DealDetail from './pages/deals/show';
import Destinations from './pages/destinations';
import DestinationDetail from './pages/destinations/show';
import Events from './pages/events';
import EventDetail from './pages/events/show';
import Flights from './pages/flights';
import FlightDetail from './pages/flights/show';
import Contact from './pages/general/Contact';
import Error419 from './pages/general/Error419';
import Favorites from './pages/general/Favorites';
import Gallery from './pages/general/Gallery';
import Index from './pages/general/Index';
import Legal from './pages/general/Legal';
import LegalDetail from './pages/general/LegalDetail';
import Login from './pages/general/Login';
import NotFound from './pages/general/NotFound';
import NotificationsPage from './pages/general/NotificationsPage';
import PaymentResult from './pages/general/PaymentResult';
import PrivacyPolicy from './pages/general/PrivacyPolicy';
import PurchasePolicy from './pages/general/PurchasePolicy';
import Register from './pages/general/Register';
import Team from './pages/general/Team';
import Unauthorized from './pages/general/Unauthorized';
import Hotels from './pages/hotels';
import HotelDetail from './pages/hotels/show';
import Partners from './pages/partners/index';
import Promos from './pages/promos';
import PromoDetail from './pages/promos/show';
import Tours from './pages/tours';
import TourDetail from './pages/tours/show';
import Travels from './pages/travels';
import TravelDetail from './pages/travels/show';
import Visa from './pages/visa/index';

const adminGuard = (element: JSX.Element) => (
    <RoleGuard role="admin">{element}</RoleGuard>
);

const clientGuard = (element: JSX.Element) => (
    <RoleGuard role="client">{element}</RoleGuard>
);

/**
 * LayoutWrapper detects the current route and conditionally renders:
 * - Only Routes for admin and client pages (they have their own layouts)
 * - Navbar + Routes + Footer for public pages
 */
const LayoutWrapper = () => {
    const location = useLocation();
    const { data: user } = useAuthUser();

    const navigate = useNavigate();

    // Verification redirect logic
    useEffect(() => {
        if (user && !user.email_verified_at && user.role !== 'owner') {
            const isAuthPath = [
                '/login',
                '/register',
                '/verify-email',
                '/forgot-password',
                '/reset-password',
            ].includes(location.pathname);
            if (!isAuthPath) {
                navigate('/verify-email', { replace: true });
            }
            return;
        }

        if (user?.email_verified_at && location.pathname === '/verify-email') {
            navigate(redirectAfterLogin(user.role), { replace: true });
        }
    }, [user, location.pathname, navigate]);

    traceRoute('LayoutWrapper.render', {
        locationKey: location.key,
        pathname: location.pathname,
    });

    useEffect(() => {
        traceRoute('LayoutWrapper.useEffect.pathChanged', {
            locationKey: location.key,
            pathname: location.pathname,
        });
    }, [location.key, location.pathname]);

    const isAdminRoute = location.pathname.startsWith('/admin');
    const isClientRoute = location.pathname.startsWith('/client');
    const isDashboard = location.pathname === '/dashboard';

    const isAuthRoute =
        location.pathname === '/login' || location.pathname === '/register';

    const isSpecialLayoutRoute =
        isAdminRoute || isClientRoute || isDashboard || isAuthRoute;

    return (
        <div className="flex min-h-screen flex-col">
            {!isSpecialLayoutRoute && <Navbar />}
            {!isSpecialLayoutRoute && <SocialSidebar />}
            <ScrollToTop />
            <motion.div
                className={
                    isSpecialLayoutRoute
                        ? ''
                        : 'flex-1 transition-all duration-300'
                }
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/session-expired" element={<Error419 />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/dashboard"
                        element={clientGuard(<ClientDashboard />)}
                    />
                    <Route
                        path="/client/dashboard"
                        element={clientGuard(<ClientDashboard />)}
                    />
                    <Route
                        path="/client/bookings"
                        element={clientGuard(<ClientDashboard />)}
                    />
                    <Route
                        path="/client/bookings/new"
                        element={clientGuard(<ClientDashboard />)}
                    />
                    <Route
                        path="/client/bookings/:id"
                        element={clientGuard(<BookingDetail />)}
                    />
                    <Route
                        path="/client/profile"
                        element={clientGuard(<ClientDashboard />)}
                    />
                    <Route
                        path="/client/support"
                        element={clientGuard(<ClientDashboard />)}
                    />
                    <Route
                        path="/client/complaints"
                        element={clientGuard(<ClientDashboard />)}
                    />
                    <Route
                        path="/client/refunds"
                        element={clientGuard(<ClientDashboard />)}
                    />
                    <Route
                        path="/client/payments"
                        element={clientGuard(<ClientDashboard />)}
                    />
                    <Route
                        path="/client/notifications"
                        element={clientGuard(<ClientDashboard />)}
                    />
                    <Route
                        path="/admin"
                        element={adminGuard(<AdminDashboard />)}
                    />
                    <Route
                        path="/admin/dashboard"
                        element={adminGuard(<AdminDashboard />)}
                    />
                    <Route
                        path="/admin/destinations"
                        element={adminGuard(<AdminDestinations />)}
                    />
                    <Route
                        path="/admin/hotels"
                        element={adminGuard(<AdminHotels />)}
                    />
                    <Route
                        path="/admin/os-travel"
                        element={adminGuard(<AdminOsTravel />)}
                    />
                    <Route
                        path="/admin/tours"
                        element={adminGuard(<AdminTours />)}
                    />
                    {/* Tour creation/editing handled inline in AdminTours via EntityFormDialog */}
                    <Route
                        path="/admin/travels"
                        element={adminGuard(<AdminTravels />)}
                    />
                    <Route
                        path="/admin/queue"
                        element={adminGuard(<AdminQueue />)}
                    />
                    <Route
                        path="/admin/cars"
                        element={adminGuard(<AdminCars />)}
                    />
                    <Route
                        path="/admin/flights"
                        element={adminGuard(<AdminFlights />)}
                    />
                    <Route
                        path="/admin/events"
                        element={adminGuard(<AdminEvents />)}
                    />
                    <Route
                        path="/admin/deals"
                        element={adminGuard(<AdminDeals />)}
                    />
                    <Route
                        path="/admin/promos"
                        element={adminGuard(<AdminPromos />)}
                    />
                    <Route
                        path="/admin/team"
                        element={adminGuard(<AdminTeam />)}
                    />
                    <Route
                        path="/admin/partners"
                        element={adminGuard(<AdminPartners />)}
                    />
                    <Route
                        path="/admin/blog"
                        element={adminGuard(<AdminBlog />)}
                    />
                    <Route
                        path="/admin/gallery"
                        element={adminGuard(<AdminGallery />)}
                    />
                    <Route
                        path="/admin/users"
                        element={adminGuard(<AdminUsers />)}
                    />
                    <Route
                        path="/admin/reports"
                        element={adminGuard(<AdminReports />)}
                    />
                    <Route
                        path="/admin/clients"
                        element={adminGuard(<AdminUsers />)}
                    />
                    <Route
                        path="/admin/clients/:id"
                        element={adminGuard(<AdminUsers />)}
                    />
                    <Route
                        path="/admin/visas"
                        element={adminGuard(<AdminVisas />)}
                    />
                    <Route
                        path="/admin/site-settings"
                        element={adminGuard(<AdminSiteSettingsCompany />)}
                    />
                    <Route
                        path="/admin/site-settings/social-hours"
                        element={adminGuard(<AdminSiteSettingsSocial />)}
                    />
                    <Route
                        path="/admin/site-settings/navigation"
                        element={adminGuard(<AdminSiteSettingsNav />)}
                    />
                    <Route
                        path="/admin/site-settings/footer"
                        element={adminGuard(<AdminSiteSettingsFooter />)}
                    />
                    <Route
                        path="/admin/site-settings/legal"
                        element={adminGuard(<AdminSiteSettingsLegal />)}
                    />
                    <Route
                        path="/admin/site-settings/privacy-policy"
                        element={adminGuard(<AdminSiteSettingsPrivacyPolicy />)}
                    />
                    <Route
                        path="/admin/site-settings/purchase-policy"
                        element={adminGuard(
                            <AdminSiteSettingsPurchasePolicy />,
                        )}
                    />
                    <Route
                        path="/admin/site-settings/video"
                        element={adminGuard(
                            <Navigate
                                to="/admin/site-settings/landing-sections"
                                replace
                            />,
                        )}
                    />
                    <Route
                        path="/admin/site-settings/hero-images"
                        element={adminGuard(
                            <Navigate
                                to="/admin/site-settings/landing-sections"
                                replace
                            />,
                        )}
                    />
                    <Route
                        path="/admin/site-settings/landing-sections"
                        element={adminGuard(
                            <AdminSiteSettingsLandingSections />,
                        )}
                    />
                    <Route
                        path="/admin/notifications"
                        element={adminGuard(<NotificationsPage />)}
                    />
                    <Route
                        path="/destinations"
                        element={
                            <NavRouteGuard pageKey="destinations">
                                <Destinations />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/destinations/:slug"
                        element={
                            <NavRouteGuard pageKey="destinations">
                                <DestinationDetail />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/hotels"
                        element={
                            <NavRouteGuard pageKey="hotels">
                                <Hotels />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/hotels/:id"
                        element={
                            <NavRouteGuard pageKey="hotels">
                                <HotelDetail />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/tours"
                        element={
                            <NavRouteGuard pageKey="tours">
                                <Tours />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/tours/:slug"
                        element={
                            <NavRouteGuard pageKey="tours">
                                <TourDetail />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/travels"
                        element={
                            <NavRouteGuard pageKey="travels">
                                <Travels />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/travels/:slug"
                        element={
                            <NavRouteGuard pageKey="travels">
                                <TravelDetail />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/deals/:slug"
                        element={
                            <NavRouteGuard pageKey="deals">
                                <DealDetail />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/blog/:slug"
                        element={
                            <NavRouteGuard pageKey="blog">
                                <BlogPostDetail />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/cars/:slug"
                        element={
                            <NavRouteGuard pageKey="cars">
                                <CarDetail />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/flights/:id"
                        element={
                            <NavRouteGuard pageKey="flights">
                                <FlightDetail />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/promos/:slug"
                        element={
                            <NavRouteGuard pageKey="promos">
                                <PromoDetail />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/deals"
                        element={
                            <NavRouteGuard pageKey="deals">
                                <Deals />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/blog"
                        element={
                            <NavRouteGuard pageKey="blog">
                                <Blog />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/cars"
                        element={
                            <NavRouteGuard pageKey="cars">
                                <Cars />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/flights"
                        element={
                            <NavRouteGuard pageKey="flights">
                                <Flights />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/promos"
                        element={
                            <NavRouteGuard pageKey="promos">
                                <Promos />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/team"
                        element={
                            <NavRouteGuard pageKey="team">
                                <Team />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/partners"
                        element={
                            <NavRouteGuard pageKey="partners">
                                <Partners />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/legal"
                        element={
                            <NavRouteGuard pageKey="legal">
                                <Legal />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/legal/:id"
                        element={
                            <NavRouteGuard pageKey="legal">
                                <LegalDetail />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/privacy-policy"
                        element={
                            <NavRouteGuard pageKey="privacy-policy">
                                <PrivacyPolicy />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/purchase-policy"
                        element={
                            <NavRouteGuard pageKey="purchase-policy">
                                <PurchasePolicy />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/gallery"
                        element={
                            <NavRouteGuard pageKey="gallery">
                                <Gallery />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/events"
                        element={
                            <NavRouteGuard pageKey="events">
                                <Events />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/events/:slug"
                        element={
                            <NavRouteGuard pageKey="events">
                                <EventDetail />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/contact"
                        element={
                            <NavRouteGuard pageKey="contact">
                                <Contact />
                            </NavRouteGuard>
                        }
                    />
                    <Route
                        path="/visa"
                        element={
                            <NavRouteGuard pageKey="visa">
                                <Visa />
                            </NavRouteGuard>
                        }
                    />
                    <Route path="/payment/result" element={<PaymentResult />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </motion.div>
            {!isSpecialLayoutRoute && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Footer />
                </motion.div>
            )}
        </div>
    );
};

const App = () => (
    <QueryClientProvider client={queryClient}>
        <LanguageProvider>
            <SiteSettingsProvider>
                <FavoritesProvider>
                    <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        <BrowserRouter
                            future={{
                                v7_startTransition: true,
                                v7_relativeSplatPath: true,
                            }}
                        >
                            <RouteLoader />
                            <LayoutWrapper />
                            <CookieConsent />
                        </BrowserRouter>
                    </TooltipProvider>
                </FavoritesProvider>
            </SiteSettingsProvider>
        </LanguageProvider>
    </QueryClientProvider>
);

export default App;

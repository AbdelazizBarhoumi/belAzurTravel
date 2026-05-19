import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { RouteLoader } from '@/components/layout/RouteLoader';
import { NavRouteGuard } from '@/components/nav/NavRouteGuard';
import { RoleGuard } from '@/components/ui/RoleGuard';
import ScrollToTop from '@/components/ui/ScrollToTop';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { traceRoute } from '@/lib/routeTrace';
import AdminDashboard from './pages/admin';
import AdminBlog from './pages/admin/AdminBlog';
import AdminBookings from './pages/admin/AdminBookings';
import AdminCars from './pages/admin/AdminCars';
import AdminDeals from './pages/admin/AdminDeals';
import AdminDestinations from './pages/admin/AdminDestinations';
import AdminEvents from './pages/admin/AdminEvents';
import AdminFlights from './pages/admin/AdminFlights';
import AdminGallery from './pages/admin/AdminGallery';
import AdminHotels from './pages/admin/AdminHotels';
import AdminPromos from './pages/admin/AdminPromos';
import AdminReports from './pages/admin/AdminReports';
import AdminSiteSettings from './pages/admin/AdminSiteSettings';
import AdminTours from './pages/admin/AdminTours';
import AdminUsers from './pages/admin/AdminUsers';
import Blog from './pages/blog';
import BlogPostDetail from './pages/blog/show';
import Cars from './pages/cars';
import CarDetail from './pages/cars/show';
import AssistantDashboard from './pages/dashboards/assistant';
import ClientDashboard from './pages/dashboards/Client';
import Deals from './pages/deals';
import DealDetail from './pages/deals/show';
import DesignTrip from './pages/design-trip';
import Destinations from './pages/destinations';
import DestinationDetail from './pages/destinations/show';
import Events from './pages/events';
import EventDetail from './pages/events/show';
import Flights from './pages/flights';
import FlightDetail from './pages/flights/show';
import Contact from './pages/general/Contact';
import Favorites from './pages/general/Favorites';
import Gallery from './pages/general/Gallery';
import Index from './pages/general/Index';
import Legal from './pages/general/Legal';
import Login from './pages/general/Login';
import NotFound from './pages/general/NotFound';
import NotificationsPage from './pages/general/NotificationsPage';
import Register from './pages/general/Register';
import Team from './pages/general/Team';
import Unauthorized from './pages/general/Unauthorized';
import Hotels from './pages/hotels';
import HotelDetail from './pages/hotels/show';
import Promos from './pages/promos';
import PromoDetail from './pages/promos/show';
import Tours from './pages/tours';
import TourDetail from './pages/tours/show';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Defensive defaults to prevent accidental request storms
            // from remounts/focus changes while still keeping data fresh.
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
        },
    },
});

const adminGuard = (element: JSX.Element) => (
    <RoleGuard role="admin">{element}</RoleGuard>
);

const assistantGuard = (element: JSX.Element) => (
    <RoleGuard role={['assistant', 'admin']}>{element}</RoleGuard>
);

const clientGuard = (element: JSX.Element) => (
    <RoleGuard role="client">{element}</RoleGuard>
);

/**
 * LayoutWrapper detects the current route and conditionally renders:
 * - Only Routes for admin, assistant, and client pages (they have their own layouts)
 * - Navbar + Routes + Footer for public pages
 */
const LayoutWrapper = () => {
    const location = useLocation();

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
    const isAssistantRoute = location.pathname.startsWith('/assistant');
    const isClientRoute = location.pathname.startsWith('/client');
    const isDashboard = location.pathname === '/dashboard';

    const isSpecialLayoutRoute =
        isAdminRoute || isAssistantRoute || isClientRoute || isDashboard;

    return (
        <div className="flex min-h-screen flex-col">
            {!isSpecialLayoutRoute && <Navbar />}
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
                        element={clientGuard(<ClientDashboard />)}
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
                        path="/client/payments"
                        element={clientGuard(<ClientDashboard />)}
                    />
                    <Route
                        path="/client/notifications"
                        element={clientGuard(<NotificationsPage />)}
                    />
                    <Route
                        path="/admin"
                        element={<AdminDashboard />}
                    />
                    <Route
                        path="/admin/dashboard"
                        element={<AdminDashboard />}
                    />
                    <Route
                        path="/admin/destinations"
                        element={<AdminDestinations />}
                    />
                    <Route
                        path="/admin/hotels"
                        element={<AdminHotels />}
                    />
                    <Route
                        path="/admin/tours"
                        element={<AdminTours />}
                    />
                    {/* Tour creation/editing handled inline in AdminTours via EntityFormDialog */}
                    <Route
                        path="/admin/bookings"
                        element={<AdminBookings />}
                    />
                    <Route
                        path="/admin/cars"
                        element={<AdminCars />}
                    />
                    <Route
                        path="/admin/flights"
                        element={<AdminFlights />}
                    />
                    <Route
                        path="/admin/events"
                        element={<AdminEvents />}
                    />
                    <Route
                        path="/admin/deals"
                        element={<AdminDeals />}
                    />
                    <Route
                        path="/admin/promos"
                        element={<AdminPromos />}
                    />
                    <Route
                        path="/admin/blog"
                        element={<AdminBlog />}
                    />
                    <Route
                        path="/admin/gallery"
                        element={<AdminGallery />}
                    />
                    <Route
                        path="/admin/users"
                        element={<AdminUsers />}
                    />
                    <Route
                        path="/admin/reports"
                        element={<AdminReports />}
                    />
                    <Route
                        path="/admin/clients"
                        element={<AdminUsers />}
                    />
                    <Route
                        path="/admin/clients/:id"
                        element={<AdminUsers />}
                    />
                    <Route
                        path="/admin/assistants"
                        element={<AdminUsers />}
                    />
                    <Route
                        path="/admin/site-settings"
                        element={<AdminSiteSettings />}
                    />
                    <Route
                        path="/admin/notifications"
                        element={<NotificationsPage />}
                    />
                    <Route
                        path="/assistant"
                        element={assistantGuard(<AssistantDashboard />)}
                    />
                    <Route
                        path="/assistant/dashboard"
                        element={assistantGuard(<AssistantDashboard />)}
                    />
                    <Route
                        path="/assistant/bookings"
                        element={assistantGuard(<AssistantDashboard />)}
                    />
                    <Route
                        path="/assistant/bookings/:id"
                        element={assistantGuard(<AssistantDashboard />)}
                    />
                    <Route
                        path="/assistant/messages"
                        element={assistantGuard(<AssistantDashboard />)}
                    />
                    <Route
                        path="/assistant/profile"
                        element={assistantGuard(<AssistantDashboard />)}
                    />
                    <Route
                        path="/assistant/notifications"
                        element={assistantGuard(<NotificationsPage />)}
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
                        path="/design-trip"
                        element={
                            <NavRouteGuard pageKey="design-trip">
                                <DesignTrip />
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
                        path="/legal"
                        element={
                            <NavRouteGuard pageKey="legal">
                                <Legal />
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
                        path="/favorites"
                        element={
                            <NavRouteGuard pageKey="favorites">
                                <Favorites />
                            </NavRouteGuard>
                        }
                    />
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
                        </BrowserRouter>
                    </TooltipProvider>
                </FavoritesProvider>
            </SiteSettingsProvider>
        </LanguageProvider>
    </QueryClientProvider>
);

export default App;

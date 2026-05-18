import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { NavRouteGuard } from '@/components/nav/NavRouteGuard';
import { RoleGuard } from '@/components/ui/RoleGuard';
import ScrollToTop from '@/components/ui/ScrollToTop';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
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
import AdminDashboard from './pages/AdminDashboard';
import AssistantDashboard from './pages/AssistantDashboard';
import Blog from './pages/Blog';
import BlogPostDetail from './pages/BlogPostDetail';
import CarDetail from './pages/CarDetail';
import Cars from './pages/Cars';
import ClientDashboard from './pages/ClientDashboard';
import Contact from './pages/Contact';
import DealDetail from './pages/DealDetail';
import Deals from './pages/Deals';
import DesignTrip from './pages/DesignTrip';
import DestinationDetail from './pages/DestinationDetail';
import Destinations from './pages/Destinations';
import EventDetail from './pages/EventDetail';
import Events from './pages/Events';
import Favorites from './pages/Favorites';
import FlightDetail from './pages/FlightDetail';
import Flights from './pages/Flights';
import Gallery from './pages/Gallery';
import HotelDetail from './pages/HotelDetail';
import Hotels from './pages/Hotels';
import Index from './pages/Index';
import Legal from './pages/Legal';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import NotificationsPage from './pages/NotificationsPage';
import PromoDetail from './pages/PromoDetail';
import Promos from './pages/Promos';
import Register from './pages/Register';
import Team from './pages/Team';
import TourDetail from './pages/TourDetail';
import Tours from './pages/Tours';
import Unauthorized from './pages/Unauthorized';

const queryClient = new QueryClient();

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
                        path="/admin/tours"
                        element={adminGuard(<AdminTours />)}
                    />
                    {/* Tour creation/editing handled inline in AdminTours via EntityFormDialog */}
                    <Route
                        path="/admin/bookings"
                        element={adminGuard(<AdminBookings />)}
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
                        path="/admin/assistants"
                        element={adminGuard(<AdminUsers />)}
                    />
                    <Route
                        path="/admin/site-settings"
                        element={adminGuard(<AdminSiteSettings />)}
                    />
                    <Route
                        path="/admin/notifications"
                        element={adminGuard(<NotificationsPage />)}
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
                        <LayoutWrapper />
                    </BrowserRouter>
                </TooltipProvider>
            </FavoritesProvider>
        </LanguageProvider>
    </QueryClientProvider>
);

export default App;

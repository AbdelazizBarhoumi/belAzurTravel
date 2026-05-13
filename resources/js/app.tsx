import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AdminBookings from './pages/admin/AdminBookings';
import AdminDestinations from './pages/admin/AdminDestinations';
import AdminHotels from './pages/admin/AdminHotels';
import AdminReports from './pages/admin/AdminReports';
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
import PromoDetail from './pages/PromoDetail';
import Promos from './pages/Promos';
import Register from './pages/Register';
import Team from './pages/Team';
import TourDetail from './pages/TourDetail';
import Tours from './pages/Tours';

const queryClient = new QueryClient();

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
                        <ScrollToTop />
                        <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route
                                path="/dashboard"
                                element={<ClientDashboard />}
                            />
                            <Route path="/admin" element={<AdminDashboard />} />
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
                            <Route
                                path="/admin/bookings"
                                element={<AdminBookings />}
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
                                path="/assistant"
                                element={<AssistantDashboard />}
                            />
                            <Route
                                path="/destinations"
                                element={<Destinations />}
                            />
                            <Route path="/destinations/:slug" element={<DestinationDetail />} />
                            <Route path="/hotels" element={<Hotels />} />
                            <Route path="/hotels/:id" element={<HotelDetail />} />
                            <Route path="/tours" element={<Tours />} />
                            <Route path="/tours/:slug" element={<TourDetail />} />
                            <Route path="/deals/:slug" element={<DealDetail />} />
                            <Route path="/blog/:slug" element={<BlogPostDetail />} />
                            <Route path="/cars/:slug" element={<CarDetail />} />
                            <Route path="/flights/:id" element={<FlightDetail />} />
                            <Route path="/promos/:slug" element={<PromoDetail />} />
                            <Route path="/deals" element={<Deals />} />
                            <Route path="/design-trip" element={<DesignTrip />} />
                            <Route path="/blog" element={<Blog />} />
                            <Route path="/cars" element={<Cars />} />
                            <Route path="/flights" element={<Flights />} />
                            <Route path="/promos" element={<Promos />} />
                            <Route path="/team" element={<Team />} />
                            <Route path="/legal" element={<Legal />} />
                            <Route path="/gallery" element={<Gallery />} />
                            <Route path="/events" element={<Events />} />
                            <Route path="/events/:slug" element={<EventDetail />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/favorites" element={<Favorites />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </BrowserRouter>
                </TooltipProvider>
            </FavoritesProvider>
        </LanguageProvider>
    </QueryClientProvider>
);

export default App;

import {
    LayoutDashboard,
    MapPin,
    Hotel,
    Users,
    Calendar,
    BarChart3,
    LogOut,
    Compass,
    Car,
    Plane,
    TicketPercent,
    Newspaper,
    PartyPopper,
    Bell,
    Image as ImageIcon,
    Menu,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '@/auth';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { NotificationBell } from '@/components/ui/NotificationBell';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const links = [
    {
        to: '/admin/dashboard',
        icon: LayoutDashboard,
        labelKey: 'admin.overview',
        exact: true,
    },
    { to: '/admin/destinations', icon: MapPin, labelKey: 'admin.destinations' },
    { to: '/admin/hotels', icon: Hotel, labelKey: 'admin.hotels' },
    { to: '/admin/tours', icon: Compass, labelKey: 'admin.tours' },
    { to: '/admin/cars', icon: Car, labelKey: 'admin.cars' },
    { to: '/admin/flights', icon: Plane, labelKey: 'admin.flights' },
    { to: '/admin/events', icon: PartyPopper, labelKey: 'admin.events' },
    { to: '/admin/deals', icon: TicketPercent, labelKey: 'admin.deals' },
    { to: '/admin/promos', icon: TicketPercent, labelKey: 'admin.promos' },
    { to: '/admin/blog', icon: Newspaper, labelKey: 'admin.blog' },
    { to: '/admin/bookings', icon: Calendar, labelKey: 'admin.bookings' },
    { to: '/admin/notifications', icon: Bell, labelKey: 'notifications.title' },
    { to: '/admin/users', icon: Users, labelKey: 'admin.users' },
    { to: '/admin/reports', icon: BarChart3, labelKey: 'admin.reports' },
    { to: '/admin/gallery', icon: ImageIcon, labelKey: 'nav.gallery' },
    { to: '/admin/site-settings', icon: Menu, labelKey: 'admin.siteSettings' },
];

interface Props {
    children: ReactNode;
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function AdminLayout({ children, title, subtitle, actions }: Props) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <SidebarProvider>
            <Sidebar
                side={isRtl ? 'right' : 'left'}
                collapsible="icon"
                variant="inset"
                className="border-sidebar-border/60 group-data-[side=left]:border-r group-data-[side=right]:border-l"
            >
                <SidebarHeader className="border-b border-sidebar-border/60">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="lg"
                                asChild
                                tooltip={t('admin.home')}
                            >
                                <Link
                                    to="/"
                                    className={cn(
                                        'gap-2',
                                        'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!px-0',
                                    )}
                                >
                                    <BrandLogo
                                        className={cn(
                                            'grid flex-1 items-center gap-0 text-sm leading-tight group-data-[collapsible=icon]:hidden',
                                            isRtl ? 'text-right' : 'text-left',
                                        )}
                                        imageClassName="h-5 w-auto"
                                        textClassName="truncate font-semibold"
                                        subtitle={t('admin.panel')}
                                        subtitleClassName="truncate text-xs text-sidebar-foreground/60"
                                    />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>
                            {t('admin.panel')}
                        </SidebarGroupLabel>

                        <SidebarMenu>
                            {links.map((link) => {
                                const active = link.exact
                                    ? pathname === link.to
                                    : pathname.startsWith(link.to);
                                const label = t(link.labelKey);

                                return (
                                    <SidebarMenuItem key={link.to}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            tooltip={label}
                                        >
                                            <Link
                                                to={link.to}
                                                aria-current={
                                                    active ? 'page' : undefined
                                                }
                                            >
                                                <link.icon className="h-4 w-4" />
                                                <span>{label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter className="border-t border-sidebar-border/60">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                tooltip={t('admin.signOut')}
                            >
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>{t('admin.signOut')}</span>
                                </button>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset className="min-w-0 overflow-x-hidden">
                <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur transition-[width,height] ease-linear supports-[backdrop-filter]:bg-card/80 md:px-6">
                    <div className="flex min-w-0 items-center gap-2">
                        <SidebarTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground" />

                        <div className={cn('min-w-0', isRtl && 'text-right')}>
                            <h1 className="truncate font-serif text-2xl font-bold text-foreground md:text-xl">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="truncate text-sm text-muted-foreground">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <NotificationBell feedPath="/admin/notifications" />
                        <LanguageSwitcher />
                        {actions}
                    </div>
                </header>

                {/* Mobile/Tablet Navigation */}
                <div className="lg:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-border bg-card">
                    {links.map((link) => {
                        const active = link.exact
                            ? pathname === link.to
                            : pathname.startsWith(link.to);
                        const label = t(link.labelKey);
                        const Icon = link.icon;

                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={cn(
                                    'shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                                    active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground bg-muted hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden xs:inline">{label}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 md:p-6">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}

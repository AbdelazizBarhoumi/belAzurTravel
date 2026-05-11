import {
    Plane,
    LayoutDashboard,
    MapPin,
    Hotel,
    Users,
    Calendar,
    BarChart3,
    LogOut,
    Compass,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
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
        to: '/admin',
        icon: LayoutDashboard,
        labelKey: 'admin.overview',
        exact: true,
    },
    { to: '/admin/destinations', icon: MapPin, labelKey: 'admin.destinations' },
    { to: '/admin/hotels', icon: Hotel, labelKey: 'admin.hotels' },
    { to: '/admin/tours', icon: Compass, labelKey: 'admin.tours' },
    { to: '/admin/bookings', icon: Calendar, labelKey: 'admin.bookings' },
    { to: '/admin/users', icon: Users, labelKey: 'admin.users' },
    { to: '/admin/reports', icon: BarChart3, labelKey: 'admin.reports' },
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

    const handleLogout = () => {
        localStorage.removeItem('role');
        navigate('/');
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
                            <SidebarMenuButton size="lg" asChild tooltip={t('admin.home')}>
                                <Link
                                    to="/"
                                    className={cn(
                                        'gap-2',
                                        'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!px-0',
                                    )}
                                >
                                    <Plane className="h-5 w-5 text-sidebar-primary" />
                                    <div
                                        className={cn(
                                            'grid flex-1 text-sm leading-tight group-data-[collapsible=icon]:hidden',
                                            isRtl ? 'text-right' : 'text-left',
                                        )}
                                    >
                                        <span className="truncate font-semibold">
                                            Voyageur
                                        </span>
                                        <span className="truncate text-xs text-sidebar-foreground/60">
                                            {t('admin.panel')}
                                        </span>
                                    </div>
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
                                            <Link to={link.to} aria-current={active ? 'page' : undefined}>
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
                            <SidebarMenuButton asChild tooltip={t('admin.signOut')}>
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
                <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 supports-[backdrop-filter]:bg-card/80 md:px-6">
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
                        <LanguageSwitcher />
                        {actions}
                    </div>
                </header>

                <div className="p-4 md:p-6">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}

import {
    LayoutDashboard,
    Layout,
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
    Handshake,
    Settings,
    ChevronRight,
    Globe,
    Link2,
    Navigation,
    FileText,
    Shield,
    ShoppingCart,
    AlertCircle,
    FileCheck,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout } from '@/auth';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { cn } from '@/lib/utils';

interface SubLink {
    to: string;
    icon: typeof Globe;
    labelKey: string;
    exact?: boolean;
}

interface GroupLink {
    to: string;
    icon: typeof Settings;
    labelKey: string;
    roles?: string[];
    isGroup: true;
    subLinks: SubLink[];
}

interface NavLink {
    to: string;
    icon: typeof LayoutDashboard;
    labelKey: string;
    exact?: boolean;
    roles?: string[];
}

type LinkItem = GroupLink | NavLink;

function isGroupLink(link: LinkItem): link is GroupLink {
    return 'isGroup' in link && link.isGroup === true;
}

const SITE_SETTINGS_SUB_LINKS: SubLink[] = [
    { to: '/admin/site-settings', icon: Globe, labelKey: 'admin.settings.companyContact', exact: true },
    { to: '/admin/site-settings/social-hours', icon: Link2, labelKey: 'admin.settings.socialMedia' },
    { to: '/admin/site-settings/navigation', icon: Navigation, labelKey: 'admin.settings.headerLinks' },
    { to: '/admin/site-settings/footer', icon: FileText, labelKey: 'admin.settings.footerColumns' },
    { to: '/admin/site-settings/legal', icon: Shield, labelKey: 'admin.settings.legalSectionsTitle' },
    { to: '/admin/site-settings/privacy-policy', icon: Shield, labelKey: 'nav.privacy-policy' },
    { to: '/admin/site-settings/purchase-policy', icon: ShoppingCart, labelKey: 'nav.purchase-policy' },
    { to: '/admin/site-settings/landing-sections', icon: Layout, labelKey: 'admin.settings.landingSections' },
];

const links: LinkItem[] = [
    {
        to: '/admin/dashboard',
        icon: LayoutDashboard,
        labelKey: 'admin.overview',
        exact: true,
    },
    { to: '/admin/destinations', icon: MapPin, labelKey: 'admin.destinations' },
    { to: '/admin/hotels', icon: Hotel, labelKey: 'admin.hotels' },
    { to: '/admin/tours', icon: Compass, labelKey: 'admin.tours' },
    { to: '/admin/travels', icon: Globe, labelKey: 'admin.travels' },
    { to: '/admin/cars', icon: Car, labelKey: 'admin.cars' },
    { to: '/admin/flights', icon: Plane, labelKey: 'admin.flights' },
    { to: '/admin/events', icon: PartyPopper, labelKey: 'admin.events' },
    { to: '/admin/deals', icon: TicketPercent, labelKey: 'admin.deals' },
    { to: '/admin/promos', icon: TicketPercent, labelKey: 'admin.promos' },
    { to: '/admin/visas', icon: FileCheck, labelKey: 'admin.visas' },
    { to: '/admin/team', icon: Users, labelKey: 'admin.team' },
    { to: '/admin/partners', icon: Handshake, labelKey: 'admin.partners' },
    { to: '/admin/blog', icon: Newspaper, labelKey: 'admin.blog' },
    { to: '/admin/bookings', icon: Calendar, labelKey: 'admin.bookings' },
    { to: '/admin/complaints', icon: AlertCircle, labelKey: 'admin.complaints' },
    { to: '/admin/notifications', icon: Bell, labelKey: 'notifications.title' },
    { to: '/admin/users', icon: Users, labelKey: 'admin.users' },
    { to: '/admin/reports', icon: BarChart3, labelKey: 'admin.reports' },
    { to: '/admin/gallery', icon: ImageIcon, labelKey: 'nav.gallery' },
    {
        to: '/admin/site-settings',
        icon: Settings,
        labelKey: 'admin.siteSettings',
        roles: ['owner', 'superadmin'],
        isGroup: true,
        subLinks: SITE_SETTINGS_SUB_LINKS,
    },
];

interface Props {
    children: ReactNode;
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function AdminLayout({ children, title, subtitle, actions }: Props) {
    const { pathname } = useLocation();
    const { t, dir } = useLanguage();
    const { data: user } = useAuthUser();
    const isRtl = dir === 'rtl';
    const [settingsOpen, setSettingsOpen] = useState(() =>
        pathname.startsWith('/admin/site-settings'),
    );

    const handleLogout = async () => {
        await logout();
    };

    const filteredLinks = links.filter((link) => {
        if (!link.roles) return true;
        return user && link.roles.includes(user.role);
    });

    return (
        <SidebarProvider>
            <Sidebar
                side={isRtl ? 'right' : 'left'}
                collapsible="icon"
                variant="inset"
                className="group-data-[side=right]:border-l"
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
                            {filteredLinks.map((link) => {
                                if (isGroupLink(link)) {
                                    const isSettingsActive = pathname.startsWith(link.to);
                                    return (
                                        <Collapsible
                                            key={link.to}
                                            open={settingsOpen}
                                            onOpenChange={setSettingsOpen}
                                        >
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton
                                                        isActive={isSettingsActive}
                                                        tooltip={t(link.labelKey)}
                                                    >
                                                        <link.icon className="h-4 w-4" />
                                                        <span>{t(link.labelKey)}</span>
                                                        <ChevronRight
                                                            className={cn(
                                                                'ml-auto h-4 w-4 transition-transform duration-200',
                                                                settingsOpen && 'rotate-90',
                                                            )}
                                                        />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {(link as GroupLink).subLinks.map(
                                                            (sub) => {
                                                                const subActive = sub.exact
                                                                    ? pathname === sub.to
                                                                    : pathname.startsWith(sub.to);
                                                                return (
                                                                    <SidebarMenuSubItem key={sub.to}>
                                                                        <SidebarMenuSubButton
                                                                            asChild
                                                                            isActive={subActive}
                                                                        >
                                                                            <Link to={sub.to}>
                                                                                <sub.icon className="h-3.5 w-3.5" />
                                                                                <span>{t(sub.labelKey)}</span>
                                                                            </Link>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuSubItem>
                                                                );
                                                            },
                                                        )}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    );
                                }

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
                <div className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden">
                    {filteredLinks.map((link) => {
                        if (isGroupLink(link)) {
                            const isSettingsActive = pathname.startsWith(link.to);
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={cn(
                                        'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                                        isSettingsActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    <link.icon className="h-3.5 w-3.5" />
                                    <span className="xs:inline hidden">
                                        {t(link.labelKey)}
                                    </span>
                                </Link>
                            );
                        }

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
                                    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                                    active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="xs:inline hidden">
                                    {label}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 md:p-6">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}

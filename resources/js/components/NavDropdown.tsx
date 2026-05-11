import { Link } from 'react-router-dom';
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
    NavigationMenuViewport,
} from '@/components/ui/navigation-menu';
import { useLanguage } from '@/contexts/LanguageContext';

interface DropdownItem {
    labelKey: string;
    href: string;
}

interface NavDropdownProps {
    labelKey: string;
    href: string;
    items: DropdownItem[];
    isPlusButton?: boolean;
}

export function NavDropdown({
    labelKey,
    href,
    items,
    isPlusButton = false,
}: NavDropdownProps) {
    const { t } = useLanguage();

    return (
        <NavigationMenu className="relative z-10 shrink-0">
            <NavigationMenuList className="gap-0">
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent text-sm font-medium">
                        {isPlusButton ? `+ ${t(labelKey)}` : t(labelKey)}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-48 gap-1 bg-card p-2">
                            {!isPlusButton && (
                                <li>
                                    <NavigationMenuLink asChild>
                                        <Link
                                            to={href}
                                            className="block rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
                                        >
                                            {t('common.all')} →
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                            )}
                            {items.map((item) => (
                                <li key={item.href}>
                                    <NavigationMenuLink asChild>
                                        <Link
                                            to={item.href}
                                            className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                        >
                                            {t(item.labelKey)}
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                            ))}
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
            <NavigationMenuViewport />
        </NavigationMenu>
    );
}

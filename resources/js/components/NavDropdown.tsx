import { Link, useNavigate } from 'react-router-dom';
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
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
    isActive?: boolean;
    hoverOnly?: boolean;
}

export function NavDropdown({
    labelKey,
    href,
    items,
    isPlusButton = false,
    isActive = false,
    hoverOnly = false,
}: NavDropdownProps) {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const navigate = useNavigate();

    const handleTriggerClick = () => {
        if (!hoverOnly && !isPlusButton && href !== '#') {
            navigate(href);
        }
    };

    return (
        <NavigationMenu className="relative z-10 shrink-0">
            <NavigationMenuList className="gap-0">
                <NavigationMenuItem>
                    <NavigationMenuTrigger
                        onClick={
                            hoverOnly
                                ? (e) => e.preventDefault()
                                : handleTriggerClick
                        }
                        onMouseDown={
                            hoverOnly ? (e) => e.preventDefault() : undefined
                        }
                        className={`bg-transparent text-sm font-medium transition-colors ${isActive ? 'text-primary' : ''} ${hoverOnly ? 'cursor-default' : 'cursor-pointer'} ${isRtl ? 'text-right' : 'text-left'}`}
                    >
                        {isPlusButton ? `+ ${t(labelKey)}` : t(labelKey)}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent
                        className={
                            isRtl ? 'right-0 text-right' : 'left-0 text-left'
                        }
                    >
                        <ul
                            className={`grid w-48 gap-1 bg-card p-2 ${isRtl ? 'text-right' : 'text-left'}`}
                        >
                            {!isPlusButton && (
                                <li>
                                    <NavigationMenuLink asChild>
                                        <Link
                                            to={href}
                                            className="block rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
                                        >
                                            {isRtl
                                                ? `← ${t('common.all')}`
                                                : `${t('common.all')} →`}
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
        </NavigationMenu>
    );
}

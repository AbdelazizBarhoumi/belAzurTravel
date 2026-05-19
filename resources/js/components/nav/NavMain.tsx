import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import type { NavItem } from '@/types';

interface NavMainProps {
    items: NavItem[];
    label?: string;
}

export function NavMain({ items, label }: NavMainProps) {
    return (
        <SidebarGroup>
            {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
            <SidebarMenu>
                {items.map((item) => (
                    <NavMainItem key={item.href} item={item} />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

interface NavMainItemProps {
    item: NavItem;
}

function NavMainItem({ item }: NavMainItemProps) {
    const Icon = item.icon;
    const hasChildren = item.items && item.items.length > 0;
    const { dir } = useLanguage();

    if (!hasChildren) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="relative"
                >
                    <Link to={item.href}>
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }

    const chevronRotation = dir === 'rtl' ? '-rotate-90' : 'rotate-90';
    const Chevron = dir === 'rtl' ? ChevronLeft : ChevronRight;

    return (
        <Collapsible
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        tooltip={item.title}
                        className="relative"
                    >
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                        <Chevron
                            className={`ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:${chevronRotation}`}
                        />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={subItem.isActive}
                                >
                                    <Link to={subItem.href}>
                                        <span>{subItem.title}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

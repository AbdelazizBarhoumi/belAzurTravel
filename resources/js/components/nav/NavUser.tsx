import { LogOut } from 'lucide-react';
import { logout } from '@/auth';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavUser() {
    const handleLogout = async () => {
        await logout();
        window.location.href = '/login';
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} tooltip="Sign Out">
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

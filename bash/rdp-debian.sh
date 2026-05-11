#!/bin/bash
# setup-xrdp-gnome-pro.sh
# Optimized for Debian, GNOME, and Apache Guacamole

set -e

# Ensure script is run as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root"
   exit 1
fi

echo "Updating system..."
apt update && apt upgrade -y

echo "Installing GNOME, Flashback (Reliability), xorgxrdp, and xrdp..."
# gnome-session-flashback is a lifesaver for Guacamole/RDP stability
apt install -y gnome-shell gnome-session gnome-session-flashback xrdp xorgxrdp

echo "Disabling Wayland to force X11 (Required for XRDP)..."
if [ -f /etc/gdm3/daemon.conf ]; then
    sed -i 's/#WaylandEnable=false/WaylandEnable=false/' /etc/gdm3/daemon.conf
fi

echo "Configuring the global startwm.sh for GNOME compatibility..."
cp /etc/xrdp/startwm.sh /etc/xrdp/startwm.sh.bak

cat <<EOF > /etc/xrdp/startwm.sh
#!/bin/sh
if [ -r /etc/default/locale ]; then
  . /etc/default/locale
  export LANG LANGUAGE
fi

# Clean up environment to prevent 'Black Screen'
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS

# Force X11 and GNOME
export XDG_SESSION_TYPE=x11
export XDG_CURRENT_DESKTOP=GNOME
export GNOME_SHELL_SESSION_MODE=debian

# Optimization: Disable GNOME animations for faster RDP response
gsettings set org.gnome.desktop.interface enable-animations false

if [ -f /etc/X11/Xsession ]; then
  exec /etc/X11/Xsession
fi

# Fallback to Flashback if standard GNOME fails to draw
exec gnome-session --session=gnome-flashback-metacity
EOF

chmod +x /etc/xrdp/startwm.sh

echo "Setting up User Skeletons..."
echo "export XDG_SESSION_TYPE=x11" > /etc/skel/.xsession
echo "exec gnome-session --session=gnome-flashback-metacity" >> /etc/skel/.xsession

echo "Applying Polkit fixes (Removes 'Authentication Required' popups)..."
mkdir -p /etc/polkit-1/localauthority/50-local.d/
cat <<EOF > /etc/polkit-1/localauthority/50-local.d/45-allow-colord.pkla
[Allow Colord]
Identity=unix-user:*
Action=org.freedesktop.color-manager.create-device;org.freedesktop.color-manager.create-profile;org.freedesktop.color-manager.delete-device;org.freedesktop.color-manager.delete-profile;org.freedesktop.color-manager.modify-device;org.freedesktop.color-manager.modify-profile
ResultAny=no
ResultInactive=no
ResultActive=yes
EOF

echo "Enabling and restarting services..."
systemctl restart gdm3
systemctl enable xrdp
systemctl restart xrdp

echo "Configuring UFW..."
apt install -y ufw
ufw allow 3389/tcp
ufw --force enable

echo "----------------------------------------------------------"
echo "Setup complete! GNOME (with Flashback fallback) is ready."
echo ""
echo "GUACAMOLE OPTIMIZATION:"
echo "1. Set Color Depth to 16-bit."
echo "2. Ensure you are LOGGED OUT of the physical VM console."
echo "3. If standard GNOME is slow, the script is pre-configured"
echo "   to use 'Flashback' mode which is much faster."
echo "----------------------------------------------------------"
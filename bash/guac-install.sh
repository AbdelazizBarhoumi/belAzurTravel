#!/bin/bash
# Fixed & improved Guacamole 1.6.0 installer for Debian/Ubuntu/Proxmox
# Tomcat 10.1.52 manual install (most reliable method)
# Author: Based on original script + major fixes (Feb 2026)

set -euo pipefail

# ────────────────────────────────────────────────────────────────
# Colors
# ────────────────────────────────────────────────────────────────
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

# ────────────────────────────────────────────────────────────────
# Version numbers and paths
# ────────────────────────────────────────────────────────────────
GUACVERSION="1.6.0"
TOMCAT_VERSION="10.1.52"
MCJVER="8.0.27"  # fallback MySQL Connector/J
LOG="/tmp/guacamole_${GUACVERSION}_build.log"

# ────────────────────────────────────────────────────────────────
# Initialize variables
# ────────────────────────────────────────────────────────────────
installTOTP=""
installDuo=""
installMySQL=""
mysqlHost=""
mysqlPort=""
mysqlRootPwd=""
guacDb=""
guacUser=""
guacPwd=""
PROMPT=""
FORCE_MODE=false

# ────────────────────────────────────────────────────────────────
# 1. Must be root
# ────────────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}This script must be run as root or with sudo${NC}" >&2
    exit 1
fi

# ────────────────────────────────────────────────────────────────
# 2. Parse command-line arguments
# ────────────────────────────────────────────────────────────────
while [ "$#" -gt 0 ]; do
    case "$1" in
        -i | --installmysql )
            installMySQL=true
            ;;
        -n | --nomysql )
            installMySQL=false
            ;;
        -h | --mysqlhost )
            shift
            mysqlHost="$1"
            ;;
        -p | --mysqlport )
            shift
            mysqlPort="$1"
            ;;
        -r | --mysqlpwd )
            shift
            mysqlRootPwd="$1"
            ;;
        -db | --guacdb )
            shift
            guacDb="$1"
            ;;
        -gu | --guacuser )
            shift
            guacUser="$1"
            ;;
        -gp | --guacpwd )
            shift
            guacPwd="$1"
            ;;
        -t | --totp )
            installTOTP=true
            ;;
        -d | --duo )
            installDuo=true
            ;;
        -o | --nomfa )
            installTOTP=false
            installDuo=false
            ;;
        -f | --force )
            FORCE_MODE=true
            ;;
    esac
    shift
done

# ────────────────────────────────────────────────────────────────
# 3. Clean old temp files
# ────────────────────────────────────────────────────────────────
if ls guacamole-* mysql-connector-java-* 2>/dev/null | grep -q .; then
    if [ "$FORCE_MODE" = true ]; then
        echo -e "${YELLOW}Removing old temp files (--force used)${NC}"
        rm -rf guacamole-* mysql-connector-java-*
    else
        echo -e "${YELLOW}Old files found:${NC}"
        ls guacamole-* mysql-connector-java-* 2>/dev/null || true
        read -p "Remove them and continue? (y/N): " ans
        if [[ "$ans" =~ ^[Yy]$ ]]; then
            rm -rf guacamole-* mysql-connector-java-*
        else
            echo -e "${RED}Aborted. Remove files manually and re-run.${NC}"
            exit 1
        fi
    fi
fi

# ────────────────────────────────────────────────────────────────
# 4. Interactive prompts (if values not provided via args)
# ────────────────────────────────────────────────────────────────
if [[ -z "${installTOTP}" ]] && [[ "${installDuo}" != true ]]; then
    echo -e -n "${CYAN}MFA: Would you like to install TOTP (choose 'N' if you want Duo)? (y/N): ${NC}"
    read PROMPT
    if [[ ${PROMPT} =~ ^[Yy]$ ]]; then
        installTOTP=true
        installDuo=false
    else
        installTOTP=false
    fi
fi

if [[ -z "${installDuo}" ]] && [[ "${installTOTP}" != true ]]; then
    echo -e -n "${CYAN}MFA: Would you like to install Duo? (y/N): ${NC}"
    read PROMPT
    if [[ ${PROMPT} =~ ^[Yy]$ ]]; then
        installDuo=true
        installTOTP=false
    else
        installDuo=false
    fi
fi

if [[ "${installTOTP}" = true ]] && [[ "${installDuo}" = true ]]; then
    echo -e "${RED}Cannot install both TOTP and Duo at the same time.${NC}" >&2
    exit 1
fi

if [[ -z "${installMySQL}" ]]; then
    echo "MySQL is required. Select 'n' if using a remote MySQL server."
    echo -e -n "${CYAN}Would you like to install MySQL locally? (Y/n): ${NC}"
    read PROMPT
    if [[ ${PROMPT} =~ ^[Nn]$ ]]; then
        installMySQL=false
    else
        installMySQL=true
    fi
fi

if [ "${installMySQL}" = false ]; then
    [ -z "${mysqlHost}" ] && read -p "Enter MySQL server hostname or IP: " mysqlHost
    [ -z "${mysqlPort}" ] && read -p "Enter MySQL server port [3306]: " mysqlPort
    [ -z "${guacDb}" ] && read -p "Enter Guacamole database name [guacamole_db]: " guacDb
    [ -z "${guacUser}" ] && read -p "Enter Guacamole user [guacamole_user]: " guacUser
fi

# Set defaults
[ -z "${mysqlHost}" ] && mysqlHost="localhost"
[ -z "${mysqlPort}" ] && mysqlPort="3306"
[ -z "${guacUser}" ] && guacUser="guacamole_user"
[ -z "${guacDb}" ] && guacDb="guacamole_db"

if [ -z "${mysqlRootPwd}" ]; then
    while true; do
        echo
        read -s -p "Enter MySQL root password for ${mysqlHost}: " mysqlRootPwd
        echo
        read -s -p "Confirm MySQL root password: " PROMPT2
        echo
        [ "${mysqlRootPwd}" = "${PROMPT2}" ] && break
        echo -e "${RED}Passwords don't match. Try again.${NC}" >&2
    done
else
    echo -e "${BLUE}MySQL root password provided via argument${NC}"
fi

if [ -z "${guacPwd}" ]; then
    while true; do
        echo -e "${BLUE}A new MySQL user (${guacUser}) will be created${NC}"
        read -s -p "Enter password for MySQL user ${guacUser}: " guacPwd
        echo
        read -s -p "Confirm password: " PROMPT2
        echo
        [ "${guacPwd}" = "${PROMPT2}" ] && break
        echo -e "${RED}Passwords don't match. Try again.${NC}" >&2
    done
else
    echo -e "${BLUE}Guacamole MySQL user password provided via argument${NC}"
fi

echo

# ────────────────────────────────────────────────────────────────
# 5. Detect distribution and set package names
# ────────────────────────────────────────────────────────────────
source /etc/os-release
if [[ "${NAME}" == "Ubuntu" ]] || [[ "${NAME}" == "Linux Mint" ]]; then
    add-apt-repository -y universe 2>/dev/null || true
    JPEGTURBO="libjpeg-turbo8-dev"
    LIBPNG="libpng-dev"
    if [ "${installMySQL}" = true ]; then
        MYSQL_PKGS="mysql-server mysql-client mysql-common"
    elif command -v mysql &>/dev/null; then
        MYSQL_PKGS=""
    else
        MYSQL_PKGS="mysql-client"
    fi
elif [[ "${NAME}" == *"Debian"* ]] || [[ "${NAME}" == *"Raspbian"* ]] || [[ "${NAME}" == *"Kali"* ]] || [[ "${NAME}" == "LMDE" ]]; then
    JPEGTURBO="libjpeg62-turbo-dev"
    LIBPNG="libpng-dev"
    if [ "${installMySQL}" = true ]; then
        MYSQL_PKGS="default-mysql-server default-mysql-client mysql-common"
    elif command -v mysql &>/dev/null; then
        MYSQL_PKGS=""
    else
        MYSQL_PKGS="default-mysql-client"
    fi
else
    echo -e "${RED}Unsupported distribution. Debian, Ubuntu, Mint, Raspbian, or Kali only.${NC}"
    exit 1
fi

# ────────────────────────────────────────────────────────────────
# 6. Install dependencies (including guacd from apt)
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Updating apt and installing dependencies...${NC}"
apt-get -qq update

# Detect FreeRDP package name
FREERDP_PKG=""
if apt-cache show freerdp2-dev &>/dev/null; then
    FREERDP_PKG="freerdp2-dev"
elif apt-cache show libfreerdp2-dev &>/dev/null; then
    FREERDP_PKG="libfreerdp2-dev"
elif apt-cache show libfreerdp-dev &>/dev/null; then
    FREERDP_PKG="libfreerdp-dev"
fi

export DEBIAN_FRONTEND=noninteractive

apt-get -y install build-essential libcairo2-dev ${JPEGTURBO} ${LIBPNG} \
    libossp-uuid-dev libavcodec-dev libavformat-dev libavutil-dev libswscale-dev \
    ${FREERDP_PKG} libpango1.0-dev libssh2-1-dev libtelnet-dev libvncserver-dev \
    libpulse-dev libssl-dev libvorbis-dev libwebp-dev libwebsockets-dev \
    libtool-bin ghostscript dpkg-dev wget crudini default-jdk \
    ${MYSQL_PKGS} &>> "${LOG}"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies. See ${LOG}${NC}" >&2
    exit 1
fi
echo -e "${GREEN}Dependencies installed OK${NC}"

# ────────────────────────────────────────────────────────────────
# 7. Clean previous Tomcat installations
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Cleaning previous Tomcat installations...${NC}"
systemctl stop tomcat10 2>/dev/null || true
systemctl disable tomcat10 2>/dev/null || true
rm -f /etc/systemd/system/tomcat10.service
rm -rf /etc/systemd/system/tomcat10.service.d
rm -rf /opt/tomcat10 /opt/apache-tomcat-*
systemctl daemon-reload

# ────────────────────────────────────────────────────────────────
# 8. Install Tomcat 10.1.52 manually (most reliable method)
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Installing Tomcat ${TOMCAT_VERSION} to /opt/tomcat10...${NC}"
mkdir -p /opt/tomcat10
cd /opt/tomcat10

wget -q --show-progress "https://dlcdn.apache.org/tomcat/tomcat-10/v${TOMCAT_VERSION}/bin/apache-tomcat-${TOMCAT_VERSION}.tar.gz" -O "apache-tomcat-${TOMCAT_VERSION}.tar.gz"
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to download Tomcat. Check network connection.${NC}" >&2
    exit 1
fi

tar xzf "apache-tomcat-${TOMCAT_VERSION}.tar.gz" --strip-components=1
rm -f "apache-tomcat-${TOMCAT_VERSION}.tar.gz"

# Verify critical files exist
if [ ! -f bin/bootstrap.jar ] || [ ! -f bin/startup.sh ]; then
    echo -e "${RED}Tomcat extraction failed - missing critical files${NC}" >&2
    exit 1
fi

echo -e "${GREEN}Tomcat ${TOMCAT_VERSION} downloaded and extracted${NC}"

# ────────────────────────────────────────────────────────────────
# 9. Create tomcat user and set permissions
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Creating tomcat user and setting permissions...${NC}"
id -u tomcat &>/dev/null || useradd -r -s /bin/false -d /opt/tomcat10 tomcat

chown -R tomcat:tomcat /opt/tomcat10
chmod +x /opt/tomcat10/bin/*.sh

# Create required writable directories
mkdir -p /opt/tomcat10/logs /opt/tomcat10/temp /opt/tomcat10/work/Catalina/localhost
chown -R tomcat:tomcat /opt/tomcat10/logs /opt/tomcat10/temp /opt/tomcat10/work
chmod -R 755 /opt/tomcat10/logs /opt/tomcat10/temp /opt/tomcat10/work

# PID directory
mkdir -p /var/run/tomcat10
chown tomcat:tomcat /var/run/tomcat10
chmod 755 /var/run/tomcat10

echo -e "${GREEN}Tomcat user and permissions configured${NC}"

# ────────────────────────────────────────────────────────────────
# 10. Create systemd service for Tomcat
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Creating systemd service for Tomcat...${NC}"
cat > /etc/systemd/system/tomcat10.service << 'EOF'
[Unit]
Description=Apache Tomcat 10 Web Application Container
After=network.target

[Service]
Type=forking
Environment="JAVA_HOME=/usr/lib/jvm/default-java"
Environment="CATALINA_PID=/var/run/tomcat10.pid"
Environment="CATALINA_HOME=/opt/tomcat10"
Environment="CATALINA_BASE=/opt/tomcat10"
Environment="CATALINA_OPTS=-Djava.awt.headless=true -Djava.security.egd=file:/dev/./urandom"
ExecStart=/opt/tomcat10/bin/startup.sh
ExecStop=/opt/tomcat10/bin/shutdown.sh
User=tomcat
Group=tomcat
UMask=0007
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable tomcat10
echo -e "${GREEN}Tomcat systemd service created${NC}"

# ────────────────────────────────────────────────────────────────
# 11. Download Jakarta EE Migration Tool (required for Tomcat 10)
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Downloading Jakarta EE Migration Tool...${NC}"
MIGRATION_VER="1.0.10"
cd /tmp
rm -rf migration-tool jakartaee-migration-*
mkdir -p migration-tool
cd migration-tool

wget -q --show-progress "https://dlcdn.apache.org/tomcat/jakartaee-migration/v${MIGRATION_VER}/binaries/jakartaee-migration-${MIGRATION_VER}-shaded.jar" -O "jakartaee-migration.jar"
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Primary mirror failed, trying archive...${NC}"
    wget -q --show-progress "https://archive.apache.org/dist/tomcat/jakartaee-migration/v${MIGRATION_VER}/binaries/jakartaee-migration-${MIGRATION_VER}-shaded.jar" -O "jakartaee-migration.jar"
fi

if [ ! -f "jakartaee-migration.jar" ]; then
    echo -e "${RED}Failed to download Jakarta EE Migration Tool${NC}" >&2
    exit 1
fi
echo -e "${GREEN}Jakarta EE Migration Tool downloaded${NC}"

# ────────────────────────────────────────────────────────────────
# 12. Download Guacamole files
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Downloading Guacamole ${GUACVERSION} files...${NC}"
cd /tmp

# Guacamole WAR (client)
wget -q --show-progress "https://apache.org/dyn/closer.lua/guacamole/${GUACVERSION}/binary/guacamole-${GUACVERSION}.war?action=download" -O "guacamole-${GUACVERSION}.war"
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Primary mirror failed, trying archive...${NC}"
    wget -q --show-progress "https://archive.apache.org/dist/guacamole/${GUACVERSION}/binary/guacamole-${GUACVERSION}.war" -O "guacamole-${GUACVERSION}.war"
fi

# Guacamole Server (guacd source)
wget -q --show-progress "https://apache.org/dyn/closer.lua/guacamole/${GUACVERSION}/source/guacamole-server-${GUACVERSION}.tar.gz?action=download" -O "guacamole-server-${GUACVERSION}.tar.gz"
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Primary mirror failed, trying archive...${NC}"
    wget -q --show-progress "https://archive.apache.org/dist/guacamole/${GUACVERSION}/source/guacamole-server-${GUACVERSION}.tar.gz" -O "guacamole-server-${GUACVERSION}.tar.gz"
fi

# JDBC extension
wget -q --show-progress "https://apache.org/dyn/closer.lua/guacamole/${GUACVERSION}/binary/guacamole-auth-jdbc-${GUACVERSION}.tar.gz?action=download" -O "guacamole-auth-jdbc-${GUACVERSION}.tar.gz"
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Primary mirror failed, trying archive...${NC}"
    wget -q --show-progress "https://archive.apache.org/dist/guacamole/${GUACVERSION}/binary/guacamole-auth-jdbc-${GUACVERSION}.tar.gz" -O "guacamole-auth-jdbc-${GUACVERSION}.tar.gz"
fi

# TOTP extension (if requested)
if [ "${installTOTP}" = true ]; then
    wget -q --show-progress "https://apache.org/dyn/closer.lua/guacamole/${GUACVERSION}/binary/guacamole-auth-totp-${GUACVERSION}.tar.gz?action=download" -O "guacamole-auth-totp-${GUACVERSION}.tar.gz" || \
    wget -q --show-progress "https://archive.apache.org/dist/guacamole/${GUACVERSION}/binary/guacamole-auth-totp-${GUACVERSION}.tar.gz" -O "guacamole-auth-totp-${GUACVERSION}.tar.gz"
fi

# Duo extension (if requested)
if [ "${installDuo}" = true ]; then
    wget -q --show-progress "https://apache.org/dyn/closer.lua/guacamole/${GUACVERSION}/binary/guacamole-auth-duo-${GUACVERSION}.tar.gz?action=download" -O "guacamole-auth-duo-${GUACVERSION}.tar.gz" || \
    wget -q --show-progress "https://archive.apache.org/dist/guacamole/${GUACVERSION}/binary/guacamole-auth-duo-${GUACVERSION}.tar.gz" -O "guacamole-auth-duo-${GUACVERSION}.tar.gz"
fi

# Verify WAR file is valid (should start with PK)
WAR_SIG=$(od -An -t x1 -N 4 "guacamole-${GUACVERSION}.war" 2>/dev/null | tr -d ' \n')
if [ "${WAR_SIG}" != "504b0304" ]; then
    echo -e "${RED}Downloaded WAR file is invalid. Check network/mirrors.${NC}" >&2
    exit 1
fi

# Extract archives
tar xzf "guacamole-server-${GUACVERSION}.tar.gz"
tar xzf "guacamole-auth-jdbc-${GUACVERSION}.tar.gz"
[ "${installTOTP}" = true ] && tar xzf "guacamole-auth-totp-${GUACVERSION}.tar.gz"
[ "${installDuo}" = true ] && tar xzf "guacamole-auth-duo-${GUACVERSION}.tar.gz"

echo -e "${GREEN}Guacamole files downloaded${NC}"

# ────────────────────────────────────────────────────────────────
# 13. Migrate WAR to Jakarta EE (required for Tomcat 10)
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Migrating Guacamole WAR to Jakarta EE (Tomcat 10 compatibility)...${NC}"
cd /tmp
cd "guacamole-server-${GUACVERSION}"
apt update
apt install -y \
  freerdp3-dev \
  libwinpr3-dev

./configure --with-init-dir=/etc/init.d --enable-rdp
make clean
CPPFLAGS="-Wno-error=deprecated-declarations" ./configure --with-init-dir=/etc/init.d --enable-rdp
make
make install
ldconfig
pkill guacd
cd ..

# Run migration (javax.* → jakarta.*)
java -jar /tmp/migration-tool/jakartaee-migration.jar \
    "/tmp/guacamole-${GUACVERSION}.war" \
    "/tmp/guacamole-jakarta.war"

if [ $? -ne 0 ] || [ ! -f "/tmp/guacamole-jakarta.war" ]; then
    echo -e "${RED}Jakarta EE migration failed${NC}" >&2
    exit 1
fi

# Verify migrated WAR is valid
MIGRATED_SIG=$(od -An -t x1 -N 4 "/tmp/guacamole-jakarta.war" 2>/dev/null | tr -d ' \n')
if [ "${MIGRATED_SIG}" != "504b0304" ]; then
    echo -e "${RED}Migrated WAR file is invalid${NC}" >&2
    exit 1
fi

MIGRATED_SIZE=$(stat -c%s "/tmp/guacamole-jakarta.war" 2>/dev/null || stat -f%z "/tmp/guacamole-jakarta.war")
if [ "${MIGRATED_SIZE}" -lt 10000000 ]; then
    echo -e "${RED}Migrated WAR file is too small (${MIGRATED_SIZE} bytes)${NC}" >&2
    exit 1
fi

echo -e "${GREEN}WAR migration completed (${MIGRATED_SIZE} bytes)${NC}"

# ────────────────────────────────────────────────────────────────
# 14. Build and install guacd (guacamole-server)
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Building guacamole-server (guacd)...${NC}"
cd "/tmp/guacamole-server-${GUACVERSION}"

export CFLAGS="-Wno-error"

./configure --with-systemd-dir=/etc/systemd/system &>> "${LOG}"
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Configure failed, trying with --enable-allow-freerdp-snapshots...${NC}"
    ./configure --with-systemd-dir=/etc/systemd/system --enable-allow-freerdp-snapshots &>> "${LOG}"
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to configure guacamole-server. See ${LOG}${NC}" >&2
        exit 1
    fi
fi

make &>> "${LOG}"
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build guacamole-server. See ${LOG}${NC}" >&2
    exit 1
fi

make install &>> "${LOG}"
ldconfig

systemctl daemon-reload
systemctl enable guacd
systemctl restart guacd

echo -e "${GREEN}guacd built and installed${NC}"

# ────────────────────────────────────────────────────────────────
# 15. Create Guacamole directories and deploy files
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Deploying Guacamole client and extensions...${NC}"
mkdir -p /etc/guacamole/lib /etc/guacamole/extensions /opt/tomcat10/webapps

# Remove any previous deployment
rm -rf /opt/tomcat10/webapps/guacamole*

# Deploy MIGRATED WAR (Jakarta EE compatible)
cp "/tmp/guacamole-jakarta.war" /opt/tomcat10/webapps/guacamole.war
chown tomcat:tomcat /opt/tomcat10/webapps/guacamole.war
chmod 644 /opt/tomcat10/webapps/guacamole.war

# Also keep a copy in /etc/guacamole for reference
cp "/tmp/guacamole-jakarta.war" /etc/guacamole/guacamole.war

# Deploy JDBC extension
cp "/tmp/guacamole-auth-jdbc-${GUACVERSION}/mysql/guacamole-auth-jdbc-mysql-${GUACVERSION}.jar" /etc/guacamole/extensions/

# Deploy TOTP extension if requested
if [ "${installTOTP}" = true ]; then
    cp "/tmp/guacamole-auth-totp-${GUACVERSION}/guacamole-auth-totp-${GUACVERSION}.jar" /etc/guacamole/extensions/
    echo -e "${GREEN}TOTP extension deployed${NC}"
fi

# Deploy Duo extension if requested
if [ "${installDuo}" = true ]; then
    cp "/tmp/guacamole-auth-duo-${GUACVERSION}/guacamole-auth-duo-${GUACVERSION}.jar" /etc/guacamole/extensions/
    echo -e "${YELLOW}Duo extension deployed - you must configure it in guacamole.properties${NC}"
fi

chown -R tomcat:tomcat /etc/guacamole/extensions/

echo -e "${GREEN}Guacamole client and extensions deployed${NC}"

# ────────────────────────────────────────────────────────────────
# 16. MySQL Connector/J
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Setting up MySQL Connector/J...${NC}"
if ls /usr/share/java/*mysql*.jar /usr/share/java/*mariadb*.jar 2>/dev/null | head -1 | grep -q .; then
    CONNECTOR_JAR=$(ls /usr/share/java/*mysql*.jar /usr/share/java/*mariadb*.jar 2>/dev/null | head -1)
    ln -sf "${CONNECTOR_JAR}" /etc/guacamole/lib/mysql-connector-java.jar
    echo -e "${GREEN}Linked system MySQL connector: ${CONNECTOR_JAR}${NC}"
else
    echo -e "${YELLOW}Downloading MySQL Connector/J ${MCJVER}...${NC}"
    cd /tmp
    wget -q "https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-java-${MCJVER}.tar.gz" -O "mysql-connector-java-${MCJVER}.tar.gz"
    tar xzf "mysql-connector-java-${MCJVER}.tar.gz"
    cp "mysql-connector-java-${MCJVER}/mysql-connector-java-${MCJVER}.jar" /etc/guacamole/lib/mysql-connector-java.jar
    echo -e "${GREEN}MySQL Connector/J ${MCJVER} installed${NC}"
fi
chown tomcat:tomcat /etc/guacamole/lib/*.jar 2>/dev/null || true

# ────────────────────────────────────────────────────────────────
# 17. Create Guacamole configuration
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Creating Guacamole configuration...${NC}"

cat > /etc/guacamole/guacamole.properties << EOF
# Guacamole configuration
guacd-hostname: localhost
guacd-port: 4822

# MySQL connection
mysql-hostname: ${mysqlHost}
mysql-port: ${mysqlPort}
mysql-database: ${guacDb}
mysql-username: ${guacUser}
mysql-password: ${guacPwd}
EOF

# Add Duo settings if installed
if [ "${installDuo}" = true ]; then
    cat >> /etc/guacamole/guacamole.properties << EOF

# Duo MFA (configure these values)
# duo-api-hostname: 
# duo-integration-key: 
# duo-secret-key: 
# duo-application-key: 
EOF
fi

cat > /etc/guacamole/guacd.conf << EOF
[server]
bind_host = 0.0.0.0
bind_port = 4822
EOF

# Create .guacamole symlinks in Tomcat home (critical for Tomcat to find config)
mkdir -p /opt/tomcat10/.guacamole
ln -sf /etc/guacamole/guacamole.properties /opt/tomcat10/.guacamole/
ln -sf /etc/guacamole/guacd.conf /opt/tomcat10/.guacamole/
chown -R tomcat:tomcat /opt/tomcat10/.guacamole

# Also link extensions and lib directories
ln -sf /etc/guacamole/extensions /opt/tomcat10/.guacamole/extensions
ln -sf /etc/guacamole/lib /opt/tomcat10/.guacamole/lib

# Fix permissions
chown -R tomcat:tomcat /etc/guacamole
chmod 755 /etc/guacamole
chmod 644 /etc/guacamole/*.properties /etc/guacamole/*.conf 2>/dev/null || true

echo -e "${GREEN}Guacamole configuration created${NC}"

# ────────────────────────────────────────────────────────────────
# 18. MySQL database setup
# ────────────────────────────────────────────────────────────────
export MYSQL_PWD="${mysqlRootPwd}"

# Build MySQL command (use socket for localhost)
if [[ "${mysqlHost}" == "localhost" ]]; then
    MYSQL_CMD="mysql -u root"
else
    MYSQL_CMD="mysql -u root -h ${mysqlHost} -P ${mysqlPort}"
fi

if [ "${installMySQL}" = true ]; then
    echo -e "${BLUE}Restarting MySQL service...${NC}"
    systemctl restart mysql || systemctl restart mariadb || true
    systemctl enable mysql 2>/dev/null || systemctl enable mariadb 2>/dev/null || true
    echo -e "${GREEN}MySQL service started${NC}"
fi

# Create database and user
echo -e "${BLUE}Setting up Guacamole database...${NC}"

guacUserHost="127.0.0.1"
if [[ "${mysqlHost}" != "localhost" ]]; then
    guacUserHost="%"
    echo -e "${YELLOW}MySQL user will accept connections from any host${NC}"
fi

${MYSQL_CMD} << EOF
DROP DATABASE IF EXISTS ${guacDb};
CREATE DATABASE ${guacDb} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS '${guacUser}'@'${guacUserHost}' IDENTIFIED BY '${guacPwd}';
GRANT SELECT,INSERT,UPDATE,DELETE ON ${guacDb}.* TO '${guacUser}'@'${guacUserHost}';
FLUSH PRIVILEGES;
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create database. Check MySQL credentials.${NC}" >&2
    exit 1
fi

# Import schema
echo -e "${BLUE}Importing Guacamole schema...${NC}"
cat /tmp/guacamole-auth-jdbc-${GUACVERSION}/mysql/schema/*.sql | ${MYSQL_CMD} -D ${guacDb}
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to import schema${NC}" >&2
    exit 1
fi

echo -e "${GREEN}Database setup complete${NC}"
unset MYSQL_PWD

# ────────────────────────────────────────────────────────────────
# 19. Start services
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Starting guacd...${NC}"
systemctl restart guacd
systemctl status guacd --no-pager | head -5

echo -e "${BLUE}Starting Tomcat...${NC}"
systemctl restart tomcat10

echo -e "${GREEN}Waiting 30 seconds for Guacamole to deploy...${NC}"
sleep 30

# ────────────────────────────────────────────────────────────────
# 20. Verify deployment
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Checking Tomcat status...${NC}"
systemctl status tomcat10 --no-pager | head -10

echo -e "${BLUE}Checking catalina.out for deployment...${NC}"
if [ -f /opt/tomcat10/logs/catalina.out ]; then
    tail -n 50 /opt/tomcat10/logs/catalina.out | grep -i -E 'guacamole|deployed|error|exception' | tail -20 || true
fi

# ────────────────────────────────────────────────────────────────
# 21. Cleanup
# ────────────────────────────────────────────────────────────────
echo -e "${BLUE}Cleaning up temp files...${NC}"
cd /tmp
rm -rf guacamole-* mysql-connector-java-* migration-tool jakartaee-migration-*

# ────────────────────────────────────────────────────────────────
# 22. Firewall rules (optional)
# ────────────────────────────────────────────────────────────────
if command -v ufw &>/dev/null; then
    if ufw status | grep -q "Status: active"; then
        ufw allow 8080/tcp comment 'Guacamole/Tomcat' 2>/dev/null || true
    fi
fi

# ────────────────────────────────────────────────────────────────
# Done!
# ────────────────────────────────────────────────────────────────
echo
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo
echo -e "  ${BLUE}URL:${NC}      http://YOUR_SERVER_IP:8080/guacamole/"
echo -e "  ${BLUE}Username:${NC} guacadmin"
echo -e "  ${BLUE}Password:${NC} guacadmin"
echo
echo -e "  ${RED}*** CHANGE THE DEFAULT PASSWORD IMMEDIATELY ***${NC}"
echo
echo -e "  ${BLUE}Logs:${NC}     /opt/tomcat10/logs/catalina.out"
echo -e "  ${BLUE}Config:${NC}   /etc/guacamole/guacamole.properties"
echo

if [ "${installDuo}" = true ]; then
    echo -e "${YELLOW}NOTE: Duo MFA is installed but NOT configured.${NC}"
    echo -e "${YELLOW}Edit /etc/guacamole/guacamole.properties to add Duo settings.${NC}"
    echo -e "${YELLOW}See: https://guacamole.apache.org/doc/${GUACVERSION}/gug/duo-auth.html${NC}"
    echo
fi

echo -e "${BLUE}To check status:${NC}"
echo "  systemctl status tomcat10"
echo "  systemctl status guacd"
echo "  tail -f /opt/tomcat10/logs/catalina.out"
echo

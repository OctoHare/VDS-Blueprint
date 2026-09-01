#!/bin/bash
# ==============================================================================
# vds-network-tune.sh
# Оптимизация сетевого стека Linux и лимитов для VPN / Прокси серверов
# Подходит для: Xray, Sing-box, Hysteria, AmneziaWG, Outline, 3X-UI, Docker и др.
# ==============================================================================

set -e

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}==============================================================${NC}"
echo -e "${CYAN}          VDS Network Tune — оптимизация сетевого стека${NC}"
echo -e "${CYAN}==============================================================${NC}"
echo
echo -e "${YELLOW}Данный скрипт вносит настройки для оптимизации сетевого стека Linux"
echo -e "и лимитов для VPN и прокси серверов.${NC}"
echo
echo "Данные настройки полностью безопасны и делают следующее:"
echo
echo "  • Включают алгоритм TCP BBR + FQ (лучше скорость и меньше задержек)"
echo "  • Включают TCP Fast Open"
echo "  • Увеличивают очереди соединений и backlog"
echo "  • Значительно повышают лимит открытых файлов (nofile)"
echo "  • Ускоряют обнаружение мёртвых соединений (keepalive)"
echo "  • Оптимизируют сетевые буферы и повторное использование портов"
echo
echo -e "${YELLOW}Применить настройки? [Y/n]:${NC} "

# Читаем именно с терминала (важно при запуске через curl | bash)
read -r answer < /dev/tty
answer=${answer:-Y}

if [[ ! "$answer" =~ ^[Yy]$ ]]; then
    echo
    echo "Отменено пользователем."
    exit 0
fi

echo
echo -e "${GREEN}→ Начинаю применение настроек...${NC}"
echo

# Проверка прав
if [[ $EUID -ne 0 ]]; then
    echo "Ошибка: скрипт нужно запускать от root (sudo)."
    exit 1
fi

# 1. Загрузка BBR
echo "1/5  Загрузка модуля tcp_bbr..."
modprobe tcp_bbr 2>/dev/null || true

# 2. sysctl конфиг
echo "2/5  Создание /etc/sysctl.d/99-vds-network-tune.conf..."
cat > /etc/sysctl.d/99-vds-network-tune.conf << 'EOF'
# === VDS Network Tune ===

# TCP Fast Open (клиент + сервер)
net.ipv4.tcp_fastopen = 3

# Очереди соединений
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.core.netdev_max_backlog = 65535

# Лимит открытых файлов в системе
fs.file-max = 2097152

# BBR + FQ (обязательная связка)
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# Быстрое обнаружение мёртвых соединений
net.ipv4.tcp_keepalive_time = 45
net.ipv4.tcp_keepalive_intvl = 15
net.ipv4.tcp_keepalive_probes = 3

# Дополнительные оптимизации для высоконагруженных прокси/VPN
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_max_tw_buckets = 5000
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
EOF

# 3. Применение sysctl
echo "3/5  Применение sysctl..."
sysctl --system > /dev/null 2>&1

# 4. Лимиты nofile
echo "4/5  Настройка лимитов открытых файлов..."

# security/limits
cat > /etc/security/limits.d/99-nofile.conf << 'EOF'
* soft nofile 1048576
* hard nofile 1048576
root soft nofile 1048576
root hard nofile 1048576
EOF

# systemd system
mkdir -p /etc/systemd/system.conf.d/
cat > /etc/systemd/system.conf.d/limits.conf << 'EOF'
[Manager]
DefaultLimitNOFILE=1048576
EOF

# systemd user
mkdir -p /etc/systemd/user.conf.d/
cat > /etc/systemd/user.conf.d/limits.conf << 'EOF'
[Manager]
DefaultLimitNOFILE=1048576
EOF

# 5. Перезагрузка systemd
echo "5/5  Перезагрузка конфигурации systemd..."
systemctl daemon-reload

echo
echo -e "${GREEN}==============================================================${NC}"
echo -e "${GREEN}  Настройки успешно применены!${NC}"
echo -e "${GREEN}==============================================================${NC}"
echo
echo "Для полного применения всех параметров (особенно лимитов nofile)"
echo "рекомендуется перезагрузить сервер."
echo
echo -e "${YELLOW}Перезагрузить сервер сейчас? [y/N]:${NC} "

read -r reboot_answer < /dev/tty
reboot_answer=${reboot_answer:-N}

if [[ "$reboot_answer" =~ ^[Yy]$ ]]; then
    echo
    echo "Перезагрузка..."
    sleep 1
    reboot
else
    echo
    echo "Перезагрузка отложена."
    echo "Не забудь позже выполнить: reboot"
    echo
fi

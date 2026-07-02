# Phoenix - до последнего вздоха и снова!

---

## 📐 Подготовительная часть

<details>
  <summary>💰 Покупка домена</summary>
  <br><br>
</details>

<details>
  <summary>💰 Аренда сервера</summary>
  <br><br>
</details>

<details>
  <summary>🔤 DNS запись, связь домена и сервера</summary>
  <br><br>
</details>

<details>
  <summary>🛠️ Выбор инструментов</summary>
  
  ## 🛠️ Выбор инструментов для подключения к серверу

  - ### CMD

    > Терминал уже есть в системе. Скачивать и устанавливать ничего не нужно.
    
    - На клавиатуре Win + R
    - В появившемся окне `cmd` и на клавиатуре Enter
    - В окне терминала:
      ```bash
      ssh <логин>@<адрес сервера>
      ```
    - Скопировать пароль, однократным нажатием правой кнопки мыши вставить пароль и на клавиатуре Enter
    

  - ### Termius

    > Красивый, модный, стильный, молодёжный!<br>
    > Вход и работа с приложением только через учётную запись.<br>
    > Бесплатная версия пригодна для работы.
    
    - [Официальный сайт](https://termius.com/)
    - [Google Play](https://play.google.com/store/apps/details?id=com.server.auditor.ssh.client)
    - [App Store](https://apps.apple.com/ru/app/termius-modern-ssh-client/id549039908)
    - [Microsoft Store](https://apps.microsoft.com/detail/9NK1GDVPX09V)
  
  - ### MobaXterm

    > Многофункциональный клиент для удалённого подключения.<br>
    > Имеет встроенные файловый менеджер, что удобно при подключение к linux.<br>
    > Бесплатная версия ограничена десятью сохраннёнными настройками подключений к серверам. 

    - [Официальный сайт](https://mobaxterm.mobatek.net)

    <br>
    
    > Ищите импортозамещенную версию без ограничения количества сохраненных сессий подключения.
<br><br>
</details>

---

## 🪏 Настрока сервера

<details>
<summary>🔄 ❶ Обновление системы</summary>

## 🔄 ❶ Обновление системы

Перед началом настройки обновим все пакеты системы:

```bash
# Обновление списков пакетов
apt update
```
```bash
# Обновление всех пакетов
apt upgrade -y
```
```bash
# Удаление ненужных зависимостей
apt autoremove -y
```
```bash
# Очистка кэша
apt autoclean
```

Или одной командой:

```bash
apt update && apt upgrade -y && apt autoremove -y && apt autoclean
```

После обновления проверим, требуется ли перезагрузка ядра:

```bash
cat /var/run/reboot-required
```

- Если команда вернула `*** System restart required ***` - нужна перезагрузка
- Если файла нет или команда ничего не вернула - можно продолжать

### Перезагрузка (если требуется):

```bash
reboot
```

> ⚠️ **Важно:** После перезагрузки подожди 1-2 минуты и подключись снова по SSH.
<br><br>
</details>

<details>
<summary>🏷️ ❷ Настройка hostname</summary>

## 🏷️ ❷ Настройка hostname

По умолчанию хостер устанавливает своё имя (например, `server001.hosting.com`).

Нужно изменить на ваш домен `megaserver.ru`.

### Смена hostname:

```bash
# Устанавливаем новый hostname
hostnamectl set-hostname megaserver.ru
```

### Универсальная команда смены hostname

Одна команда заменяет hostname и убирает старые алиасы из `/etc/hosts`:

```bash
# Определяем переменные
OLD_HOST="server001.hosting.com"
OLD_HOST_SHORT="server001"
NEW_HOST="megaserver.ru"

# Одна команда делает всё: замена + удаление алиасов + очистка пробелов
sed -i "s/$OLD_HOST/$NEW_HOST/g; s/ $OLD_HOST_SHORT//g; s/  */ /g" /etc/hosts

# Проверяем результат
cat /etc/hosts
```

**Что делает команда:**
1. Заменяет полное старое имя (`server001.hosting.com`) на новое (`megaserver.ru`)
2. Удаляет короткое старое имя (`server001`) как алиас
3. Убирает двойные пробелы (если остались после удаления)

**Результат в `/etc/hosts`:**
```
127.0.0.1 localhost
127.0.1.1 megaserver.ru
144.31.157.229 megaserver.ru
```

> 💡 **Совет:** После выполнения команды переподключись по SSH, чтобы увидеть новый hostname в prompt.

```bash
# Полная информация о hostname
hostnamectl

# Проверка всех имён
hostname
hostname -f
hostname -A
```
<br><br>
</details>

<details>
<summary>🔐 ❸ Безопасность SSH</summary>

## 🔐 ❸ Безопасность SSH 

<details>
<summary>1. 👤 Создаём sudo-пользователя</summary>
### 👤 Создаём sudo-пользователя

Придумайте имя пользователя, например `hyperadmin`

```bash
# Создаём пользователя
adduser hyperadmin
```
> На этом этапе вас спросят пароль для нового пользователя.<br>
> Введите сложный пароль, запомните его или запишите.<br>
> Введите данный пароль повторно для подтверждения.<br>
> Далее спросят описание и другие данные о пользователе.<br>
> Везде можно просто нажать Enter и в концу ввести `Y`, подтвердив, что всё правильно.

```bash
# Даём sudo права
usermod -aG sudo hyperadmin
```

```bash
# Проверяем что пользователь создан
id hyperadmin
```

Для проверки открываем новое окно/сессию и подключаемся к сервееру под созданным польнователем `hyperadmin` и его паролем.

```bash
# Проверяем
sudo whoami
```
После данной команды у вас запросят пароль пользователя `hyperadmin`, после ввода пароля в ответ должно вывести: `root`.

### ❗❗❗ Работа под sudo пользователем:

> После того как был сосздан `sudo`, но не `root` пользователь, при работе под ним многие команды будут требовать повышения прав.<br>
> <br>
> Для удобства работы рекомендуется следующая схема:<br>
> <br>
> ➡️ Используйте `sudo -i` для длительной работы.<br>
> <br>
> 1️⃣ Используйте `sudo <команда>` для разовых команд.
<br><br>
</details>

<details>
<summary>2. 🧱 Настройка UFW Firewall</summary>
### 🧱 Настройка UFW Firewall

#### Проверка статуса UFW

```bash
# Проверяем, установлен ли UFW
ufw status 2>/dev/null && echo "✅ UFW установлен" || echo "❌ UFW не установлен"
```

#### Устанавливаем UFW, если не установлен

```bash
# Устанавливаем UFW
apt install ufw -y

# Проверяем установку
ufw status
```

#### Проверяем конфигурацию UFW

```bash
# Проверяем текущий статус
ufw status verbose

# Проверяем какие порты уже открыты
ufw status numbered
```

### ℹ️ UFW Firewall как правило, если установлен то находится в выключенном состоянии `Status: inactive`. Далее включаем его и настраиваем доступ только по определённым портам. В том числе со сменой стандартного `22` SSH порта на любой, какой нравится. Кроме этих:

<details>
<summary>📜 список наиболее популярных и важных зарезервированных портов</summary>
  
```markdown
# ==============================================================================
# СИСТЕМНЫЕ И СЕТЕВЫЕ СЛУЖБЫ (WELL-KNOWN PORTS: 0 - 1023)
# ==============================================================================
20/TCP       - FTP (Передача данных)
21/TCP       - FTP (Управление/Команды)
22/TCP/UDP   - SSH (Безопасный shell, SFTP), SCP
23/TCP       - Telnet (Удаленный доступ, нешифрованный)
25/TCP       - SMTP (Отправка почты, сервер-сервер)
43/TCP       - WHOIS (Информация о доменах и IP)
53/TCP/UDP   - DNS (Разрешение доменных имен)
67/UDP       - DHCP (Сервер автоматической настройки IP)
68/UDP       - DHCP (Клиент автоматической настройки IP)
69/UDP       - TFTP (Простой протокол передачи файлов)
80/TCP       - HTTP (Стандартный веб-трафик)
88/TCP/UDP   - Kerberos (Аутентификация в Active Directory)
110/TCP      - POP3 (Получение почты, нешифрованный)
123/UDP      - NTP (Синхронизация времени)
135/TCP      - RPC / DCE Endpoint Mapper (Службы Microsoft)
137/UDP      - NetBIOS Name Service (Служба имен Windows)
138/UDP      - NetBIOS Datagram Service (Сетевое окружение Windows)
139/TCP      - NetBIOS Session Service (Файловый обмен Windows)
143/TCP      - IMAP (Управление почтой на сервере)
161/UDP      - SNMP (Мониторинг сетевых устройств)
162/UDP      - SNMP Trap (Уведомления от устройств)
179/TCP      - BGP (Протокол динамической маршрутизации интернета)
389/TCP/UDP  - LDAP (Служба каталогов)
443/TCP      - HTTPS (Зашифрованный веб-трафик, SSL/TLS)
443/UDP      - HTTP/3 (QUIC, современный быстрый веб-протокол)
445/TCP      - SMB / Microsoft-DS (Сетевые папки Windows, Active Directory)
465/TCP      - SMTPS (Зашифрованная отправка почты, SSL)
500/UDP      - IPsec / ISAKMP (Основной порт для VPN-туннелей)
514/UDP      - Syslog (Сбор системных логов)
853/TCP      - DoT (DNS over TLS, шифрованный системный DNS)
993/TCP      - IMAPS (Зашифрованный IMAP через SSL)
995/TCP      - POP3S (Зашифрованный POP3 через SSL)

# ==============================================================================
# БАЗЫ ДАННЫХ И БРОКЕРЫ (REGISTERED PORTS: 1024+)
# ==============================================================================
1433/TCP     - Microsoft SQL Server
1521/TCP     - Oracle Database
3306/TCP     - MySQL / MariaDB
5432/TCP     - PostgreSQL
5672/TCP     - RabbitMQ (Брокер сообщений, AMQP)
6379/TCP     - Redis (In-memory СУБД и кэш)
9092/TCP     - Apache Kafka (Платформа потоковой обработки данных)

# ==============================================================================
# УДАЛЕННЫЙ ДОСТУП И VPN
# ==============================================================================
3389/TCP     - RDP (Удаленный рабочий стол Windows)
4500/UDP     - IPsec NAT Traversal (Для VPN за пределами NAT)
5900/TCP     - VNC (Удаленное управление экраном)

# ==============================================================================
# DEVOPS, КОНТЕЙНЕРИЗАЦИЯ И CI/CD
# ==============================================================================
2375/TCP     - Docker Remote API (Незащищенное управление Docker)
2376/TCP     - Docker Remote API (Защищенное управление через TLS)
5000/TCP     - Docker Registry (Локальное хранилище образов)
6443/TCP     - Kubernetes API Server (Главная точка управления кластером)
8080/TCP     - HTTP Alternate / Jenkins (Сборка CI/CD, Apache Tomcat, Node.js)
10250/TCP    - Kubernetes Kubelet API (Управление узлами)

# ==============================================================================
# МОНИТОРИНГ, АНАЛИТИКА И СБОР ЛОГОВ
# ==============================================================================
3000/TCP     - Grafana (Дашборды и визуализация метрик)
5601/TCP     - Kibana (Интерфейс для работы с Elasticsearch)
8125/UDP     - StatsD (Быстрый сбор метрик приложений)
9090/TCP     - Prometheus (Сбор и хранение метрик)
9100/TCP     - Prometheus Node Exporter (Метрики железа ОС)
9200/TCP     - Elasticsearch / OpenSearch (Поиск и аналитика логов)
```
<br><br>
</details>

Например, выбрали порт 222

#### Настройка UFW

```bash
# Сбрасываем правила
ufw --force reset

# Политики по умолчанию
ufw default deny incoming
ufw default allow outgoing

# Открываем SSH на новом порту 222 (или который вы выбрали)
ufw allow 222/tcp comment 'SSH'

# Открываем HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Включаем firewall
ufw --force enable

# Проверяем статус
ufw status verbose
```
Ожидаемый результат:

```text
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
222/tcp                    ALLOW IN    Anywhere                   # SSH
80/tcp                     ALLOW IN    Anywhere                   # HTTP
443/tcp                    ALLOW IN    Anywhere                   # HTTPS
222/tcp (v6)               ALLOW IN    Anywhere (v6)              # SSH
80/tcp (v6)                ALLOW IN    Anywhere (v6)              # HTTP
443/tcp (v6)               ALLOW IN    Anywhere (v6)              # HTTPS
```
<br><br>
</details>

<details>
<summary>3. 🥷 Переключаем SSH на новый порт</summary>
### 🥷 Переключаем SSH на новый порт

```bash
# Определяем новый порт
NEW_PORT=222

# 1. Меняем порт в sshd_config
sed -i "s/^#Port 22/Port $NEW_PORT/" /etc/ssh/sshd_config
sed -i "s/^Port 22/Port $NEW_PORT/" /etc/ssh/sshd_config

# 2. Создаём override для ssh.socket
mkdir -p /etc/systemd/system/ssh.socket.d

cat > /etc/systemd/system/ssh.socket.d/override.conf << EOF
[Socket]
ListenStream=
ListenStream=0.0.0.0:$NEW_PORT
ListenStream=[::]:$NEW_PORT
EOF

# 3. Перезагружаем systemd
systemctl daemon-reload

# 4. Перезапускаем socket и сервис
systemctl restart ssh.socket 2>/dev/null || true
systemctl restart ssh

# 5. Проверяем результат
ss -tlnp | grep $NEW_PORT
```

**Ожидаемый результат:**
```bash
LISTEN 0      4096         0.0.0.0:222       0.0.0.0:*
LISTEN 0      4096            [::]:222          [::]:*
```

### 🚨 НЕ ЗАКРЫВАЯ текущую сессию/окно, откройте НОВОЕ окно терминала для проверки.<br>
Подключитесь к серверу по SSH на `222` порт с логином `hyperadmin`. Если всё успешно едем дальше.
<br><br>
</details>

<details>
<summary>4. 🏹 Утилита fail2ban</summary>
### 🏹 Утилита fail2ban

Проверка наличия fail2ban
```bash
# Проверяем установлен ли fail2ban
dpkg -l | grep fail2ban 2>/dev/null && echo "✅ fail2ban установлен" || echo "❌ fail2ban не установлен"

# Если установлен - проверяем статус
systemctl status fail2ban --no-pager 2>/dev/null || echo "Сервис не активен"
```

Установка fail2ban
```bash
# Устанавливаем fail2ban
apt install fail2ban -y

# Проверяем установку
dpkg -l | grep fail2ban
```

Настройка конфигурации для SSH
```bash
# Создаём конфигурацию для SSH на порту 222
cat > /etc/fail2ban/jail.d/sshd.local << 'EOF'
[sshd]
enabled = true
port = 222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

# Проверяем что файл создан
cat /etc/fail2ban/jail.d/sshd.local
```

Запуск fail2ban
```bash
# Добавляем в автозагрузку
systemctl enable fail2ban

# Запускаем сервис
systemctl start fail2ban

# Проверяем статус
systemctl status fail2ban --no-pager
```

Проверка что правило (jail) для SSH работает
```bash
# Проверяем статус jail для SSH
fail2ban-client status sshd

# Проверяем общую статистику
fail2ban-client status
```
<br><br>
</details>

<details>
<summary>5. ⛔ Отключае вход по SSH для пользователя `root`</summary>
### ⛔ Отключае вход по SSH для пользователя ROOT

Теперь можно безопасно отключить root login. Выполните следующий блок команд:
```
# 1. Отключаем root login
sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# 2. Проверяем что изменилось
grep "^PermitRootLogin" /etc/ssh/sshd_config

# 3. Перезапускаем SSH
systemctl restart ssh

# 4. Проверяем что SSH работает
systemctl status ssh --no-pager | head -10
```

Ожидаемый результат:
```bash
PermitRootLogin no
```
<br><br>
</details>
</details>

<details>
<summary>🆙 ❹ Авто обновление безопасности</summary>

## 🆙 ❹ Авто обновление безопасности

### Что обновляем?

**unattended-upgrades** обновляет **только обновления безопасности**:
- ✅ Критические уязвимости в ядре Linux
- ✅ Уязвимости в OpenSSL, SSH, системных библиотеках
- ❌ НЕ обновляет обычные пакеты (Docker, Xray, Caddy)
- ❌ НЕ устанавливает новые версии программ

> 💡 **Почему только security?**
> Обновление всех пакетов может сломать работающие сервисы. Для стабильного сервера достаточно только критических патчей безопасности.

Установка unattended-upgrades
```bash
# Устанавливаем пакет
apt install unattended-upgrades -y

# Проверяем установку
dpkg -l | grep unattended-upgrades
```

Включение автоматических обновлений
```bash
# Включаем автоматические обновления
dpkg-reconfigure -plow unattended-upgrades
```
<br><br>
</details>

---

## 📋 Оснащение сервера

<details>
<summary>⓿ 🐳 Docker</summary>

## ⓿ 🐳 Docker

Установка Docker, выполните блок команд:
```bash
# Устанавливаем Docker из официального репозитория
apt install docker.io -y

# Добавляем hyperadmin в группу docker (чтобы не нужен был sudo)
usermod -aG docker hyperadmin

# Проверяем
docker --version
```
<br><br>
</details>

<details>
<summary>❶ 🏗️ Portainer</summary>

## ❶ 🏗️ Portainer
  
Установка Portiner (используется [офицальная инструкци](https://docs.portainer.io/start/install-ce/server/docker/linux)), выполните блок команд:
```bash
# Запускаем Portainer (команда из официальной документации)
docker run -d \
  -p 8000:8000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:lts

# Проверяем что запустился
docker ps | grep portainer
```
<br>
После успешной установки Portainer доступен по адресу:<br>

`https://megaserver.ru:9443`, то есть на 9443 порту вышего сервера.

Поторопитесь туда зайти и создать первого пользователя с правами администратора:<br>

- оставьте логин `admin` или измените его на свой
- введите сложный пароль
- поддтвердите свой пароль
- введите setup token

Найти setup token можно в логах после установки Portainer:
```bash
# Проверяем логи
docker logs portainer --tail 20
```
Ищем строку, которая начинается с `setup_token=` и копируем длинный ключ. Теперь Portainer позволит создать первого пользователя.
<br><br>
</details>

<details>
<summary>❷ 🔒 Caddy</summary>

## ❷ 🔒 Caddy
  
Создаём две конфигурац
```bash
# Запускаем Portainer (команда из официальной документации)
docker run -d \
  -p 8000:8000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:lts

# Проверяем что запустился
docker ps | grep portainer
```
<br>
После успешной установки Portainer доступен по адресу:<br>

`https://megaserver.ru:9443`, то есть на 9443 порту вышего сервера.

Поторопитесь туда зайти и создать первого пользователя с правами администратора:<br>

- оставьте логин `admin` или измените его на свой
- введите сложный пароль
- поддтвердите свой пароль
- введите setup token

Найти setup token можно в логах после установки Portainer:
```bash
# Проверяем логи
docker logs portainer --tail 20
```
Ищем строку, которая начинается с `setup_token=` и копируем длинный ключ. Теперь Portainer позволит создать первого пользователя.
<br><br>
</details>

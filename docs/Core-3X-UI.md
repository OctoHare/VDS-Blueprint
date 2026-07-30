## 🏰 Установка инструментов (Панель 3X-UI как ядро)

> Ставим ядро нашего сервера. Что такое панель 3X-UI? Это современная диспетчерская вышка с удобными графиками и кнопками. Она берет на себя всю черновую работу по маршрутизации трафика. Вы нажимаете кнопку в браузере, а панель сама пишет нужный системный код, генерирует криптографические ключи и выдает готовый QR-код или ссылку для подключения устройства. Почему именно версия от MHSanaei? Оригинальная панель (созданная разработчиком под ником vaxilu) была прорывом, но со временем автор перестал ее обновлять. В мире сетевой безопасности заброшенный код устаревает за несколько месяцев. Команда энтузиастов во главе с разработчиком MHSanaei взяла этот исходный код и превратила его в актуальный и мощный инструмент. Это тот самый случай, когда сложнейшая математика криптографии упакована в графический интерфейс, с которым после первичной настройки справится любой человек.

<br>
<details>
<summary>📟 Панель 3X-UI установка и первичная настройка</summary>
<br>

Создаём директорию для размещения базы данных 3X-UI:
```bash
# Создаём каталог

# Для 3X-UI под размещение базы данны
mkdir -p /etc/x-ui
```

Ищем сертифкаты в контейнере Caddy:
```bash
docker exec caddy find /data/caddy/certificates -type f -name "*.crt" -o -name "*.key"
```

Далее для установки панели 3X-UI переходим в Portainer:

1. Раздел "**Stacks**"
2. Кнопка "**+ Add stack**" вверху справа
3. Задаём имя - Name: `3x-ui`
4. В окном Web editor вставляем:

```yml
services:
  3x-ui:
    image: ghcr.io/mhsanaei/3x-ui:latest
    container_name: 3x-ui
    restart: unless-stopped
    network_mode: host

    cap_add:
      - NET_ADMIN
      - NET_RAW

    environment:
      - XUI_INIT_WEB_BASE_PATH=/3xpanel/
      - XUI_PORT=2525
      - XUI_MEMORY_LIMIT=400
      - GOMEMLIMIT=400MiB

    volumes:
      - /etc/x-ui:/etc/x-ui
      - /etc/caddy/data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/megaserver.ru:/app/certs:ro
        # Перепишите в адресе каталога название вашего домена

    healthcheck:
      test: ["CMD-SHELL", "pgrep -f xray > /dev/null && curl -sSLf http://127.0.0.1:2525/pohar/ > /dev/null || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
```
5. Кнопка "**Deploy the stack**" внизу слева

Проверяем, что сертификаты от Caddy видно внутри контейнера 3X-UI
```bash
docker exec 3x-ui ls -la /app/certs
```

🔗 Теперь ваша панель доступна по адресу `https://megaserver.ru/3xpanel/`.
- Первый вход в панель 3X-UI
  - c логином `admin`
  - и паролем `admin`.

⚙️ Далее в меню панели проводим первичные настроки:

- **Настройки панель** -> **Панель**: Меняем `2053` порт в **Порт панели** на тот который выбрали (в примере `2525`), жмём кнопку **Сохранить** вверху страницы
- **Настройки панель** -> **Подписка**: Меняем путь `/sub/` в **URI-путь** на любой отличный, например `/subsub/`, жмём кнопку **Сохранить** вверху страницы
- жмём кнопку **Перезапустить панель** в верху страницы
- **Настройки панель** -> **Учётная запись**:
  - Текущий логин `admin`
  - Текущий пароль `admin`
  - Новый логин `придумайте_логин_для_входа`
  - Новый пароль `придумайте_сложный_пароль`
  - жмём кнопку **Подтвердить** внизу страницы
- заходим обратно в панель под новым логином и паролем
- **Настройки панель** -> **Учётная запись** -> вкладка **Двухфакторная аутентификация**: рекомендуется включить 2FA и настроить его

---
</details>

<details>
<summary>📟 Панель 3X-UI настройка протокола VLESS -> WARP</summary>
</details>

<details>
<summary>📟 Панель 3X-UI настройка протокол Hysteria2 -> WARP</summary>
</details>

<details>
<summary>🅰️ Протокол AmneziaWG 2.0 -> tun2socks -> 3X-UI -> WARP</summary>
</details>

<details>
<summary>➡️ Протокол TrustTunnel -> 3X-UI -> WARP</summary>
</details>

<br>

<details>
<summary>MTProto прокси для Telegram</summary>

#### Устанавливаем в контейнер прокси

[Версия от 9seconds/mtg](https://github.com/9seconds/mtg)

1. Генерируем секрет с вашим адресом:

```bash
docker run --rm nineseconds/mtg:2 generate-secret --hex tg.megaserver.ru
```
Получаем строку вида `ee76xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`


2. Готовим файл с параметрами:

- используйте серкрет сгенерированный выше (строка `secret`)
- укажите IP вашего сервера (строка `public-ipv4`)
- укажите порт (строка `bind-to`) на котором будет ваш прокси
<br>

```bash
# Создаём файл с параметрами mtg.toml
cat > /etc/mtg.toml << 'EOF'
secret = "ee76xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
bind-to = "0.0.0.0:6666"
public-ipv4 = "<IP адрес сервера>"
tolerate-time-skewness = "10s"

[anti-dpi]
enabled = true
drs = true

[logger]
level = "info"

[stats.prometheus]
enabled = true
bind-to = "127.0.0.1:3129"
http-path = "/"
metric-prefix = "mtg"
EOF
```

3. Ставим контейнер с образом `nineseconds/mtg:2`:

- `Stacks` → `+ Add stack`
- Name: `mtg`
- Web editor:

```bash
services:
  mtproto:
    image: nineseconds/mtg:2
    container_name: mtg
    restart: unless-stopped
    network_mode: "host"
    volumes:
      - /etc/mtg.toml:/config/config.toml:ro
```

4. Проверяем видимость Telegram для прокси:

```bash
docker run --rm nineseconds/mtg:2 doctor /config/config.toml
```

---
</details>

<br>

> ✅ Раз, два, три - мы снова в сети!

<br>

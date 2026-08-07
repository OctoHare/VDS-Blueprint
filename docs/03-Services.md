## 📋 Оснащение сервера (Docker, Portainer, Caddy)

<details>
<summary>0️⃣ 🐳 Docker</summary>
<br>
  
> В мире программирования Docker позволяет «упаковать» приложения и сервисы вместе со всеми внутренними настройками и зависимостями в изолированный цифровой контейнер. Этот контейнер гарантированно запустится на любом сервере одинаково, не конфликтуя с другими программами и операционной системой самого VDS.

Установка Docker, выполните блок команд:
```bash
# Устанавливаем Docker из официального репозитория
apt install docker.io -y

# Проверяем
docker --version
```

Чтобы логи контейнеров не переполнялись один раз прописываем ограничение для всех контейнеров на самом сервере и Docker принудительно ограничивает размер логов
```bash
cat <<EOF > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
```

<br>

---

<br>
</details>

<details>
<summary>1️⃣ 🏗️ Portainer</summary>
<br>
  
> В мире контейнеризации Portainer это графическая веб-оболочка, которая превращает управление Docker из текстового квеста в понятную работу с кнопками, графиками и списками прямо в браузере.
> В отличие от стандартной инструкции разработчиков, мы сознательно упростим конфигурацию. Оригинальный вариант предлагает использовать защищенный протокол HTTPS на порту 9443 и дополнительный порт 8000 для связи нескольких серверов между собой. Поскольку наш VDS автономен, мы избавимся от избыточного порта 8000, а вместо сложной настройки внутренних SSL-сертификатов переведем интерфейс на стандартный HTTP-порт 9000. За защиту этого соединения будет отвечать веб-сервер Caddy, что сделает архитектуру чище и надежнее.
  
Устанавливать Portiner (в отличии от [офицальной инструкции](https://docs.portainer.io/start/install-ce/server/docker/linux)) будем по проще. Порт 8000 используется для общения нескольких серверов с портайнер между собой, а HTTPS порт 9443 меняем на HTTP порт 9000.
<br><br>
Выполните блок команд:
```bash
# Установка и запуск Portainer
docker run -d \
  -p 9000:9000 \
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

`http://megaserver.com:9000`, то есть по HTTP протоколу на 9000 порту вашего сервера, зайдите и создайте первого пользователя с правами администратора:<br>

- придумайте свой логин для администратора, оставлять `admin` слишко очевидно 
- придумайте свой сложный пароль для администратора
- поддтвердите свой пароль, введите его второй раз
- введите **setup token**

Найти **setup token** можно в логах после установки Portainer:
```bash
# Проверяем логи
docker logs portainer --tail 20
```
Ищем строку, которая начинается с `setup_token=` и копируем длинный ключ и вставляем его в окно браузера где создаём учётную запись администратора.

<br>

---

<br>
</details>

<details>
<summary>2️⃣ 🔒 Caddy</summary>
<br>
  
> Caddy — это современный, простой в использовании веб-сервер, прокси и менеджер TLS-сертификатов, разработанный с прицелом на автоматизацию и безопасность. Он позиционируется как "веб-сервер по умолчанию" и выделяется на фоне классических решений вроде Nginx и Apache рядом ключевых преимуществ. В ИТ-архитектуре функция обратного прокси (reverse proxy) защищает наши внутренние службы от прямого контакта с интернетом.
Главная революция Caddy заключается в том, что этот веб-сервер невероятно умен и автономен. В отличие от старых серверов (вроде Nginx или Apache), Caddy самостоятельно идет в международный центр сертификации, бесплатно получает криптографический ключ безопасности (SSL/TLS) для вашего домена и сам следит за тем, чтобы зашифрованное соединение `https://` работало без сбоев 24/7.
<br>

> Конфигурационный файл веб-сервера — Caddyfile — устроен логично и последовательно.<br>
> В первой его части мы задаем заголовки безопасности (Headers), которые выполняют роль жестких инструкций для браузера посетителя. Они кардинально снижают риски перехвата данных, запрещают подмену типов файлов и защищают интерфейс управления от скрытого встраивания в чужие мошеннические страницы.<br>
> Затем мы настраиваем блок `handle_path /portainer/*`: он перехватывает запросы по этому адресу и незаметно перенаправляет их на внутренний порт 9000, который мы настроили на прошлом шаге.<br>
> Во всех остальных случаях сервер будет просто показывать скромную заглушку «Сайт на реконструкции» из папки `/var/www/html`.

[Официальный сайт](https://caddyserver.com) | [Описание](https://devtrends.ru/go/caddyserver-caddy)

Создаём директории для настроек и для сайта-заглушки:
```bash
# Создаём каталоги

# Для сайта-заглушки
mkdir -p /var/www/html

# Для конфигурационного файла Caddy
mkdir -p /etc/caddy

# Для сертификатов
mkdir -p /etc/caddy/data
```

Создаём файл `Caddyfile` с настройками для Caddy:
- впишите свой действующий email (в примере `your-email@example.com`), на него будут приходить письма в случае проблем с сертификатами
- впишите свой домен или субдомен (в примере `megaserver.com`) ведущий на сервер, который вы уже прописали в панели управления DNS записями своего домена
- придумайте и впишите адрес ведущий к Portainer (в примере `/portainer/`). Адрес должен быть не очевидный, но запоминающийся вам.
- придумайте и впишите адрес ведущий к панели 3X-UI (в примере `/3xpanel/`). Адрес должен быть не очевидный, но запоминающийся вам.

```bash
# Создаём Caddyfile
cat > /etc/caddy/Caddyfile << 'EOF'
{
    email your-email@example.com
}

megaserver.com {
    log {
        output stdout
        format console
    }

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options nosniff
        X-Frame-Options SAMEORIGIN
        Referrer-Policy strict-origin-when-cross-origin
        -Server
        -X-Powered-By
        }

    handle_path /portainer/* {
        reverse_proxy 127.0.0.1:9000
    }

    handle /3xpanel/* {
        reverse_proxy 127.0.0.1:2525
    }

    handle {
        root * /var/www/html
        encode zstd gzip
        try_files {path} {path}/ /index.html
        file_server
    }

}
EOF
```

Создаём простой HTML файл для заглушки:
```bash
# Создаём HTML заглушку
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Search</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><text y='14'>🔍</text></svg>">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
</head>
<body style="display:grid;place-items:center;min-height:100vh;margin:0">
    <main style="text-align:center;max-width:500px">
        <a href="https://github.com/OctoHare/VDS-Blueprint">
            <img src="https://github.com/OctoHare/VDS-Blueprint/raw/main/imgs/phoenix.webp?raw=true" alt="Logo" style="display:block;max-width:100%;height:auto">
        </a>
        <form action="https://www.google.com/search" method="get" style="margin-top:1rem">
            <input type="text" name="q" placeholder="Search..." required>
            <button type="submit">Google Search</button>
        </form>
    </main>
</body>
</html>
EOF
```
> ℹ️ В дальнейшем эту страницу можно легко заменить на свою. Перейдите в бесплатный чат с ИИ [DeepSeek](https://chat.deepseek.com) (или любой привычный и удобный для вас ИИ инструмент) и попросите его что-то вроде - `Сделай одностраничный сайт. На тему экологической проблематики кишечных газов крупного рогатого скота, где подробно рассматривается эта проблема, последствия и варианты решения. Сайт не должен содержать ссылок или кнопок, это одностраничный сайт заглушка и не должен содержать не рабочие элементы. Дизайн, заголовок и favicon должны соответствовать выбранной тематике сайта`. Далее полученое содержимое можно просто целиком перенести в ваш `index.html`.

<br>

Проверяем, что директории и файлы появились:
```bash
# Проверяем
ls -la /etc/caddy/
ls -la /var/www/html/
```


Далее для установки веб-сервера Caddy переходим в Portainer:

1. Раздел "**Stacks**"
2. Кнопка "**+ Add stack**" вверху справа
3. Задаём имя - **Name:** `caddy`
4. В поле **Web editor** вставляем:

```yml
services:
  caddy:
    image: ghcr.io/octohare/caddy:latest
    container_name: caddy
    restart: unless-stopped

    network_mode: host

    volumes:
      - /etc/caddy/Caddyfile:/etc/caddy/Caddyfile    # Файл настроек Caddyfile по адресу /etc/caddy/
      - /var/www/html:/var/www/html                  # Папка /var/www/html для index.html сайта-заглушки
      - /etc/caddy/data:/data                        # Сертификаты домена лежат в /etc/caddy/data
      - caddy_config:/config                         # Системный кэш Caddy внутри контейнера

    healthcheck:
      test: ["CMD-SHELL", "curl -fI http://127.0.0.1:2019/metrics"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  caddy_config:
```
5. Кнопка "**Deploy the stack**" внизу слева

> ℹ️ Используется кастомный образ Caddy собранный на базе официального `caddy:latest` с добавлением модуля **[`caddyserver/replace-response`](https://github.com/caddyserver/replace-response)**. Модуль `replace-response` добавляет в Caddyfile поддержку директивы `replace`, которая позволяет подменять текст (HTML/JS/CSS/JSON) в теле ответов бэкенда на лету. Это необходимо для корректного проксирования сервисов по **subpath** (например, `domain.com/subpath/`), когда проксируемый сервис завязан на абсолютные пути (`/static/`, `/api/`) и не умеет работать с базовыми префиксами из коробки.

Проверяем, что по адресам:
- `https://megaserver.com` - открывается HTML-заглушка
- `https://megaserver.com/portainer/` - открывается Portainer

<br><br>
➕ Дополнительно:
<br><br>
Редактирование конфигурации Caddy в Caddyfile:
```bash
nano /etc/caddy/Caddyfile
```
<br><br>
Автоформатирование Caddyfile (отступы, пробелы):
```bash
docker exec -w /etc/caddy caddy caddy fmt --overwrite
```
<br><br>
Проверка конфигурации после редактирования Caddyfile:
```bash
docker exec -w /etc/caddy caddy caddy validate
```
<br><br>
Применение конфигурации после редактирования Caddyfile:
```bash
docker exec -w /etc/caddy caddy caddy reload
```

<br>

---

<br>
</details>

<details>
<summary>3️⃣ 🚪 Прячем Portainer</summary>
<br>
  
> Мы настроили доступ к Portainer через Caddy, через обычный 443 HTTPS порт по адресу `https://megaserver.com/portainer/`<br>
> Но мы всё ещё можем попасть в Portainer по IP адресу сервера и порту - `https://<IP адрес сервера>:9000`<br>
> Даже при включенном firewall и ограниченом наборе портов сможем попасть в Portainer на 9000 порту. Всё дело в том, что Docker полностью игнорирует UFW Firewall и обходит его правила по умолчанию. Любой контейнер, который запускается с флагом `-p ` (проброс портов), автоматически становится доступен всему миру, вопреки включенному UFW Firewall. Одним из способов этого избежать является заставить Portainer слушать 9000 порт только на localhost (127.0.0.1). Для этого мы переразворачиваем контейнер с изменённым флагом `-p 127.0.0.1:9000:9000`.

Удаляем Portainer и тут же устанавливаем с другими настройками:

```bash
# Останавливаем и удаляем Portainer
docker stop portainer && docker rm -f portainer

# Установка без доступа по IP сервера
docker run -d \
  -p 127.0.0.1:9000:9000 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:lts

# Проверяем
docker ps | grep portainer
docker logs portainer --tail 10
```
<br><br>
❗Внимание, данный ⬆️ блок ⬆️ команд ⬆️ можно спойкойно использовать для обновления версии Portainer.

<br>

---

<br>
</details>
<br>

> ✔️ На данном этапе базовая инфраструктура нашего сервера полностью развернута. Запустили ключевые сервисы. Веб-сервер Caddy взял на себя всю работу по взаимодействию с внешним миром: он автоматически поддерживает шифрование трафика (занимается выпуском и перевыпуском сертификатов безопасности), выдаёт браузерам HTTP заголовки, пресекающие попытки перехвата данных или подмены интерфейса. Веб-интерфейс для управления контейнерами Portainer теперь локально изолирован, что делает его доступным из глобальной сети только по тому адресу, который мы задали. Сервер готов к эксплуатации.
<br>

---

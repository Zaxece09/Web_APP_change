# Crypto Exchange WebApp

Веб-приложение обменника криптовалюты с телеграм-ботом и PostgreSQL базой данных.

## Быстрый запуск

### 1. Установка зависимостей
```bash
pip install -r requirements.txt
```

### 2. Настройка базы данных
```sql
CREATE DATABASE exchanger_bd;
```

### 3. Создание .env файла
```env
BOT_TOKEN=your_bot_token_here
WEBAPP_URL=https://your-ngrok-url.ngrok.io
```

### 4. Запуск ngrok
```bash
ngrok http 8080
```

### 5. Запуск приложения
```bash
python run.py
```

Или запуск компонентов по отдельности:
```bash
# Flask приложение
python app.py

# Telegram бот  
python bot.py
```

## Настройка

### PostgreSQL

Параметры подключения (настроены в `config.py`):
- Host: localhost
- Port: 5432
- Database: exchanger_bd
- User: postgres
- Password: amnyam

### Telegram бот

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Добавьте токен в файл `.env`

### Ngrok (для разработки)

1. Установите [ngrok](https://ngrok.com/)
2. Запустите: `ngrok http 8080`
3. Скопируйте HTTPS URL в `.env`

## API Endpoints

### Профиль пользователя

- `GET /api/profile?userid=<telegram_user_id>` - Получить профиль
- `POST /api/profile` - Сохранить/обновить профиль

Формат данных для POST:
```json
{
    "userid": 123456789,
    "name": "Имя Фамилия", 
    "phone": "+7 (999) 123-45-67",
    "phone_additional": "+7 (999) 987-65-43",
    "email": "user@example.com",
    "address": "Москва, ул. Ленина, 1"
}
```

### Паспорт

- `POST /api/passport` - Загрузить фото паспорта (multipart/form-data)
- `GET /api/passport/<userid>` - Получить фото паспорта

## База данных

### Модель UserProfile

| Поле | Тип | Описание |
|------|-----|----------|
| id | Integer | Автоинкремент ID |
| userid | Integer | Telegram User ID (уникальный) |
| name | String(100) | Имя пользователя |
| phone | String(20) | Основной телефон |
| phone_additional | String(20) | Дополнительный телефон |
| email | String(100) | Email адрес |
| address | Text | Адрес |
| passport_photo | LargeBinary | Фото паспорта в байтах |
| created_at | DateTime | Дата создания |
| updated_at | DateTime | Дата обновления |

## Особенности

### Хранение изображений

Фото паспорта сохраняются в PostgreSQL как `LargeBinary` с оптимизацией:
- Автоматическое изменение размера до 1200x1200px
- Конвертация в JPEG с качеством 85%
- Сжатие для экономии места в БД

### Обработка ошибок

- Валидация всех входных данных
- Проверка типов файлов при загрузке
- Rollback транзакций при ошибках
- Информативные сообщения об ошибках

## Использование

1. **Создайте .env файл** с токеном бота и URL ngrok
2. **Запустите PostgreSQL** и создайте базу данных `exchanger_bd`
3. **Запустите ngrok**: `ngrok http 8080`
4. **Запустите приложение**: `python run.py`
5. **Отправьте /start** боту в Telegram
6. **Нажмите кнопку** "🚀 Открыть Crypto Exchange"
7. **Заполните профиль** и загрузите фото паспорта

## Лицензия

MIT License 
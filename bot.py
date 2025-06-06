import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from config import config

logging.basicConfig(level=logging.INFO)

bot = Bot(token=config.bot_token)
dp = Dispatcher()

@dp.message(Command("start"))
async def start_command(message: types.Message):
    """Обработчик команды /start"""
    user_id = message.from_user.id
    username = message.from_user.username or message.from_user.first_name

    webapp_url_with_id = f"{config.webapp_url}?userid={user_id}"
    web_app = WebAppInfo(url=webapp_url_with_id)

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 Открыть Crypto Exchange",
                    web_app=web_app
                )
            ]
        ]
    )
    
    welcome_text = f"""
🌟 <b>Добро пожаловать в Crypto Exchange!</b>

Привет, {username}! 👋

Добро пожаловать в лучший обменник криптовалюты по СНГ! 

<b>Что вы можете делать:</b>
💱 Создавать обмены криптовалюты
📊 Просматривать историю операций  
👤 Управлять своим профилем
🔒 Безопасно проходить верификацию

Нажмите кнопку ниже, чтобы открыть приложение!
    """
    
    await message.answer(
        welcome_text,
        reply_markup=keyboard,
        parse_mode="HTML"
    )

@dp.message()
async def echo(message: types.Message):
    """Обработчик всех остальных сообщений"""
    await message.answer(
        "Используйте команду /start чтобы открыть Crypto Exchange! 🚀"
    )

async def main():
    """Основная функция запуска бота"""
    try:
        await dp.start_polling(bot)
    except Exception as e:
        logging.error(f"Ошибка при запуске бота: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    print("🤖 Запуск бота...")
    print(f"Bot Token: {config.bot_token[:10]}...")
    print(f"WebApp URL: {config.webapp_url}")
    print("Для работы убедитесь что:")
    print("1. BOT_TOKEN установлен в .env файле")
    print("2. WEBAPP_URL указывает на ваш ngrok URL")
    print("3. PostgreSQL база данных запущена")
    
    asyncio.run(main()) 
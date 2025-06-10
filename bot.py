import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command, CommandStart
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton, MenuButtonWebApp
from config import config
import re

logging.basicConfig(level=logging.INFO)

bot = Bot(token=config.bot_token)
dp = Dispatcher()

async def setup_menu_button():
    try:
        webapp_url = f"{config.webapp_url}?auto_fullscreen=true"
        web_app = WebAppInfo(url=webapp_url)
        menu_button = MenuButtonWebApp(text="🚀 Crypto Exchange", web_app=web_app)
        
        await bot.set_chat_menu_button(menu_button=menu_button)
        logging.info("✅ Menu Button настроен для полноэкранного режима")
    except Exception as e:
        logging.error(f"❌ Ошибка настройки Menu Button: {e}")

@dp.message(CommandStart())
async def start_command(message: types.Message):
    user_id = message.from_user.id
    username = message.from_user.username or message.from_user.first_name
    
    args = message.text.split()
    referral_code = None
    
    if len(args) > 1 and args[1].startswith('ref'):
        referral_code = args[1][3:]
        logging.info(f"User {user_id} started with referral code: {referral_code}")
    
    webapp_url = f"{config.webapp_url}?userid={user_id}&auto_fullscreen=true"
    if referral_code:
        webapp_url += f"&ref={referral_code}"
    
    web_app = WebAppInfo(url=webapp_url)

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
    
    if referral_code:
        welcome_text = f"""
🌟 <b>Добро пожаловать в Crypto Exchange!</b>

Привет, {username}! 👋

Вы присоединились по реферальной ссылке! 🎉

<b>Что вас ждет:</b>
💱 Выгодные обмены криптовалюты
📊 Прозрачная история операций  
👤 Удобное управление профилем
🔒 Безопасная верификация
🎁 <b>Бонусы за регистрацию по реферальной ссылке!</b>

<b>🎯 Полноэкранный режим:</b>
Приложение автоматически откроется в полноэкранном режиме для лучшего пользовательского опыта.

Нажмите кнопку ниже чтобы начать!
        """
    else:
        welcome_text = f"""
🌟 <b>Добро пожаловать в Crypto Exchange!</b>

Привет, {username}! 👋

Добро пожаловать в лучший обменник криптовалюты по СНГ! 

<b>Что вы можете делать:</b>
💱 Создавать обмены криптовалюты
📊 Просматривать историю операций  
👤 Управлять своим профилем
🔒 Безопасно проходить верификацию
👥 Приглашать друзей и получать бонусы

<b>🎯 Полноэкранный режим:</b>
Приложение автоматически откроется в полноэкранном режиме для лучшего пользовательского опыта.

Нажмите кнопку ниже или используйте кнопку меню 🚀 для быстрого доступа!
        """
    
    await message.answer(
        welcome_text,
        reply_markup=keyboard,
        parse_mode="HTML"
    )

@dp.message(Command("ref"))
async def ref_command(message: types.Message):
    user_id = message.from_user.id
    
    webapp_url = f"{config.webapp_url}?userid={user_id}&page=referral"
    web_app = WebAppInfo(url=webapp_url)
    
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📊 Открыть реферальную систему",
                    web_app=web_app
                )
            ]
        ]
    )
    
    await message.answer(
        "🔗 <b>Реферальная система</b>\n\n"
        "Приглашайте друзей и получайте бонусы за каждого зарегистрированного пользователя!\n\n"
        "Откройте приложение чтобы получить вашу реферальную ссылку.",
        reply_markup=keyboard,
        parse_mode="HTML"
    )

@dp.message()
async def echo(message: types.Message):
    await message.answer(
        "🚀 Используйте команду /start чтобы открыть Crypto Exchange!\n\n"
        "📱 Или нажмите кнопку меню для быстрого доступа к полноэкранному приложению.\n\n"
        "💡 Доступные команды:\n"
        "• /start - запуск приложения\n"
        "• /ref - реферальная система\n"
    )

async def main():
    try:
        await setup_menu_button()
        
        await dp.start_polling(bot)
    except Exception as e:
        logging.error(f"Ошибка при запуске бота: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    print("🤖 Запуск бота с реферальной системой...")
    print(f"Bot Token: {config.bot_token[:10]}...")
    print(f"WebApp URL: {config.webapp_url}")
    print("✨ Возможности:")
    print("🖥️  Полноэкранный режим (Bot API 8.0)")
    print("🚀  Menu Button для быстрого доступа")
    print("📱  Поддержка Safe Area Insets")
    print("🔒  Защита от случайного закрытия")
    print("👥  Реферальная система")
    print("🎁  Бонусы за приглашения")
    print("\nДля работы убедитесь что:")
    print("1. BOT_TOKEN установлен в .env файле")
    print("2. WEBAPP_URL указывает на ваш ngrok URL")
    print("3. PostgreSQL база данных запущена")
    print("4. Telegram клиент поддерживает Bot API 8.0+")
    
    asyncio.run(main())
import subprocess
import threading
import time
import sys
import os

def run_flask():
    """Запуск Flask приложения"""
    print("🌐 Запуск Flask приложения...")
    subprocess.run([sys.executable, "app.py"])

def run_bot():
    """Запуск Telegram бота"""
    print("🤖 Запуск Telegram бота...")
    time.sleep(2) 
    subprocess.run([sys.executable, "bot.py"])

def main():
    """Основная функция для запуска всех сервисов"""
    print("🚀 Запуск Crypto Exchange приложения...\n")

    if not os.path.exists('.env'):
        print("⚠️  Файл .env не найден!")
        print("Создайте файл .env с настройками:")
        print("BOT_TOKEN=your_bot_token_here")
        print("WEBAPP_URL=https://your-ngrok-url.ngrok.io")
        print()
        return
    
    print("📋 Проверьте что:")
    print("1. PostgreSQL база данных запущена")
    print("2. База данных 'exchanger_bd' создана")
    print("3. В .env файле указаны правильные BOT_TOKEN и WEBAPP_URL")
    print("4. ngrok запущен на порту 8080")
    print()

    flask_thread = threading.Thread(target=run_flask, daemon=True)
    bot_thread = threading.Thread(target=run_bot, daemon=True)

    flask_thread.start()
    bot_thread.start()
    
    try:
        flask_thread.join()
        bot_thread.join()
    except KeyboardInterrupt:
        print("\n🛑 Остановка приложения...")
        print("Всё работает корректно!")

if __name__ == "__main__":
    main() 
#!/usr/bin/env python3

import sys
import os
import logging
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, get_db
from models import Base, UserProfile, Trade, PromoCode, PromoCodeUsage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def drop_all_tables():
    logger.info("🗑️  Удаление всех таблиц...")
    
    with engine.connect() as conn:
        tables_to_drop = [
            'promocode_usages',
            'promocodes', 
            'trades',
            'user_profiles'
        ]
        
        for table in tables_to_drop:
            try:
                conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                logger.info(f"✅ Таблица {table} удалена")
            except Exception as e:
                logger.warning(f"⚠️  Ошибка при удалении таблицы {table}: {e}")
        
        conn.commit()

def create_all_tables():
    logger.info("🔨 Создание новых таблиц...")
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Все таблицы созданы успешно")

def show_table_structure():
    logger.info("📋 Структура созданных таблиц:")
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """))
        
        tables = [row[0] for row in result]
        
        for table in tables:
            logger.info(f"\n🗃️  Таблица: {table}")
            
            result = conn.execute(text(f"""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = '{table}'
                ORDER BY ordinal_position
            """))
            
            for row in result:
                column_name, data_type, is_nullable, default = row
                nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
                default_str = f" DEFAULT {default}" if default else ""
                logger.info(f"   • {column_name}: {data_type} {nullable}{default_str}")

def main():
    logger.info("🚀 Начинаем пересоздание базы данных...")
    
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✅ Подключение к базе данных установлено")
        
        drop_all_tables()
        
        create_all_tables()
        
        show_table_structure()
        
        logger.info("🎉 База данных успешно пересоздана!")
        logger.info("\n📝 Что нового:")
        logger.info("   • Добавлены поля для Telegram данных (username, first_name, last_name)")
        logger.info("   • Добавлена реферальная система (referral_code, referred_by, referral_count)")
        logger.info("   • Добавлено поле is_profile_completed для отслеживания заполненности профиля")
        logger.info("   • Поля профиля теперь необязательные для новых пользователей")
        logger.info("   • Удалено поле address (адрес)")
        logger.info("   • Добавлены тестовые данные")
        
        print("\n🎯 Следующие шаги:")
        print("1. Запустите Flask приложение: python app.py")
        print("2. Запустите Telegram бота: python bot.py") 
        print("3. Настройте имя бота в javascript/referal.js")
        print("4. Обновите конфигурацию в config.py если нужно")
        
    except Exception as e:
        logger.error(f"❌ Ошибка при пересоздании базы данных: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
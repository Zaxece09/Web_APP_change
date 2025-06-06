#!/usr/bin/env python3
"""
Скрипт для пересоздания таблиц базы данных
ВНИМАНИЕ: Это удалит все существующие данные!
"""

import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from config import config
from models import Base, UserProfile, Trade
from database import engine, get_db

def recreate_database():
    """Пересоздание базы данных с нуля"""
    
    conn = psycopg2.connect(
        host=config.db.host,
        port=config.db.port,
        user=config.db.user,
        password=config.db.password,
        database='postgres' 
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    try:
        print(f"🗑️  Удаление базы данных '{config.db.database}' если она существует...")
        cursor.execute(f'DROP DATABASE IF EXISTS "{config.db.database}"')
        
        print(f"🆕 Создание новой базы данных '{config.db.database}'...")
        cursor.execute(f'CREATE DATABASE "{config.db.database}"')
        
        print("✅ База данных успешно пересоздана!")
        
    except Exception as e:
        print(f"❌ Ошибка при пересоздании базы данных: {e}")
        return False
    finally:
        cursor.close()
        conn.close()
    
    return True

def create_tables():
    """Создание всех таблиц"""
    try:
        print("📋 Создание таблиц...")
        
        Base.metadata.create_all(bind=engine)
        
        print("✅ Таблицы успешно созданы!")
        print("   - user_profiles (профили пользователей)")
        print("   - trades (обмены)")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при создании таблиц: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Начинаем пересоздание базы данных...")
    print(f"📊 База данных: {config.db.database}")
    print(f"🖥️  Хост: {config.db.host}:{config.db.port}")
    print(f"👤 Пользователь: {config.db.user}")
    print("-" * 50)
    
    if recreate_database():
        if create_tables():
            print("-" * 50)
            print("🎉 Пересоздание базы данных завершено успешно!")
            print("💡 Теперь можно запускать приложение командой: python app.py")
        else:
            print("❌ Не удалось создать таблицы")
    else:
        print("❌ Не удалось пересоздать базу данных") 
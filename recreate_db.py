#!/usr/bin/env python3
"""
Скрипт для пересоздания таблиц базы данных
ВНИМАНИЕ: Это удалит все существующие данные!
"""

from sqlalchemy import create_engine, text
from config import config
from models import Base
import sys

def recreate_tables():
    """Пересоздание таблиц с новой структурой"""
    DATABASE_URL = f"postgresql+psycopg2://{config.db.user}:{config.db.password}@{config.db.host}:{config.db.port}/{config.db.database}"
    
    try:
        engine = create_engine(DATABASE_URL, echo=True)
        
        print("🔄 Подключение к базе данных...")
        with engine.connect() as connection:
            print("✅ Успешное подключение к PostgreSQL!")
            
            print("🗑️  Удаление существующей таблицы user_profiles...")
            connection.execute(text("DROP TABLE IF EXISTS user_profiles CASCADE;"))
            connection.commit()
            print("✅ Таблица user_profiles удалена")

        print("🏗️  Создание новых таблиц...")
        Base.metadata.create_all(engine)
        print("✅ Таблицы успешно созданы с новой структурой!")

        print("🔍 Проверка структуры таблицы...")
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'user_profiles' 
                ORDER BY ordinal_position;
            """))
            
            print("\n📋 Структура таблицы user_profiles:")
            for row in result:
                nullable = "NULL" if row.is_nullable == "YES" else "NOT NULL"
                print(f"   {row.column_name}: {row.data_type} {nullable}")
        
        print("\n🎉 Пересоздание таблиц завершено успешно!")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при пересоздании таблиц: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Запуск пересоздания таблиц...")
    success = recreate_tables()
    
    if success:
        print("\n✅ Все готово! Теперь можно запускать приложение.")
        sys.exit(0)
    else:
        print("\n❌ Произошла ошибка при пересоздании таблиц.")
        sys.exit(1) 
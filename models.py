from sqlalchemy import Column, Integer, String, LargeBinary, DateTime, Text, BigInteger, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

Base = declarative_base()

class UserProfile(Base):
    __tablename__ = 'user_profiles'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    userid = Column(BigInteger, unique=True, nullable=False, index=True) 
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    phone_additional = Column(String(20), nullable=True)
    email = Column(String(100), nullable=False)
    address = Column(Text, nullable=False)
    passport_photo = Column(LargeBinary, nullable=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Связь с обменами
    trades = relationship("Trade", back_populates="user")
    
    def to_dict(self):
        return {
            'id': self.id,
            'userid': self.userid,
            'name': self.name,
            'phone': self.phone,
            'phone_additional': self.phone_additional,
            'email': self.email,
            'address': self.address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Trade(Base):
    __tablename__ = 'trades'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    trade_id = Column(String(50), unique=True, nullable=False, index=True) 
    userid = Column(BigInteger, ForeignKey('user_profiles.userid'), nullable=False, index=True)
    amount_usdt = Column(Float, nullable=False) 
    amount_rub = Column(Float, nullable=False)  
    trade_date = Column(String(20), nullable=False) 
    trade_time = Column(String(20), nullable=False) 
    status = Column(String(20), nullable=False, default='Ожидание')  
    transaction_hash = Column(String(255), nullable=True) 
    usdt_address = Column(String(255), nullable=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    user = relationship("UserProfile", back_populates="trades")
    
    def to_dict(self):
        return {
            'id': self.id,
            'trade_id': self.trade_id,
            'userid': self.userid,
            'amount_usdt': self.amount_usdt,
            'amount_rub': self.amount_rub,
            'trade_date': self.trade_date,
            'trade_time': self.trade_time,
            'status': self.status,
            'transaction_hash': self.transaction_hash,
            'usdt_address': self.usdt_address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 
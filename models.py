from sqlalchemy import Column, Integer, String, LargeBinary, DateTime, Text, BigInteger, Float, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

Base = declarative_base()

class UserProfile(Base):
    __tablename__ = 'user_profiles'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    userid = Column(BigInteger, unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    phone_additional = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    is_admin = Column(Integer, nullable=False, default=0)
    is_profile_completed = Column(Boolean, nullable=False, default=False)
    passport_photo = Column(LargeBinary, nullable=True)
    
    referral_code = Column(String(50), unique=True, nullable=True, index=True)
    referred_by_userid = Column(BigInteger, nullable=True)
    referral_earnings = Column(Float, default=0.0)
    referral_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    trades = relationship("Trade", back_populates="user")
    
    def to_dict(self):
        return {
            'id': self.id,
            'userid': self.userid,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'name': self.name,
            'phone': self.phone,
            'phone_additional': self.phone_additional,
            'email': self.email,
            'is_admin': self.is_admin,
            'is_profile_completed': self.is_profile_completed,
            'referral_code': self.referral_code,
            'referred_by': self.referred_by_userid,
            'referral_earnings': self.referral_earnings,
            'referral_count': self.referral_count,
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

class PromoCode(Base):
    __tablename__ = 'promocodes'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_type = Column(String(20), nullable=False, default='percentage')
    discount_value = Column(Float, nullable=False)
    max_uses = Column(Integer, nullable=False)
    current_uses = Column(Integer, nullable=False, default=0)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(BigInteger, ForeignKey('user_profiles.userid'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    creator = relationship("UserProfile", foreign_keys=[created_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'discount_type': self.discount_type,
            'discount_value': self.discount_value,
            'max_uses': self.max_uses,
            'current_uses': self.current_uses,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_active': self.is_active,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class PromoCodeUsage(Base):
    __tablename__ = 'promocode_usages'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    promocode_id = Column(Integer, ForeignKey('promocodes.id'), nullable=False)
    userid = Column(BigInteger, ForeignKey('user_profiles.userid'), nullable=False)
    trade_id = Column(String(50), ForeignKey('trades.trade_id'), nullable=True)
    used_at = Column(DateTime(timezone=True), server_default=func.now())
    
    promocode = relationship("PromoCode")
    user = relationship("UserProfile")
    trade = relationship("Trade")
    
    def to_dict(self):
        return {
            'id': self.id,
            'promocode_id': self.promocode_id,
            'userid': self.userid,
            'trade_id': self.trade_id,
            'used_at': self.used_at.isoformat() if self.used_at else None
        }
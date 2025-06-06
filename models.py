from sqlalchemy import Column, Integer, String, LargeBinary, DateTime, Text, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

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
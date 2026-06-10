from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, Text
from sqlalchemy.sql import func
from backend.database import Base
import enum


class CarStatus(enum.Enum):
    AVAILABLE = "available"
    RENTED = "rented"
    MAINTENANCE = "maintenance"


class Car(Base):
    __tablename__ = "cars"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    brand = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer)
    seats = Column(Integer, nullable=False)
    transmission = Column(String(20))  # Automatic, Manual
    fuel_type = Column(String(20))  # Petrol, Diesel, Electric, Hybrid
    rent_price_per_day = Column(Float, nullable=False)
    status = Column(Enum(CarStatus), default=CarStatus.AVAILABLE, nullable=False)
    image_urls = Column(Text)  # JSON array of image URLs
    discount_percentage = Column(Integer, default=0)  # Discount percentage (0-100)
    is_promoted = Column(Boolean, default=False)  # Promotion flag for home page
    description = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Car(id={self.id}, name='{self.name}', status='{self.status.value}')>"

from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from typing import Optional, List, Union
from backend.models.user import UserRole
from backend.models.car import CarStatus
from backend.models.rental import RentalStatus
from backend.models.transaction import PaymentStatus, PaymentMethod


# User Schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Car Schemas
class CarBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    brand: str = Field(..., min_length=1, max_length=50)
    model: str = Field(..., min_length=1, max_length=50)
    year: Optional[int] = Field(None, ge=1900, le=2100)
    seats: int = Field(..., ge=1, le=20)
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    rent_price_per_day: float = Field(..., gt=0)
    image_urls: Optional[List[str]] = None
    discount_percentage: int = Field(0, ge=0, le=100)
    is_promoted: bool = False
    description: Optional[str] = None


class CarCreate(CarBase):
    pass


class CarUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    seats: Optional[int] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    rent_price_per_day: Optional[float] = None
    status: Optional[CarStatus] = None
    image_urls: Optional[List[str]] = None
    discount_percentage: Optional[int] = Field(None, ge=0, le=100)
    is_promoted: Optional[bool] = None
    description: Optional[str] = None


class CarResponse(CarBase):
    id: int
    status: CarStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @validator('image_urls', pre=True, always=True)
    def parse_image_urls(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except:
                return []
        return v
    
    class Config:
        from_attributes = True


# Rental Schemas
class RentalBase(BaseModel):
    car_id: int
    start_date: datetime
    end_date: Optional[datetime] = None
    notes: Optional[str] = None


class RentalCreate(RentalBase):
    pass


class RentalUpdate(BaseModel):
    status: Optional[RentalStatus] = None
    end_date: Optional[datetime] = None
    actual_return_date: Optional[datetime] = None
    total_cost: Optional[float] = None
    notes: Optional[str] = None


class RentalResponse(RentalBase):
    id: int
    user_id: int
    status: RentalStatus
    actual_return_date: Optional[datetime] = None
    total_cost: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Transaction Schemas
class TransactionBase(BaseModel):
    rental_id: int
    amount: float = Field(..., gt=0)
    payment_method: PaymentMethod
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    payment_status: Optional[PaymentStatus] = None
    notes: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    transaction_id: str
    payment_status: PaymentStatus
    payment_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

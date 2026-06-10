from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from math import ceil
from backend.database import get_db
from backend.models.rental import Rental, RentalStatus
from backend.models.car import Car, CarStatus
from backend.models.user import User
from backend.models.transaction import Transaction, PaymentStatus, PaymentMethod
from backend.schemas import RentalCreate, RentalUpdate, RentalResponse, TransactionCreate, TransactionResponse
from backend.auth.security import get_current_active_user, get_current_admin_user
import uuid

router = APIRouter(prefix="/api/rentals", tags=["Rentals"])


@router.get("/", response_model=List[RentalResponse])
def get_rentals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[RentalStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all rentals (filtered by user for regular users, all for admins)."""
    query = db.query(Rental)
    
    # Regular users can only see their own rentals
    if current_user.role.value != "admin":
        query = query.filter(Rental.user_id == current_user.id)
    
    if status:
        query = query.filter(Rental.status == status)
    
    rentals = query.offset(skip).limit(limit).all()
    return rentals


@router.get("/{rental_id}", response_model=RentalResponse)
def get_rental(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific rental by ID."""
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Regular users can only see their own rentals
    if current_user.role.value != "admin" and rental.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this rental"
        )
    
    return rental


@router.post("/", response_model=RentalResponse, status_code=status.HTTP_201_CREATED)
def create_rental(
    rental: RentalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new rental request."""
    # Validate dates
    now = datetime.utcnow()
    if rental.start_date < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be from present date or future"
        )
    
    if rental.end_date and rental.end_date <= rental.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    # Check if car exists and is available
    car = db.query(Car).filter(Car.id == rental.car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    if car.status != CarStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Car is not available for rental"
        )
    
    # Create rental
    new_rental = Rental(
        user_id=current_user.id,
        car_id=rental.car_id,
        start_date=rental.start_date,
        end_date=rental.end_date,
        status=RentalStatus.ACTIVE,
        notes=rental.notes
    )
    
    # Update car status
    car.status = CarStatus.RENTED
    
    db.add(new_rental)
    db.commit()
    db.refresh(new_rental)
    
    return new_rental


@router.put("/{rental_id}", response_model=RentalResponse)
def update_rental(
    rental_id: int,
    rental_update: RentalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a rental."""
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Regular users can only update their own rentals
    if current_user.role.value != "admin" and rental.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this rental"
        )
    
    update_data = rental_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rental, field, value)
    
    # If rental is being completed or cancelled, update car status
    if rental_update.status in [RentalStatus.COMPLETED, RentalStatus.CANCELLED]:
        car = db.query(Car).filter(Car.id == rental.car_id).first()
        if car:
            car.status = CarStatus.AVAILABLE
    
    db.commit()
    db.refresh(rental)
    return rental


@router.post("/{rental_id}/return", response_model=RentalResponse)
def return_car(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Return a rented car."""
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Regular users can only return their own rentals
    if current_user.role.value != "admin" and rental.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to return this rental"
        )
    
    if rental.status != RentalStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rental is not active"
        )
    
    # Update rental status and return date
    rental.status = RentalStatus.COMPLETED
    rental.actual_return_date = datetime.utcnow()
    
    # Calculate total cost using ceil division (less than 24 hours = 1 day, 25 hours = 2 days)
    car = db.query(Car).filter(Car.id == rental.car_id).first()
    if car and rental.start_date:
        hours_diff = (rental.actual_return_date - rental.start_date).total_seconds() / 3600
        days = ceil(hours_diff / 24)
        rental.total_cost = days * car.rent_price_per_day
    
    # Update car status
    if car:
        car.status = CarStatus.AVAILABLE
    
    db.commit()
    db.refresh(rental)
    return rental


@router.post("/{rental_id}/payment", response_model=TransactionResponse)
def create_payment(
    rental_id: int,
    payment: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a payment for a rental."""
    rental = db.query(Rental).filter(Rental.id == rental_id).first()
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Regular users can only pay for their own rentals
    if current_user.role.value != "admin" and rental.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to pay for this rental"
        )
    
    # Generate unique transaction ID
    transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    
    # Create transaction
    new_transaction = Transaction(
        rental_id=rental_id,
        user_id=current_user.id,
        transaction_id=transaction_id,
        amount=payment.amount,
        payment_status=PaymentStatus.COMPLETED,
        payment_method=payment.payment_method,
        notes=payment.notes
    )
    
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    
    return new_transaction

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
import uuid
from pathlib import Path
from backend.database import get_db
from backend.models.car import Car, CarStatus
from backend.models.user import User
from backend.schemas import CarCreate, CarUpdate, CarResponse
from backend.auth.security import get_current_active_user, get_current_admin_user

router = APIRouter(prefix="/api/cars", tags=["Cars"])


@router.get("/", response_model=List[CarResponse])
def get_cars(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[CarStatus] = None,
    db: Session = Depends(get_db)
):
    """Get all cars with optional filtering by status."""
    query = db.query(Car)
    
    if status:
        query = query.filter(Car.status == status)
    
    cars = query.offset(skip).limit(limit).all()
    return cars


@router.get("/{car_id}", response_model=CarResponse)
def get_car(car_id: int, db: Session = Depends(get_db)):
    """Get a specific car by ID."""
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    return car


@router.post("/", response_model=CarResponse, status_code=status.HTTP_201_CREATED)
def create_car(
    car: CarCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new car (Admin only)."""
    car_data = car.dict()
    
    # Handle image_urls - convert list to JSON string
    if 'image_urls' in car_data and car_data['image_urls'] is not None:
        car_data['image_urls'] = json.dumps(car_data['image_urls'])
    
    new_car = Car(**car_data)
    db.add(new_car)
    db.commit()
    db.refresh(new_car)
    return new_car


@router.put("/{car_id}", response_model=CarResponse)
def update_car(
    car_id: int,
    car_update: CarUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a car (Admin only)."""
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    update_data = car_update.dict(exclude_unset=True)
    
    # Handle image_urls - convert list to JSON string
    if 'image_urls' in update_data and update_data['image_urls'] is not None:
        update_data['image_urls'] = json.dumps(update_data['image_urls'])
    
    for field, value in update_data.items():
        setattr(car, field, value)
    
    db.commit()
    db.refresh(car)
    return car


@router.delete("/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_car(
    car_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a car (Admin only)."""
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    db.delete(car)
    db.commit()


@router.post("/{car_id}/upload-images", response_model=CarResponse)
async def upload_car_images(
    car_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Upload images for a car (Admin only)."""
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("frontend/uploads/car_images")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Get existing images
    existing_images = []
    if car.image_urls:
        try:
            existing_images = json.loads(car.image_urls)
        except:
            existing_images = []
    
    # Upload new images
    new_image_urls = []
    for file in files:
        # Generate unique filename
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Add URL
        new_image_urls.append(f"/uploads/car_images/{unique_filename}")
    
    # Combine existing and new images
    all_images = existing_images + new_image_urls
    car.image_urls = json.dumps(all_images)
    
    db.commit()
    db.refresh(car)
    return car


@router.delete("/{car_id}/images/{image_index}", response_model=CarResponse)
def delete_car_image(
    car_id: int,
    image_index: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a specific image from a car (Admin only)."""
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )
    
    if not car.image_urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No images to delete"
        )
    
    try:
        images = json.loads(car.image_urls)
        if image_index < 0 or image_index >= len(images):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image index"
            )
        
        # Delete the image file
        image_path = Path("frontend") / images[image_index].lstrip("/")
        if image_path.exists():
            image_path.unlink()
        
        # Remove from list
        images.pop(image_index)
        car.image_urls = json.dumps(images) if images else None
        
        db.commit()
        db.refresh(car)
        return car
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image data"
        )

"""
Seed script to populate the database with sample data.
This includes cars from the original app and sample users.
"""
from sqlalchemy.orm import Session
from backend.database import engine, SessionLocal, Base
from backend.models.user import User, UserRole
from backend.models.car import Car, CarStatus
import bcrypt


def seed_database():
    """Seed the database with initial data."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(User).count() > 0:
            print("Database already seeded. Skipping...")
            return
        
        print("Seeding database...")
        
        # Create admin users (from original app: BOB, TRUDY, ALICE)
        admin_users = [
            {
                "username": "BOB",
                "email": "bob@dealership.com",
                "full_name": "Bob Admin",
                "password": "admin123",
                "role": UserRole.ADMIN
            },
            {
                "username": "TRUDY",
                "email": "trudy@dealership.com",
                "full_name": "Trudy Admin",
                "password": "admin123",
                "role": UserRole.ADMIN
            },
            {
                "username": "ALICE",
                "email": "alice@dealership.com",
                "full_name": "Alice Admin",
                "password": "admin123",
                "role": UserRole.ADMIN
            }
        ]
        
        for user_data in admin_users:
            password_bytes = user_data["password"].encode('utf-8')
            hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=hashed_password,
                role=user_data["role"]
            )
            db.add(user)
        
        print("Created admin users")
        
        # Create sample regular users (from original app: A, B, C, D, E, F)
        regular_users = [
            {
                "username": "user_a",
                "email": "usera@example.com",
                "full_name": "User A",
                "password": "user123"
            },
            {
                "username": "user_b",
                "email": "userb@example.com",
                "full_name": "User B",
                "password": "user123"
            },
            {
                "username": "user_c",
                "email": "userc@example.com",
                "full_name": "User C",
                "password": "user123"
            }
        ]
        
        for user_data in regular_users:
            password_bytes = user_data["password"].encode('utf-8')
            hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=hashed_password,
                role=UserRole.USER
            )
            db.add(user)
        
        print("Created regular users")
        
        # Create cars from original app (car_info.txt data)
        # Format: Name Seats Price Frequency
        # Converting to professional format with realistic car data
        cars_data = [
            {
                "name": "Toyota Corolla",
                "brand": "Toyota",
                "model": "Corolla",
                "year": 2022,
                "seats": 4,
                "transmission": "Automatic",
                "fuel_type": "Petrol",
                "rent_price_per_day": 80.0,
                "status": CarStatus.AVAILABLE,
                "description": "Reliable and fuel-efficient sedan, perfect for city driving."
            },
            {
                "name": "Toyota Hiace",
                "brand": "Toyota",
                "model": "Hiace",
                "year": 2021,
                "seats": 8,
                "transmission": "Manual",
                "fuel_type": "Diesel",
                "rent_price_per_day": 100.0,
                "status": CarStatus.AVAILABLE,
                "description": "Spacious van ideal for group travel and cargo."
            },
            {
                "name": "Nissan Civilian Bus",
                "brand": "Nissan",
                "model": "Civilian",
                "year": 2020,
                "seats": 12,
                "transmission": "Automatic",
                "fuel_type": "Diesel",
                "rent_price_per_day": 120.0,
                "status": CarStatus.AVAILABLE,
                "description": "Large bus for group transportation and events."
            },
            {
                "name": "Toyota Noah",
                "brand": "Toyota",
                "model": "Noah",
                "year": 2022,
                "seats": 6,
                "transmission": "Automatic",
                "fuel_type": "Petrol",
                "rent_price_per_day": 85.0,
                "status": CarStatus.AVAILABLE,
                "description": "Comfortable MPV with flexible seating arrangements."
            },
            {
                "name": "Toyota Premio",
                "brand": "Toyota",
                "model": "Premio",
                "year": 2023,
                "seats": 4,
                "transmission": "Automatic",
                "fuel_type": "Petrol",
                "rent_price_per_day": 80.0,
                "status": CarStatus.AVAILABLE,
                "description": "Elegant sedan with premium features and comfort."
            },
            {
                "name": "Toyota Allion",
                "brand": "Toyota",
                "model": "Allion",
                "year": 2022,
                "seats": 4,
                "transmission": "Automatic",
                "fuel_type": "Petrol",
                "rent_price_per_day": 80.0,
                "status": CarStatus.AVAILABLE,
                "description": "Stylish compact sedan with excellent fuel economy."
            },
            {
                "name": "Toyota Prado",
                "brand": "Toyota",
                "model": "Prado",
                "year": 2023,
                "seats": 4,
                "transmission": "Automatic",
                "fuel_type": "Diesel",
                "rent_price_per_day": 80.0,
                "status": CarStatus.AVAILABLE,
                "description": "Luxury SUV with off-road capabilities."
            },
            {
                "name": "Ambulance",
                "brand": "Various",
                "model": "Ambulance",
                "year": 2021,
                "seats": 2,
                "transmission": "Automatic",
                "fuel_type": "Diesel",
                "rent_price_per_day": 20.0,
                "status": CarStatus.AVAILABLE,
                "description": "Emergency vehicle for medical transport services."
            },
            {
                "name": "Commercial Truck",
                "brand": "Various",
                "model": "Truck",
                "year": 2020,
                "seats": 4,
                "transmission": "Manual",
                "fuel_type": "Diesel",
                "rent_price_per_day": 30.0,
                "status": CarStatus.AVAILABLE,
                "description": "Heavy-duty truck for cargo transportation."
            }
        ]
        
        for car_data in cars_data:
            car = Car(**car_data)
            db.add(car)
        
        print("Created cars")
        
        db.commit()
        print("Database seeded successfully!")
        print("\nDefault Admin Credentials:")
        print("Username: BOB")
        print("Password: admin123")
        print("\nDefault User Credentials:")
        print("Username: user_a")
        print("Password: user123")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

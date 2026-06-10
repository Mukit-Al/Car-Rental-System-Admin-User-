# Professional Car Dealership System

A modern, production-ready car rental and dealership management system built with FastAPI, SQLAlchemy, and a responsive web-based GUI.

## Features

### 🔐 Authentication & Security
- JWT-based authentication with secure token handling
- Password hashing using bcrypt
- Role-based access control (Admin/User)
- Secure session management

### 🚗 Car Management
- Full CRUD operations for vehicles
- Detailed car information (brand, model, year, seats, transmission, fuel type)
- Real-time availability status tracking
- Multiple image support for car listings
- Flexible pricing per day
- **Discount percentage** - Set promotional discounts (0-100%)
- **Featured promotion** - Mark cars as featured for homepage display
- **Professional car detail view** - Large images with zoom and navigation arrows

### 👥 User Management
- User registration and authentication
- Profile management
- Role-based permissions
- Admin can view and manage all users

### 📋 Rental System
- Create and manage rental requests
- Track rental status (Active, Completed, Cancelled)
- Car return processing with automatic cost calculation
- Rental history tracking

### 💳 Payment Processing
- Transaction management
- Multiple payment methods (Cash, Credit Card, Debit Card, Bank Transfer)
- Payment status tracking
- Unique transaction IDs

### 🎨 Modern GUI
- Responsive web-based interface
- Real-time data updates
- Intuitive dashboard for both admins and users
- Mobile-friendly design
- Professional UI/UX with futuristic design effects
- **Sorting options** - Featured, Price Low/High, Newest
- **Smart filtering** - Users only see available cars
- **Interactive car cards** - Hover effects and smooth animations
- **Professional car detail modal** - Image zoom, navigation, and detailed specs

## Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **SQLAlchemy** - SQL toolkit and ORM
- **SQLite** - Lightweight database (easily upgradeable to PostgreSQL/MySQL)
- **Pydantic** - Data validation using Python type annotations
- **python-jose** - JWT token handling
- **passlib** - Password hashing with bcrypt

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients and animations
- **JavaScript (ES6+)** - Client-side logic and API interactions

## Project Structure

```
professional_car_dealership/
├── backend/
│   ├── auth/
│   │   ├── __init__.py
│   │   └── security.py          # JWT and password hashing
│   ├── models/
│   │   ├── __init__.py
│   │   ├── car.py               # Car model
│   │   ├── rental.py            # Rental model
│   │   ├── transaction.py       # Transaction model
│   │   └── user.py              # User model
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py              # Authentication endpoints
│   │   ├── cars.py              # Car management endpoints
│   │   ├── rentals.py           # Rental management endpoints
│   │   └── users.py             # User management endpoints
│   ├── database.py              # Database configuration
│   ├── main.py                  # FastAPI application entry point
│   ├── schemas.py               # Pydantic schemas
│   └── seed.py                  # Database seeding script
├── frontend/
│   ├── index.html               # Main HTML file
│   ├── styles.css               # Styling
│   └── app.js                   # Frontend JavaScript
├── requirements.txt             # Python dependencies
└── README.md                    # This file
```

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup Instructions

1. **Navigate to the project directory**
   ```bash
   cd "/Users/mukit/Downloads/Car_Python app/professional_car_dealership"
   ```

2. **Create a virtual environment (recommended)**
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment**
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Seed the database with initial data**
   ```bash
   python -m backend.seed
   ```

   This will create:
   - 3 admin users (BOB, TRUDY, ALICE)
   - 3 regular users (user_a, user_b, user_c)
   - 9 sample cars from the original application

   **Default Credentials:**
   - Admin: Username `BOB`, Password `admin123`
   - User: Username `user_a`, Password `user123`

## Running the Application

### Start the Server

```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The application will be available at:
- **Web Interface:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Alternative API Docs:** http://localhost:8000/redoc

### Using the Application

1. **Open your browser** and navigate to http://localhost:8000

2. **Register a new account** or login with default credentials

3. **For Admins:**
   - Access the Admin Dashboard
   - Manage cars (add, edit, delete)
   - View all users
   - Monitor all rentals

4. **For Users:**
   - Browse available cars
   - Rent cars
   - View rental history
   - Return rented cars

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Cars
- `GET /api/cars/` - List all cars (with optional status filter)
- `GET /api/cars/{car_id}` - Get specific car
- `POST /api/cars/` - Create new car (Admin only)
- `PUT /api/cars/{car_id}` - Update car (Admin only)
- `DELETE /api/cars/{car_id}` - Delete car (Admin only)

### Rentals
- `GET /api/rentals/` - List rentals (filtered by user for regular users)
- `GET /api/rentals/{rental_id}` - Get specific rental
- `POST /api/rentals/` - Create new rental
- `PUT /api/rentals/{rental_id}` - Update rental
- `POST /api/rentals/{rental_id}/return` - Return a rented car
- `POST /api/rentals/{rental_id}/payment` - Create payment for rental

### Users
- `GET /api/users/` - List all users (Admin only)
- `GET /api/users/{user_id}` - Get specific user
- `DELETE /api/users/{user_id}` - Delete user (Admin only)

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `hashed_password` - Bcrypt hashed password
- `full_name` - User's full name
- `role` - User role (admin/user)
- `is_active` - Account status
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Cars Table
- `id` - Primary key
- `name` - Car name
- `brand` - Car brand
- `model` - Car model
- `year` - Manufacturing year
- `seats` - Number of seats
- `transmission` - Transmission type
- `fuel_type` - Fuel type
- `rent_price_per_day` - Daily rental price
- `status` - Availability status
- `image_url` - Car image URL
- `description` - Car description
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Rentals Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `car_id` - Foreign key to cars
- `status` - Rental status
- `start_date` - Rental start date
- `end_date` - Planned end date
- `actual_return_date` - Actual return date
- `total_cost` - Total rental cost
- `notes` - Additional notes
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Transactions Table
- `id` - Primary key
- `rental_id` - Foreign key to rentals
- `user_id` - Foreign key to users
- `transaction_id` - Unique transaction ID
- `amount` - Payment amount
- `payment_status` - Payment status
- `payment_method` - Payment method
- `payment_date` - Payment date
- `notes` - Additional notes
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Security Features

- **Password Hashing:** All passwords are hashed using bcrypt before storage
- **JWT Authentication:** Secure token-based authentication
- **Role-Based Access Control:** Admin-only endpoints protected
- **SQL Injection Prevention:** SQLAlchemy ORM prevents SQL injection
- **CORS Configuration:** Configurable CORS for API access
- **Input Validation:** Pydantic schemas validate all input data

## Improvements Over Original Code

### What Was Kept
- Core concept: Car rental system
- User roles: Admin and regular users
- Basic functionality: Car browsing, renting, user management
- Data structure: Cars, users, rentals

### What Was Improved
1. **Security:** Replaced plain-text passwords with bcrypt hashing
2. **Database:** Replaced text files with SQLite database
3. **Authentication:** Added JWT-based authentication
4. **GUI:** Replaced console interface with modern web GUI
5. **Code Quality:** Professional code structure with proper separation of concerns
6. **Error Handling:** Comprehensive error handling and validation
7. **Scalability:** RESTful API design for easy scaling
8. **Documentation:** API documentation with Swagger/OpenAPI
9. **Data Integrity:** Foreign key constraints and proper relationships
10. **User Experience:** Modern, responsive interface with real-time updates

## Development

### Adding New Features

1. **Add new models:** Create in `backend/models/`
2. **Add new endpoints:** Create in `backend/routers/`
3. **Update frontend:** Modify `frontend/` files
4. **Update database:** Modify models and run seed script

### Testing the API

Use the built-in Swagger UI at http://localhost:8000/docs to test all endpoints interactively.

## Production Deployment

For production deployment:

1. **Change the secret key** in `backend/auth/security.py`
2. **Use a production database** (PostgreSQL/MySQL instead of SQLite)
3. **Enable HTTPS** for secure connections
4. **Set up proper CORS** configuration
5. **Add rate limiting** for API endpoints
6. **Implement logging** and monitoring
7. **Use environment variables** for sensitive configuration

## License

This project is for educational and demonstration purposes.

## Support

For issues or questions, please refer to the API documentation at `/docs` endpoint.

from backend.routers.auth import router as auth_router
from backend.routers.cars import router as cars_router
from backend.routers.rentals import router as rentals_router
from backend.routers.users import router as users_router

__all__ = ["auth_router", "cars_router", "rentals_router", "users_router"]

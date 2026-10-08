from fastapi import APIRouter
from app.api.v1 import auth, users, departments, teams, categories, issues, notifications, ai, analytics, admin

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(departments.router)
api_router.include_router(teams.router)
api_router.include_router(categories.router)
api_router.include_router(issues.router)
api_router.include_router(notifications.router)
api_router.include_router(analytics.router)
api_router.include_router(admin.router)
api_router.include_router(ai.router, prefix="/ai", tags=["AI"])


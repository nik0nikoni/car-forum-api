from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_async_session

from app.routers import user_router, post_router, comment_router, page_router
app = FastAPI(debug=True)

# CORS для API запросов
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API роутеры
app.include_router(user_router.router)
app.include_router(post_router.router)
app.include_router(comment_router.router)

# Статические файлы
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Страницы (должны быть после API роутеров)
app.include_router(page_router.router)


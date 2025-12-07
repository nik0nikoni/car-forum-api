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

# Роутер для работы с комментариями (отдельные endpoints)
from fastapi import APIRouter, HTTPException, status
from app.schemas.comment import CommentRead
from app.services.comment_service import delete_comment, get_comment_by_id
from app.models.user import User
from app.dependencies import get_current_user

comments_router = APIRouter(prefix="/comments", tags=["comments"])

@comments_router.delete('/{comment_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    try:
        deleted = await delete_comment(session, comment_id, current_user.id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

app.include_router(comments_router)
app.include_router(comment_router.router)

# Статические файлы
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Страницы (должны быть после API роутеров)
app.include_router(page_router.router)


from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.post import PostCreate, PostUpdate, PostRead, PostListItem
from app.services.post_service import create_post, get_posts, get_post_by_id, update_post, delete_post
from app.dependencies import get_async_session, get_current_user
from app.models.user import User

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post('/', response_model=PostRead, status_code=status.HTTP_201_CREATED)
async def create_new_post(
    payload: PostCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    post = await create_post(session, current_user.id, payload.title, payload.content)
    return post


@router.get('/', response_model=list[PostListItem])
async def get_all_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_async_session)
):
    posts = await get_posts(session, skip, limit)
    return posts


@router.get('/{post_id}', response_model=PostRead)
async def get_post(
    post_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    post = await get_post_by_id(session, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post


@router.put('/{post_id}', response_model=PostRead)
async def update_existing_post(
    post_id: int,
    payload: PostUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    try:
        post = await update_post(session, post_id, current_user.id, payload.title, payload.content)
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        return post
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete('/{post_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    try:
        deleted = await delete_post(session, post_id, current_user.id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

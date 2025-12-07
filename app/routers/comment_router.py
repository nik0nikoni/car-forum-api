from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.comment import CommentCreate, CommentRead
from app.services.comment_service import create_comment, get_comments_by_post, delete_comment
from app.dependencies import get_async_session, get_current_user
from app.models.user import User

router = APIRouter(prefix="/posts", tags=["comments"])


@router.post('/{post_id}/comments', response_model=CommentRead, status_code=status.HTTP_201_CREATED)
async def create_new_comment(
    post_id: int,
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    comment = await create_comment(session, current_user.id, post_id, payload.content)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return comment


@router.get('/{post_id}/comments', response_model=list[CommentRead])
async def get_post_comments(
    post_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    comments = await get_comments_by_post(session, post_id)
    return comments


@router.delete('/comments/{comment_id}', status_code=status.HTTP_204_NO_CONTENT)
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

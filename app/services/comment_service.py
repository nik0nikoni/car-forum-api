from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.comment import Comment
from app.models.post import Post


async def create_comment(session: AsyncSession, user_id: int, post_id: int, content: str) -> Comment | None:
    # Проверяем, существует ли пост
    result = await session.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    
    if not post:
        return None
    
    comment = Comment(content=content, post_id=post_id, author_id=user_id)
    session.add(comment)
    await session.commit()
    await session.refresh(comment, attribute_names=['author'])
    return comment


async def get_comment_by_id(session: AsyncSession, comment_id: int) -> Comment | None:
    result = await session.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.id == comment_id)
    )
    return result.scalar_one_or_none()


async def get_comments_by_post(session: AsyncSession, post_id: int) -> list[Comment]:
    result = await session.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
    )
    return list(result.scalars().all())


async def delete_comment(session: AsyncSession, comment_id: int, user_id: int) -> bool:
    result = await session.execute(
        select(Comment).where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    
    if not comment:
        return False
    
    if comment.author_id != user_id:
        raise PermissionError("You can only delete your own comments")
    
    await session.delete(comment)
    await session.commit()
    return True

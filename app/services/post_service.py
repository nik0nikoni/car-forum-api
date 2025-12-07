from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.post import Post
from app.models.user import User


async def create_post(session: AsyncSession, user_id: int, title: str, content: str) -> Post:
    post = Post(title=title, content=content, author_id=user_id)
    session.add(post)
    await session.commit()
    await session.refresh(post, attribute_names=['author'])
    return post


async def get_posts(session: AsyncSession, skip: int = 0, limit: int = 20) -> list[Post]:
    result = await session.execute(
        select(Post)
        .options(selectinload(Post.author))
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_post_by_id(session: AsyncSession, post_id: int) -> Post | None:
    result = await session.execute(
        select(Post)
        .options(selectinload(Post.author))
        .where(Post.id == post_id)
    )
    return result.scalar_one_or_none()


async def get_posts_by_author(session: AsyncSession, author_id: int, limit: int = 50) -> list[Post]:
    result = await session.execute(
        select(Post)
        .options(selectinload(Post.author))
        .where(Post.author_id == author_id)
        .order_by(Post.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def update_post(session: AsyncSession, post_id: int, user_id: int, title: str | None = None, content: str | None = None) -> Post | None:
    post = await get_post_by_id(session, post_id)
    
    if not post:
        return None
    
    if post.author_id != user_id:
        raise PermissionError("You can only edit your own posts")
    
    if title is not None:
        post.title = title
    if content is not None:
        post.content = content
    
    await session.commit()
    await session.refresh(post, attribute_names=['author'])
    return post


async def delete_post(session: AsyncSession, post_id: int, user_id: int) -> bool:
    post = await get_post_by_id(session, post_id)
    
    if not post:
        return False
    
    if post.author_id != user_id:
        raise PermissionError("You can only delete your own posts")
    
    await session.delete(post)
    await session.commit()
    return True

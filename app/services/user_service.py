from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.security import hash_password


async def create_user(session: AsyncSession, username: str, email: str, password: str) -> User:
    clean_username = username.strip()
    clean_email = email.strip()
    lookup_username = clean_username.lower()
    lookup_email = clean_email.lower()

    stmt = select(User).where(
        or_(
            func.lower(User.username) == lookup_username,
            func.lower(User.email) == lookup_email,
        )
    )
    existing = await session.execute(stmt)
    if existing.scalar_one_or_none():
        raise ValueError("User with this username or email already exists")

    user = User(
        username=clean_username,
        email=clean_email,
        password_hash=hash_password(password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def get_user_by_username(session: AsyncSession, username: str) -> User | None:
    normalized = username.strip().lower()
    stmt = select(User).where(func.lower(User.username) == normalized)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_login(session: AsyncSession, login: str) -> User | None:
    identifier = login.strip().lower()
    stmt = select(User).where(
        or_(
            func.lower(User.username) == identifier,
            func.lower(User.email) == identifier,
        )
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def update_user(
    session: AsyncSession,
    user: User,
    *,
    username: str | None = None,
    email: str | None = None,
    password: str | None = None,
) -> User:
    new_username = username.strip() if username else None
    new_email = email.strip() if email else None

    # Проверяем уникальность имени/email, если обновляются
    if new_username or new_email:
        conditions = []
        if new_username:
            conditions.append(func.lower(User.username) == new_username.lower())
        if new_email:
            conditions.append(func.lower(User.email) == new_email.lower())
        if conditions:
            stmt = select(User).where(or_(*conditions))
            existing = await session.execute(stmt)
            candidate = existing.scalar_one_or_none()
            if candidate and candidate.id != user.id:
                raise ValueError("User with this username or email already exists")

    if new_username:
        user.username = new_username
    if new_email:
        user.email = new_email
    if password:
        user.password_hash = hash_password(password)

    await session.commit()
    await session.refresh(user)
    return user

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.user import UserCreate, UserRead, UserLogin, Token, UserProfile, UserUpdate
from app.schemas.post import PostListItem
from app.services.user_service import create_user, get_user_by_login, get_user_by_id, update_user
from app.services.post_service import get_posts_by_author
from app.services.security import verify_password, create_access_token
from app.dependencies import get_async_session, get_current_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


@router.post('/register', response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserCreate, session: AsyncSession = Depends(get_async_session)):
    try:
        user = await create_user(session, payload.username, payload.email, payload.password)
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post('/login', response_model=Token)
async def login(payload: UserLogin, session: AsyncSession = Depends(get_async_session)):
    login_identifier = payload.username.strip()
    if not login_identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is required"
        )

    user = await get_user_by_login(session, login_identifier)
    
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get('/me', response_model=UserRead)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.get('/me/profile', response_model=UserProfile)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    posts = await get_posts_by_author(session, current_user.id)
    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        posts=[PostListItem.model_validate(post) for post in posts],
        posts_count=len(posts),
    )


@router.put('/me', response_model=UserRead)
async def update_my_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    if not any([payload.username, payload.email, payload.password]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nothing to update"
        )
    try:
        updated = await update_user(
            session,
            current_user,
            username=payload.username,
            email=payload.email,
            password=payload.password,
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

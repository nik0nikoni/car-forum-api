from pydantic import BaseModel, EmailStr, Field
from app.schemas.post import PostListItem


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    username: str
    password: str


class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class UserUpdate(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=50)
    email: EmailStr | None = Field(None, max_length=255)
    password: str | None = Field(None, min_length=6, max_length=128)


class UserProfile(BaseModel):
    id: int
    username: str
    email: EmailStr
    posts: list[PostListItem]
    posts_count: int

    class Config:
        from_attributes = True

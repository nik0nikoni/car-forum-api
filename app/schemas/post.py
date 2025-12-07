from datetime import datetime
from pydantic import BaseModel, Field


class PostCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=10)


class PostUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=200)
    content: str | None = Field(None, min_length=10)


class PostAuthor(BaseModel):
    id: int
    username: str
    
    class Config:
        from_attributes = True


class PostRead(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    author: PostAuthor
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PostListItem(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    author: PostAuthor
    created_at: datetime
    
    class Config:
        from_attributes = True

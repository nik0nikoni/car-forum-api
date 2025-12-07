from datetime import datetime
from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    content: str = Field(min_length=10)


class CommentAuthor(BaseModel):
    id: int
    username: str
    
    class Config:
        from_attributes = True


class CommentRead(BaseModel):
    id: int
    content: str
    post_id: int
    author_id: int
    author: CommentAuthor
    created_at: datetime
    
    class Config:
        from_attributes = True

from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

router = APIRouter(tags=["pages"])
templates = Jinja2Templates(directory="app/templates")


@router.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@router.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/register")
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})


@router.get("/post/{post_id}")
async def post_page(request: Request, post_id: int):
    return templates.TemplateResponse("post.html", {"request": request})


@router.get("/create-post")
async def create_post_page(request: Request):
    return templates.TemplateResponse("create_post.html", {"request": request})


@router.get("/edit-post/{post_id}")
async def edit_post_page(request: Request, post_id: int):
    return templates.TemplateResponse("edit_post.html", {"request": request})


@router.get("/profile")
async def profile_page(request: Request):
    return templates.TemplateResponse("profile.html", {"request": request})

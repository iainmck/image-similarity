from fastapi import FastAPI
from contextlib import asynccontextmanager

from utils.cors import allow_CORS
from utils.httpx import httpx_client
from providers.supabase import get_supabase

from endpoints import main

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Do stuff before startup
    await get_supabase()
    
    # Let application run
    yield

    # Do stuff after shutdown
    print('Shut down server - doing cleanup')
    await httpx_client.aclose()

def create_app():
    app = FastAPI(lifespan=lifespan)
    allow_CORS(app)

    app.include_router(main.router, prefix="/main")

    @app.get('/health', status_code=200)
    async def health_check():
        return {"status": 'healthy!'}

    return app

# terminal: uvicorn --port 5000 main:app --reload
app = create_app()

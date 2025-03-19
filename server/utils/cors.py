from fastapi import Request, Response, FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from starlette.middleware.base import BaseHTTPMiddleware
import traceback

def allow_CORS(app: FastAPI):
    app.add_middleware(ExceptionMiddleware)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=
            'http:\/\/localhost:3000'
            + '|' + 'https:\/\/localhost:3000'
            + '|' + 'https:\/\/10\.0\.0\..*:3000',
        allow_methods=['GET', 'POST'], 
        allow_headers=['*'],
    )

# APPLY THIS BEFORE CORSMiddleware so that 500 errors don't get logged as CORS issue in browser
class ExceptionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as e:
            logging.error(e)
            traceback.print_exc()
            return Response("Internal Server Error", status_code=500)

import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.router import api_router
from app.core.notifications_manager import manager, get_unread_count

uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(uploads_dir, exist_ok=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.websocket("/ws/notifications/{user_id}")
async def ws_notifications(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        db = SessionLocal()
        try:
            unread = get_unread_count(db, user_id)
            hello_payload = {
                "type": "hello",
                "user_id": user_id,
                "unread_count": int(unread),
                "connected": True,
            }
            await websocket.send_text(json.dumps(hello_payload, default=str))
        finally:
            db.close()

        while True:
            try:
                data = await websocket.receive_text()
                if not data:
                    continue
                try:
                    msg = json.loads(data)
                    msg_type = msg.get("type") if isinstance(msg, dict) else None
                    if msg_type == "ping":
                        await websocket.send_text(json.dumps({"type": "pong"}, default=str))
                except Exception:
                    pass
            except WebSocketDisconnect:
                break
    except Exception:
        pass
    finally:
        manager.disconnect(user_id, websocket)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Welcome to NagarMitra API",
        "docs_url": "/docs",
        "version": "1.0.0",
        "status": "Operational",
    }

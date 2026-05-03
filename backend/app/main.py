import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app import auth
from app.config import ALLOWED_ORIGINS
from app.models import DiagnoseRequest, DiagnoseReport
from app.pipeline import run_diagnostic, stream_diagnostic
from app.storage import save_report, load_report, list_reports, delete_report

app = FastAPI(title="AEO Diagnostic", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=6, max_length=200)
    name: str = Field(..., min_length=1, max_length=120)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=1, max_length=200)


class AuthResponse(BaseModel):
    email: str
    name: str


@app.post("/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest) -> AuthResponse:
    try:
        user = await auth.register(req.email, req.password, req.name)
        return AuthResponse(**user)
    except auth.AuthError as exc:
        raise HTTPException(400, str(exc))


@app.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest) -> AuthResponse:
    try:
        user = await auth.login(req.email, req.password)
        return AuthResponse(**user)
    except auth.AuthError as exc:
        raise HTTPException(401, str(exc))


@app.get("/auth/exists")
async def email_exists(email: str) -> dict:
    return {"exists": await auth.email_exists(email)}


@app.post("/diagnose", response_model=DiagnoseReport)
async def diagnose(req: DiagnoseRequest) -> DiagnoseReport:
    return await run_diagnostic(req)


@app.post("/diagnose/stream")
async def diagnose_stream(req: DiagnoseRequest) -> StreamingResponse:
    async def gen():
        async for ev in stream_diagnostic(req):
            yield f"data: {json.dumps(ev)}\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/reports", response_model=list[dict])
async def reports(user_email: str | None = None, limit: int = 50) -> list[dict]:
    return await list_reports(user_email=user_email, limit=limit)


@app.get("/reports/{report_id}", response_model=DiagnoseReport)
async def get_report(report_id: str) -> DiagnoseReport:
    report = await load_report(report_id)
    if not report:
        raise HTTPException(404, "Report not found")
    return report


@app.delete("/reports/{report_id}")
async def delete_report_endpoint(report_id: str, user_email: str | None = None) -> dict:
    deleted = await delete_report(report_id, user_email)
    if not deleted:
        raise HTTPException(404, "Report not found or not owned by user")
    return {"deleted": True, "id": report_id}

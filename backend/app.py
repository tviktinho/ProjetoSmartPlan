from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, Date, Time, DateTime, ForeignKey, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import uuid
import re

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:admin@localhost/ufu_agenda")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class Discipline(Base):
    __tablename__ = "disciplines"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    code = Column(String(50))
    professor = Column(String(255))
    semester = Column(String(50))
    color = Column(String(7), default="#3B82F6")
    created_at = Column(DateTime, default=datetime.utcnow)

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    discipline_id = Column(Integer, ForeignKey("disciplines.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    event_type = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=False)
    start_time = Column(Time)
    end_time = Column(Time)
    location = Column(String(255))
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String(50))
    recurrence_days = Column(ARRAY(String))
    recurrence_end_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    discipline_id = Column(Integer, ForeignKey("disciplines.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    priority = Column(String(20), default="medium")
    status = Column(String(20), default="todo")
    due_date = Column(Date)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class StudyGoal(Base):
    __tablename__ = "study_goals"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    target_hours = Column(Integer, nullable=False)
    period_type = Column(String(20), nullable=False)
    current_hours = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def validate_ufu_email(email: str) -> bool:
    return email.lower().endswith("@ufu.br")

class UserSignup(BaseModel):
    email: str
    first_name: str
    last_name: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    profile_image_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class DisciplineCreate(BaseModel):
    name: str
    code: Optional[str] = None
    professor: Optional[str] = None
    semester: Optional[str] = None
    color: str = "#3B82F6"

class EventCreate(BaseModel):
    title: str
    event_type: str
    start_date: str
    description: Optional[str] = None
    discipline_id: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    recurrence_days: Optional[List[str]] = None
    recurrence_end_date: Optional[str] = None

class TaskCreate(BaseModel):
    title: str
    priority: str = "medium"
    status: str = "todo"
    description: Optional[str] = None
    discipline_id: Optional[int] = None
    due_date: Optional[str] = None

class StudyGoalCreate(BaseModel):
    title: str
    target_hours: int
    period_type: str
    current_hours: int = 0

app = FastAPI(title="Agenda UFU")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_user(request: Request) -> str:
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user.get("id")

@app.post("/api/auth/signup")
async def signup(data: UserSignup, db: Session = Depends(get_db)):
    if not validate_ufu_email(data.email):
        raise HTTPException(status_code=400, detail="Only @ufu.br email addresses are allowed")
    
    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        id=str(uuid.uuid4()),
        email=data.email.lower(),
        first_name=data.first_name,
        last_name=data.last_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.from_orm(user)

@app.post("/api/auth/login")
async def login(data: UserSignup, request: Request, db: Session = Depends(get_db)):
    if not validate_ufu_email(data.email):
        raise HTTPException(status_code=400, detail="Only @ufu.br email addresses are allowed")
    
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    request.session["user"] = {"id": user.id, "email": user.email}
    return UserResponse.from_orm(user)

@app.get("/api/auth/user")
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    try:
        uid = await get_user(request)
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return UserResponse.from_orm(user)
    except:
        raise HTTPException(status_code=401, detail="Unauthorized")

@app.post("/api/auth/logout")
async def logout(request: Request):
    request.session.clear()
    return {"success": True}

@app.get("/api/disciplines")
async def list_disciplines(uid: str = Depends(get_user), db: Session = Depends(get_db)):
    return db.query(Discipline).filter(Discipline.user_id == uid).all()

@app.post("/api/disciplines")
async def create_discipline(data: DisciplineCreate, uid: str = Depends(get_user), db: Session = Depends(get_db)):
    d = Discipline(user_id=uid, **data.dict())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d

@app.patch("/api/disciplines/{id}")
async def update_discipline(id: int, data: DisciplineCreate, uid: str = Depends(get_user), db: Session = Depends(get_db)):
    d = db.query(Discipline).filter(Discipline.id == id, Discipline.user_id == uid).first()
    if not d: raise HTTPException(status_code=404)
    for k, v in data.dict().items():
        setattr(d, k, v)
    db.commit()
    return d

@app.delete("/api/disciplines/{id}")
async def delete_discipline(id: int, uid: str = Depends(get_user), db: Session = Depends(get_db)):
    d = db.query(Discipline).filter(Discipline.id == id, Discipline.user_id == uid).first()
    if not d: raise HTTPException(status_code=404)
    db.delete(d)
    db.commit()
    return {"ok": True}

@app.get("/api/events")
async def list_events(uid: str = Depends(get_user), db: Session = Depends(get_db)):
    return db.query(Event).filter(Event.user_id == uid).all()

@app.post("/api/events")
async def create_event(data: EventCreate, uid: str = Depends(get_user), db: Session = Depends(get_db)):
    e = Event(user_id=uid, **data.dict())
    db.add(e)
    db.commit()
    return e

@app.patch("/api/events/{id}")
async def update_event(id: int, data: EventCreate, uid: str = Depends(get_user), db: Session = Depends(get_db)):
    e = db.query(Event).filter(Event.id == id, Event.user_id == uid).first()
    if not e: raise HTTPException(status_code=404)
    for k, v in data.dict().items():
        setattr(e, k, v)
    db.commit()
    return e

@app.delete("/api/events/{id}")
async def delete_event(id: int, uid: str = Depends(get_user), db: Session = Depends(get_db)):
    e = db.query(Event).filter(Event.id == id, Event.user_id == uid).first()
    if not e: raise HTTPException(status_code=404)
    db.delete(e)
    db.commit()
    return {"ok": True}

@app.get("/api/tasks")
async def list_tasks(uid: str = Depends(get_user), db: Session = Depends(get_db)):
    return db.query(Task).filter(Task.user_id == uid).all()

@app.post("/api/tasks")
async def create_task(data: TaskCreate, uid: str = Depends(get_user), db: Session = Depends(get_db)):
    t = Task(user_id=uid, **data.dict())
    db.add(t)
    db.commit()
    return t

@app.patch("/api/tasks/{id}")
async def update_task(id: int, data: TaskCreate, uid: str = Depends(get_user), db: Session = Depends(get_db)):
    t = db.query(Task).filter(Task.id == id, Task.user_id == uid).first()
    if not t: raise HTTPException(status_code=404)
    for k, v in data.dict().items():
        setattr(t, k, v)
    db.commit()
    return t

@app.delete("/api/tasks/{id}")
async def delete_task(id: int, uid: str = Depends(get_user), db: Session = Depends(get_db)):
    t = db.query(Task).filter(Task.id == id, Task.user_id == uid).first()
    if not t: raise HTTPException(status_code=404)
    db.delete(t)
    db.commit()
    return {"ok": True}

@app.get("/api/goals")
async def list_goals(uid: str = Depends(get_user), db: Session = Depends(get_db)):
    return db.query(StudyGoal).filter(StudyGoal.user_id == uid).all()

@app.post("/api/goals")
async def create_goal(data: StudyGoalCreate, uid: str = Depends(get_user), db: Session = Depends(get_db)):
    g = StudyGoal(user_id=uid, **data.dict())
    db.add(g)
    db.commit()
    return g

@app.patch("/api/goals/{id}")
async def update_goal(id: int, data: StudyGoalCreate, uid: str = Depends(get_user), db: Session = Depends(get_db)):
    g = db.query(StudyGoal).filter(StudyGoal.id == id, StudyGoal.user_id == uid).first()
    if not g: raise HTTPException(status_code=404)
    for k, v in data.dict().items():
        setattr(g, k, v)
    db.commit()
    return g

@app.delete("/api/goals/{id}")
async def delete_goal(id: int, uid: str = Depends(get_user), db: Session = Depends(get_db)):
    g = db.query(StudyGoal).filter(StudyGoal.id == id, StudyGoal.user_id == uid).first()
    if not g: raise HTTPException(status_code=404)
    db.delete(g)
    db.commit()
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

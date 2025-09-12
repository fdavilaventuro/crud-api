from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sqlite3
import os

app = FastAPI()

DATABASE = "tasks.db"

def init_db():
    if not os.path.exists(DATABASE):
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT
        )
        """)
        conn.commit()
        conn.close()

@app.on_event("startup")
def on_startup():
    init_db()

class Task(BaseModel):
    id: int = None
    title: str
    description: str = None

@app.post("/tasks/", response_model=Task)
def create_task(task: Task):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tasks (title, description) VALUES (?, ?)", (task.title, task.description))
    task_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {**task.dict(), "id": task_id}

@app.get("/tasks/{task_id}", response_model=Task)
def read_task(task_id: int):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, description FROM tasks WHERE id = ?", (task_id,))
    task = cursor.fetchone()
    conn.close()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"id": task[0], "title": task[1], "description": task[2]}

@app.get("/")
def read_root():
    return {"message": "Hello from ECS Fargate!"}
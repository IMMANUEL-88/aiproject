# backend/models.py
from sqlalchemy import Column, Integer, String, JSON
from database import Base

class Stack(Base):
    __tablename__ = "stacks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    graph = Column(JSON) # Stores the React Flow JSON

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    doc_id = Column(String, unique=True, index=True)
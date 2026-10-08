from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    default_sla_hours = Column(Integer, default=24)
    default_priority = Column(String, default="Medium")
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="categories")

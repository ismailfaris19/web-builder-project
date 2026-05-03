from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any, List

ComponentType = Literal["button","link","input"]

class ComponentDesign(BaseModel):
    id: Optional[str] = None
    type: ComponentType = "button"
    label: str = Field(default="")
    description: Optional[str] = None
    intent: Optional[Literal["primary","secondary","danger"]] = "primary"
    color: Optional[str] = None
    size: Optional[Literal["sm","md","lg"]] = "md"
    href: Optional[str] = None
    name: Optional[str] = "action"
    required: Optional[bool] = False
    placeholder: Optional[str] = None

class GenerateRequest(BaseModel):
    target: Literal["html","react"] = "html"
    design: ComponentDesign

class GenerateResponse(BaseModel):
    html: Optional[str] = None
    react: Optional[str] = None
    css: Optional[str] = None
    a11yNotes: Optional[str] = None

class ValidateRequest(BaseModel):
    design: ComponentDesign

class ValidateResponse(BaseModel):
    ok: bool
    warnings: List[str]
    suggestions: List[str]

class PageDTO(BaseModel):
    id: Optional[str] = None
    name: str
    data: Dict[str, Any]

class PageListItem(BaseModel):
    id: str
    name: str
    updatedAt: Optional[int] = None

from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any, List

ComponentType = Literal["container", "button", "link", "input", "text", "image"]

class ComponentStyles(BaseModel):
    padding: Optional[str] = None
    margin: Optional[str] = None
    borderRadius: Optional[str] = None
    backgroundColor: Optional[str] = None
    fontSize: Optional[str] = None

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
    src: Optional[str] = None
    alt: Optional[str] = None
    children: Optional[List["ComponentDesign"]] = None
    styles: Optional[ComponentStyles] = None

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

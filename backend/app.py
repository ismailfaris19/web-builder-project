from fastapi import FastAPI, Body, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import GenerateRequest, GenerateResponse, ValidateRequest, ValidateResponse, ComponentDesign, PageDTO, PageListItem
from db import Base, engine, SessionLocal, Page as PageDB
from sqlalchemy.orm import Session
import re, json, time, uuid, html

app = FastAPI(title="Website Builder API", version="1.0.0")
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- simple validator ---
@app.post("/api/components/validate", response_model=ValidateResponse)
def validate(req: ValidateRequest):
    warnings, suggestions = [], []
    d = req.design
    if d.type == "link" and not d.href:
        warnings.append("Link without href")
        suggestions.append("Provide an href; if it triggers an action, consider a button")
    if d.type != "input" and not d.label:
        warnings.append("Missing label")
        suggestions.append("Provide a label or aria-label")
    return ValidateResponse(ok=len(warnings)==0, warnings=warnings, suggestions=suggestions)

# --- very small generator ---
@app.post("/api/components/generate", response_model=GenerateResponse)
def generate_code(req: GenerateRequest):
    d = req.design
    html_code = ""
    react = ""

    if d.type == "button":
        label = html.escape(d.label or "Button")

        # HTML
        html_code = (
            f'<button aria-label="{label}" '
            + "onkeydown=\"if(event.key===' '||event.key==='Enter') this.click();\""
            + f'>{label}</button>'
        )

        # React/TS
        react = f"""export function ActionButton({{ onClick }}: {{ onClick?: () =&gt; void }}) {{
  return (
    <button aria-label="{label}" onClick={{onClick}} onKeyDown={{(e) => (e.key===' '||e.key==='Enter') && onClick && onClick()}}>{label}</button>
  );
}}"""

    elif d.type == "link":
        text = html.escape(d.label or "Link")
        href = html.escape(d.href or "#")

        # HTML
        html_code = f'<a href="{href}" aria-label="{text}">{text}</a>'

        # React
        react = f'export function NavLink() {{ return (<a href="{href}" aria-label="{text}">{text}</a>); }}'

    else:
        label = html.escape(d.label or "Input")
        input_id = html.escape((d.name or "field").lower())
        req_attr = " required" if d.required else ""
        placeholder_text = html.escape(d.placeholder or "")
        ph_attr = f' placeholder="{placeholder_text}"' if d.placeholder else ""

        # HTML
        html_code = f"""<label for="{input_id}">{label}</label>
<input id="{input_id}" name="{input_id}" aria-label="{label}"{ph_attr}{req_attr}/>"""

        # React
        react = f"""export function {input_id.capitalize()}Field() {{ return (
  <div>
    <label htmlFor="{input_id}">{label}</label>
    <input id="{input_id}" name="{input_id}" aria-label="{label}"{req_attr}{ph_attr} />
  </div>
); }}"""

    # Notes
    notes = []
    if d.type == "button":
        notes.append("Keyboard: Space/Enter triggers button")
    elif d.type == "link":
        notes.append("Use meaningful link text")
    elif d.type == "input":
        notes.append("Label is programmatically associated")

    return GenerateResponse(html=html_code, react=react, css=None, a11yNotes="\n".join(notes))

# --- pages ---
@app.get("/api/pages", response_model=list[PageListItem])
def list_pages(db: Session = Depends(get_db)):
    rows = db.query(PageDB).order_by(PageDB.updated_at.desc().nullslast()).all()
    out = []
    for r in rows:
        ts = int(time.time()) if r.updated_at is None else int(r.updated_at.timestamp())
        out.append(PageListItem(id=r.id, name=r.name, updatedAt=ts))
    return out

@app.get("/api/pages/{pid}", response_model=PageDTO)
def get_page(pid: str, db: Session = Depends(get_db)):
    p = db.get(PageDB, pid)
    if not p:
        raise HTTPException(status_code=404, detail="not found")
    return PageDTO(id=p.id, name=p.name, data=json.loads(p.data))

@app.post("/api/pages", response_model=PageDTO)
def save_page(page: PageDTO, db: Session = Depends(get_db)):
    pid = page.id or uuid.uuid4().hex
    if page.id:
        p = db.get(PageDB, pid)
        if not p:
            raise HTTPException(status_code=404, detail="not found")
        p.name = page.name
        p.data = json.dumps(page.data, ensure_ascii=False)
    else:
        p = PageDB(id=pid, name=page.name, data=json.dumps(page.data, ensure_ascii=False))
        db.add(p)
    db.commit()
    db.refresh(p)
    return PageDTO(id=p.id, name=p.name, data=json.loads(p.data))

@app.delete("/api/pages/{pid}")
def delete_page(pid: str, db: Session = Depends(get_db)):
    p = db.get(PageDB, pid)
    if not p:
        raise HTTPException(status_code=404, detail="not found")
    db.delete(p)
    db.commit()
    return {"ok": True}

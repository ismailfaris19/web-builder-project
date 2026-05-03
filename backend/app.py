from fastapi import FastAPI, Body, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import GenerateRequest, GenerateResponse, ValidateRequest, ValidateResponse, ComponentDesign, PageDTO, PageListItem
from db import Base, engine, SessionLocal, Page as PageDB
from sqlalchemy.orm import Session
import re, json, time, uuid

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

    if d.type == "button":
        label = d.label or "Button"

        # HTML (escaped angle brackets as in your original)
        html = (
            f'&lt;button aria-label="{label}" '
            + "onkeydown=\"if(event.key===' '||event.key==='Enter') this.click();\""
            + f'&gt;{label}&lt;/button&gt;'
        )

        # React/TS (escaped braces for f-strings + HTML entities)
        react = f"""export function ActionButton({{ onClick }}: {{ onClick?: () =&gt; void }}) {{
  return (
    &lt;button aria-label="{label}" onClick={{{{onClick}}}} onKeyDown={{{{(e) =&gt; (e.key===' '||e.key==='Enter') &amp;&amp; onClick &amp;&amp; onClick()}}}}&gt;{label}&lt;/button&gt;
  );
}}"""

    elif d.type == "link":
        text = d.label or "Link"
        href = d.href or "#"

        # HTML
        html = f'&lt;a href="{href}" aria-label="{text}"&gt;{text}&lt;/a&gt;'

        # React (double the function braces inside an f-string)
        react = f'export function NavLink() {{ return (&lt;a href="{href}" aria-label="{text}"&gt;{text}&lt;/a&gt;); }}'

    else:
        label = d.label or "Input"
        input_id = (d.name or "field").lower()
        req_attr = " required" if d.required else ""
        ph_attr = f' placeholder="{d.placeholder}"' if d.placeholder else ""

        # HTML (multi-line -> triple-quoted f-string)
        html = f"""&lt;label for="{input_id}"&gt;{label}&lt;/label&gt;
&lt;input id="{input_id}" name="{input_id}" aria-label="{label}"{ph_attr}{req_attr}/&gt;"""

        # React (triple-quoted + doubled braces)
        react = f"""export function {input_id.capitalize()}Field() {{ return (
  &lt;div&gt;
    &lt;label htmlFor="{input_id}"&gt;{label}&lt;/label&gt;
    &lt;input id="{input_id}" name="{input_id}" aria-label="{label}"{req_attr}{ph_attr} /&gt;
  &lt;/div&gt;
); }}"""

    # Notes
    notes = []
    if d.type == "button":
        notes.append("Keyboard: Space/Enter triggers button")
    elif d.type == "link":
        notes.append("Use meaningful link text")
    elif d.type == "input":
        notes.append("Label is programmatically associated")

    return GenerateResponse(html=html, react=react, css=None, a11yNotes="\n".join(notes))

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

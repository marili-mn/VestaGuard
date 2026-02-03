from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents import initiate_analysis, initiate_chat
import os

app = FastAPI(title="VestaGuard Core API")

# Allow CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to Netlify domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisResponse(BaseModel):
    status: str
    report: str

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def health_check():
    return {"status": "VestaGuard Neural Core Online"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        response = initiate_chat(request.message)
        return {"status": "complete", "response": response}
    except Exception as e:
        # Log del error detallado para depuración
        print(f"ERROR in /chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text_content = content.decode("utf-8") # Simplified for text files
        
        # Trigger AutoGen
        # Note: In a real app, this should be async/background task (Celery/Redis)
        report = initiate_analysis(text_content)
        
        return {"status": "complete", "report": report}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

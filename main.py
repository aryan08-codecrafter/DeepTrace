import uuid
import shutil
import time
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from schemas import AnalysisResponse
from pipeline_adapter import run_pipeline

app = FastAPI(title="Deepfake Detection API")

# Broad CORS permissions for hackathon testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Absolute directory setup
UPLOAD_DIR = Path("uploads").resolve()
RESULTS_DIR = Path("results").resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/results", StaticFiles(directory=str(RESULTS_DIR)), name="results")

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_file(file: UploadFile = File(...)):
    start_time = time.time()
    
    file_ext = Path(file.filename).suffix.lower()
    valid_extensions = {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".avi"}
    
    is_valid_type = (
        (file.content_type and file.content_type.startswith(("image/", "video/"))) 
        or file_ext in valid_extensions
    )

    if not is_valid_type:
        raise HTTPException(status_code=400, detail="Only image and video files are supported.")

    saved_filename = f"{uuid.uuid4()}{file_ext if file_ext else '.png'}"
    saved_path = UPLOAD_DIR / saved_filename

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_type = "video" if file_ext in {".mp4", ".mov", ".avi"} or (file.content_type and "video" in file.content_type) else "image"

    # Execute dynamic pipeline analysis (ELA, FFT, Metadata)
    results = run_pipeline(str(saved_path), file_type)
    duration_ms = int((time.time() - start_time) * 1000)

    return {
        "file_type": file_type,
        "overall_verdict": results["overall_verdict"],
        "overall_score": results["overall_score"],
        "checks": results["checks"],
        "heatmap_image_url": results["heatmap_image_url"],
        "processing_time_ms": duration_ms,
        "frames": results.get("frames")
    }
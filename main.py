import uuid
import shutil
import time
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from schemas import AnalysisResponse

app = FastAPI(title="Deepfake Detection API")

# Configure CORS so Vite dev server can call the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure required directories exist and mount results as static assets
Path("results").mkdir(exist_ok=True)
Path("uploads").mkdir(exist_ok=True)
app.mount("/results", StaticFiles(directory="results"), name="results")

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_file(file: UploadFile = File(...)):
    start_time = time.time()

    # Content-type validation
    if not file.content_type.startswith(("image/", "video/")):
        raise HTTPException(status_code=400, detail="Only image and video files are supported.")

    # Save file with UUID to prevent naming collisions
    file_ext = Path(file.filename).suffix
    saved_filename = f"{uuid.uuid4()}{file_ext}"
    saved_path = Path("uploads") / saved_filename

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_type = "video" if file.content_type.startswith("video/") else "image"
    duration_ms = int((time.time() - start_time) * 1000)

    # Stub response conforming to the agreed schema
    return {
        "file_type": file_type,
        "overall_verdict": "potentially_manipulated",
        "overall_score": 0.78,
        "checks": {
            "ai_generation": {
                "score": 0.82,
                "level": "HIGH",
                "explanation": "Frequency-domain artifacts consistent with GAN/diffusion synthesis"
            },
            "face_manipulation": {
                "score": 0.65,
                "level": "MEDIUM",
                "explanation": "Inconsistent blending boundary detected around jawline"
            },
            "metadata_anomaly": {
                "score": 0.40,
                "level": "LOW",
                "explanation": "EXIF present but editing software signature found (Photoshop 25.0)"
            },
            "compression_inconsistency": {
                "score": 0.55,
                "level": "MEDIUM",
                "explanation": "Error Level Analysis shows uneven compression across regions"
            }
        },
        "heatmap_image_url": "/results/sample_heatmap.png",
        "processing_time_ms": duration_ms
    }
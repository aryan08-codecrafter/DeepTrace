from pydantic import BaseModel
from typing import Dict, Optional, List

class CheckDetail(BaseModel):
    score: float
    level: str
    explanation: str

class VideoFrame(BaseModel):
    timestamp: float
    score: float

class AnalysisResponse(BaseModel):
    file_type: str
    overall_verdict: str
    overall_score: float
    checks: Dict[str, CheckDetail]
    heatmap_image_url: str
    processing_time_ms: int
    frames: Optional[List[VideoFrame]] = None
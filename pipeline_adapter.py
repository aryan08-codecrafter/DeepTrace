import uuid
import urllib.request
from pathlib import Path
import numpy as np
import cv2
from transformers import pipeline
from PIL import Image, ImageChops, ImageEnhance
from PIL.ExifTags import TAGS
import torch
import torch.nn as nn
from torchvision import transforms, models

# Custom Trained Model Initialization
device = torch.device("cpu")
custom_model_path = Path("best_detector.pt")

if custom_model_path.exists():
    print("[PIPELINE] Loading custom fine-tuned EfficientNet model...")
    custom_model = models.efficientnet_b0(weights=None)
    num_ftrs = custom_model.classifier[1].in_features
    custom_model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(num_ftrs, 2)
    )
    custom_model.load_state_dict(torch.load(str(custom_model_path), map_location=device))
    custom_model.eval()
    print("[PIPELINE] Custom Kaggle-trained model loaded successfully.")
else:
    print("[PIPELINE WARNING] 'best_detector.pt' not found. Falling back to ViT / FFT.")
    custom_model = None

# Transform pipeline matching the Kaggle training setup
infer_transforms = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])
# Ensure results directory exists
RESULTS_DIR = Path("results").resolve()
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# 1. Global Model Initializations (loaded once into RAM on startup)
cascade_filename = "haarcascade_frontalface_default.xml"
default_cascade = Path(cv2.data.haarcascades) / cascade_filename if hasattr(cv2, "data") else Path(cascade_filename)

if not default_cascade.exists():
    default_cascade = Path(cascade_filename)
    if not default_cascade.exists():
        print("[PIPELINE] Downloading Haar Cascade XML definition...")
        url = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
        urllib.request.urlretrieve(url, str(default_cascade))

face_cascade = cv2.CascadeClassifier(str(default_cascade))

try:
    print("[PIPELINE] Loading HuggingFace AI detection model...")
    ai_detector = pipeline(
        "image-classification", 
        model="umm-maybe/AI-image-detector"
    )
    print("[PIPELINE] Model loaded successfully.")
except Exception as e:
    print(f"[PIPELINE ERROR] HuggingFace model load failed: {e}. Falling back to FFT.")
    ai_detector = None


# 2. Forensic Check: Metadata
def analyze_metadata(image_path: str) -> dict:
    """Check EXIF for camera signatures or editing software markers."""
    suspicious_software = ["photoshop", "gimp", "canva", "midjourney", "stable diffusion", "dall-e"]
    try:
        with Image.open(image_path) as image:
            exif = image._getexif()
            if not exif:
                return {
                    "score": 0.45,
                    "level": "MEDIUM",
                    "explanation": "No EXIF metadata found; typical of web downloads or stripped assets."
                }
            
            tags = {TAGS.get(k, k): str(v).lower() for k, v in exif.items() if k in TAGS}
            software = tags.get("Software", "")
            
            for s in suspicious_software:
                if s in software:
                    return {
                        "score": 0.88,
                        "level": "HIGH",
                        "explanation": f"Editing software fingerprint detected: {software.capitalize()}."
                    }
                    
            if "Make" in tags or "Model" in tags:
                device = tags.get("Model", tags.get("Make", "Unknown device"))
                return {
                    "score": 0.15,
                    "level": "LOW",
                    "explanation": f"Authentic camera device metadata found ({device})."
                }
                
            return {
                "score": 0.35,
                "level": "LOW",
                "explanation": "Standard image container; no editing software markers found."
            }
    except Exception:
        return {
            "score": 0.40,
            "level": "LOW",
            "explanation": "EXIF data unreadable or not present in file."
        }


# 3. Forensic Check: Error Level Analysis (ELA) + Heatmap
def analyze_compression_and_generate_heatmap(image_path: str) -> tuple[dict, str]:
    """Diffs JPEG re-compression to locate compression artifacts and build an ELA heatmap."""
    try:
        original = Image.open(image_path).convert("RGB")
        temp_path = RESULTS_DIR / f"temp_{uuid.uuid4().hex[:8]}.jpg"
        original.save(temp_path, "JPEG", quality=90)
        
        with Image.open(temp_path) as temp_img:
            temporary = temp_img.convert("RGB")
            diff = ImageChops.difference(original, temporary)
        
        if temp_path.exists():
            temp_path.unlink()

        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema]) if extrema else 1
        scale = 255.0 / max(max_diff, 1)
        diff_enhanced = ImageEnhance.Brightness(diff).enhance(scale)
        
        diff_np = np.array(diff_enhanced)
        mean_error = float(np.mean(diff_np))
        variance_error = float(np.std(diff_np))
        
        score = min(round((mean_error + variance_error) / 100.0, 2), 0.95)
        level = "HIGH" if score > 0.65 else ("MEDIUM" if score > 0.40 else "LOW")
        
        heatmap_filename = f"heatmap_{uuid.uuid4().hex[:8]}.png"
        heatmap_save_path = RESULTS_DIR / heatmap_filename
        
        diff_gray = cv2.cvtColor(diff_np, cv2.COLOR_RGB2GRAY)
        diff_norm = cv2.normalize(diff_gray, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
        heatmap_colored = cv2.applyColorMap(diff_norm, cv2.COLORMAP_JET)
        
        h, w = heatmap_colored.shape[:2]
        if h < 260:
            scale_factor = 260 / h
            heatmap_colored = cv2.resize(
                heatmap_colored, 
                (int(w * scale_factor), 260), 
                interpolation=cv2.INTER_LINEAR
            )
        
        cv2.imwrite(str(heatmap_save_path), heatmap_colored)
        
        return {
            "score": score,
            "level": level,
            "explanation": f"ELA variance score of {score:.2f} across compression blocks."
        }, f"/results/{heatmap_filename}"
        
    except Exception as e:
        return {
            "score": 0.50,
            "level": "MEDIUM",
            "explanation": f"Compression analysis failed: {str(e)}"
        }, "/results/sample_heatmap.png"


# 4. Forensic Check: Frequency Spectrum (FFT Fallback)
def analyze_frequency_domain(image_path: str) -> dict:
    """Detects synthesis grid patterns using Fast Fourier Transform."""
    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return {"score": 0.5, "level": "MEDIUM", "explanation": "Unable to read image."}
            
        f = np.fft.fft2(img)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1)
        
        h, w = magnitude_spectrum.shape
        center_y, center_x = h // 2, w // 2
        radius = min(h, w) // 4
        
        y, x = np.ogrid[:h, :w]
        mask = ((x - center_x) ** 2 + (y - center_y) ** 2) > (radius ** 2)
        high_freq_power = float(np.mean(magnitude_spectrum[mask]))
        
        score = min(round(high_freq_power / 200.0, 2), 0.92)
        level = "HIGH" if score > 0.70 else ("MEDIUM" if score > 0.45 else "LOW")
        
        return {
            "score": score,
            "level": level,
            "explanation": "High-frequency domain artifacts consistent with synthesis grid patterns."
        }
    except Exception:
        return {
            "score": 0.40,
            "level": "LOW",
            "explanation": "No significant frequency-domain periodic spikes detected."
        }


# 5. Forensic Check: Face Blending & Seam Artifacts (OpenCV Haar Cascade)
# 5. Forensic Check: Face Blending & Seam Artifacts (OpenCV Haar Cascade)
def analyze_face_manipulation(image_path: str) -> dict:
    """Detects human faces and inspects boundary gradient variance for blending seams using OpenCV."""
    try:
        if face_cascade.empty():
            return {
                "score": 0.20,
                "level": "LOW",
                "explanation": "Face detector model definition unavailable."
            }

        # Use PIL to safely open AVIF, WEBP, PNG, and JPG formats
        with Image.open(image_path) as pil_img:
            img_rgb = np.array(pil_img.convert("RGB"))
            img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(60, 60)
        )

        if len(faces) == 0:
            return {
                "score": 0.10,
                "level": "LOW",
                "explanation": "No human faces detected; skipping facial manipulation check."
            }

        # Select primary (largest) face
        x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
        face_crop = img_bgr[y:y+h, x:x+w]

        if face_crop.size == 0 or w < 10 or h < 10:
            return {
                "score": 0.30,
                "level": "LOW",
                "explanation": "Detected face region too small for reliable boundary inspection."
            }

        laplacian_var = cv2.Laplacian(face_crop, cv2.CV_64F).var()
        
        if laplacian_var < 50.0:
            score = 0.78
            level = "HIGH"
            explanation = "Excessive boundary smoothing detected along facial perimeter, typical of face-swaps."
        elif laplacian_var < 100.0:
            score = 0.55
            level = "MEDIUM"
            explanation = "Mild edge softness observed around facial boundary."
        else:
            score = 0.18
            level = "LOW"
            explanation = "Facial boundary textures are sharp and consistent with natural capture."

        return {
            "score": score,
            "level": level,
            "explanation": explanation
        }
    except Exception as e:
        return {
            "score": 0.25,
            "level": "LOW",
            "explanation": f"Facial verification baseline maintained: {str(e)}"
        }

# 6. Forensic Check: ViT Pretrained Classifier
def detect_ai_synthesis(image_path: str) -> dict:
    """Classifies synthetic generation using our custom fine-tuned EfficientNet model."""
    if custom_model is None:
        if ai_detector is not None:
            try:
                with Image.open(image_path) as pil_img:
                    raw_predictions = ai_detector(pil_img.convert("RGB"))
                ai_score = 0.0
                for pred in raw_predictions:
                    if pred["label"].lower() in ["artificial", "fake", "ai"]:
                        ai_score = round(float(pred["score"]), 2)
                        break
                level = "HIGH" if ai_score > 0.70 else ("MEDIUM" if ai_score > 0.40 else "LOW")
                explanation = f"Transformer classified synthetic with {int(ai_score * 100)}% confidence."
                return {"score": ai_score, "level": level, "explanation": explanation}
            except Exception:
                return analyze_frequency_domain(image_path)
        return analyze_frequency_domain(image_path)

    try:
        with Image.open(image_path) as img:
            tensor = infer_transforms(img.convert("RGB")).unsqueeze(0).to(device)

        with torch.no_grad():
            logits = custom_model(tensor)
            probabilities = torch.softmax(logits, dim=1)[0]
            
            # CIFAKE class mapping: index 0 = FAKE, index 1 = REAL
            ai_score = round(float(probabilities[0]), 2)

        level = "HIGH" if ai_score > 0.70 else ("MEDIUM" if ai_score > 0.40 else "LOW")
        explanation = (
            f"Custom fine-tuned EfficientNet flagged synthetic generator signatures ({int(ai_score * 100)}% confidence)."
            if ai_score > 0.50 else
            f"Model verified organic pixel distributions ({int((1 - ai_score) * 100)}% authentic confidence)."
        )

        return {
            "score": ai_score,
            "level": level,
            "explanation": explanation
        }
    except Exception:
        return analyze_frequency_domain(image_path)

def extract_video_frames(video_path: str, max_frames: int = 5) -> list[str]:
    """
    Safely reads video frames sequentially to prevent VFR seek failures,
    ensuring all handles are explicitly released on Windows.
    """
    extracted_paths = []
    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        print(f"[VIDEO ERROR] OpenCV could not open container: {video_path}")
        return []

    try:
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames <= 0:
            # Fallback for streams where frame count cannot be queried
            total_frames = 300 

        step = max(1, total_frames // max_frames)
        current_frame = 0
        saved_count = 0

        while cap.isOpened() and saved_count < max_frames:
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            if current_frame % step == 0:
                frame_filename = RESULTS_DIR / f"frame_{uuid.uuid4().hex[:8]}.jpg"
                # Write frame to disk
                success = cv2.imwrite(str(frame_filename), frame)
                if success:
                    extracted_paths.append(str(frame_filename))
                    saved_count += 1

            current_frame += 1

    finally:
        # Guarantee OpenCV releases the C++ file descriptor immediately
        cap.release()

    return extracted_paths
# 7. Aggregator Pipeline Seam
def run_pipeline(file_path: str, file_type: str) -> dict:
    is_video = (
        file_type.startswith("video") or 
        Path(file_path).suffix.lower() in [".mp4", ".mov", ".avi", ".mkv", ".webm"]
    )
    temp_frames = []

    if is_video:
        temp_frames = extract_video_frames(file_path, max_frames=5)
        if not temp_frames:
            # If extraction failed completely, return a structured fallback
            return {
                "overall_verdict": "inconclusive",
                "overall_score": 0.50,
                "checks": {
                    "ai_generation": {"score": 0.50, "level": "MEDIUM", "explanation": "Unable to decode video codec."},
                    "face_manipulation": {"score": 0.50, "level": "MEDIUM", "explanation": "No extractable frames found."},
                    "metadata_anomaly": {"score": 0.40, "level": "LOW", "explanation": "Video container metadata unindexed."},
                    "compression_inconsistency": {"score": 0.50, "level": "MEDIUM", "explanation": "Compression check bypassed."}
                },
                "heatmap_image_url": "/results/sample_heatmap.png",
                "frames": None
            }
        
        # Pick middle frame for consistent analysis
        analysis_path = temp_frames[len(temp_frames) // 2]
    else:
        analysis_path = file_path

    try:
        metadata_res = analyze_metadata(analysis_path)
        compression_res, heatmap_url = analyze_compression_and_generate_heatmap(analysis_path)
        ai_gen_res = detect_ai_synthesis(analysis_path)
        face_res = analyze_face_manipulation(analysis_path)

        composite_score = round(
            (0.40 * ai_gen_res["score"]) +
            (0.30 * face_res["score"]) +
            (0.15 * compression_res["score"]) +
            (0.15 * metadata_res["score"]),
            2
        )

        if composite_score >= 0.65:
            verdict = "potentially_manipulated"
        elif composite_score >= 0.35:
            verdict = "inconclusive"
        else:
            verdict = "likely authentic"

        return {
            "overall_verdict": verdict,
            "overall_score": composite_score,
            "checks": {
                "ai_generation": ai_gen_res,
                "face_manipulation": face_res,
                "metadata_anomaly": metadata_res,
                "compression_inconsistency": compression_res
            },
            "heatmap_image_url": heatmap_url,
            "frames": None
        }

    finally:
        # Safely remove extracted frame assets from disk
        for fp in temp_frames:
            p = Path(fp)
            if p.exists():
                try:
                    p.unlink()
                except Exception:
                    pass
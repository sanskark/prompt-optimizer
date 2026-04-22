import os
import json
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langsmith import traceable
from dotenv import load_dotenv

from google import genai

load_dotenv()


SUPPORTED_MODELS = [
    {
        "id": "gemini-3-flash-preview",
        "name": "Gemini 3 Flash Preview",
        "description": "The best model in the world for multimodal understanding, and our most powerful agentic and vibe-coding model yet, delivering richer visuals and deeper interactivity, all built on a foundation of state-of-the-art reasoning."
    },
    {
        "id": "gemini-3.1-flash-lite-preview",
        "name": "Gemini 3.1 Flash-Lite Preview",
        "description": "Gemini 3.1 Flash-Lite is best for high-volume agentic tasks, simple data extraction, and extremely low-latency applications where budget and speed are the primary constraints.",
    },
    {
        "id": "gemini-3.1-pro-preview",
        "name": "Gemini 3.1 Pro Preview",
        "description": "Gemini 3.1 Pro Preview provides better thinking, improved token efficiency, and a more grounded, factually consistent experience. It's optimized for software engineering behavior and usability, as well as agentic workflows requiring precise tool usage and reliable multi-step execution across real-world domains.",
    },
]

class PromptOptimizer:
    def __init__(self):
        key = os.environ.get("GEMINI_API_KEY")
        if not key:
            raise ValueError("GEMINI_API_KEY is missing from the .env file.")

        # Initialize the modern client
        self.client = genai.Client(api_key=key)
        self.system_instructions = """
        You are an expert AI Prompt Engineer. Evaluate the draft prompt based on:
        1. Clarity (0-25)
        2. Context (0-25)
        3. Constraints (0-25)
        4. Persona/Role (0-25)

        Return ONLY a JSON object with this exact schema:
        {
            "scores": { "clarity": int, "context": int, "constraints": int, "persona": int, "total": int },
            "critique": "A 2-3 sentence candid explanation.",
            "optimized_prompt": "The engineered version."
        }
        """

    @traceable(name="Evaluate and Optimize Prompt", run_type="llm")
    def optimize(self, user_prompt: str, model_id: str, temp: float) -> dict:
        try:
            full_prompt = f"{self.system_instructions}\n\nDraft:\n{user_prompt}"

            start_time = time.perf_counter()

            response = self.client.models.generate_content(
                model=model_id,  # Dynamic model selection
                contents=full_prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": temp
                }
            )

            latency_ms = round((time.perf_counter() - start_time) * 1000)
            result_data = json.loads(response.text)

            result_data["analytics"] = {
                "latency_ms": latency_ms,
                "prompt_tokens": response.usage_metadata.prompt_token_count,
                "completion_tokens": response.usage_metadata.candidates_token_count,
                "total_tokens": response.usage_metadata.total_token_count
            }

            return result_data
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"error": str(e)}


app = FastAPI(title="Prompt Optimizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    optimizer = PromptOptimizer()
except ValueError as e:
    print(f"Startup Warning: {e}")
    optimizer = None


class PromptRequest(BaseModel):
    prompt: str
    model_id: str = "gemini-3.1"
    temperature: float = 1.0


@app.get("/api/v1/models")
async def get_models():
    """Returns the list of supported models to the frontend."""
    return {"models": SUPPORTED_MODELS}


@app.post("/api/v1/optimize")
async def optimize_endpoint(request: PromptRequest):
    if not optimizer:
        raise HTTPException(status_code=500, detail="API Configuration Error.")

    result = optimizer.optimize(
        user_prompt=request.prompt,
        model_id=request.model_id,
        temp=request.temperature
    )

    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])
    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import tempfile
from typing import Optional

app = FastAPI(
    title="LaTeX to PDF Service",
    description="A service to convert LaTeX documents to PDF",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LatexRequest(BaseModel):
    latex_content: str
    output_filename: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "LaTeX to PDF conversion service is running"}

@app.post("/convert")
async def convert_latex_to_pdf(request: LatexRequest):
    try:
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create temporary tex file
            tex_path = os.path.join(temp_dir, "input.tex")
            with open(tex_path, "w") as f:
                f.write(request.latex_content)
            
            # Run pdflatex
            process = subprocess.run(
                ["pdflatex", "-interaction=nonstopmode", "-output-directory", temp_dir, tex_path],
                capture_output=True,
                text=True
            )
            
            if process.returncode != 0:
                raise HTTPException(
                    status_code=500,
                    detail=f"LaTeX compilation failed: {process.stderr}"
                )
            
            # Read the generated PDF
            pdf_path = os.path.join(temp_dir, "input.pdf")
            if not os.path.exists(pdf_path):
                raise HTTPException(
                    status_code=500,
                    detail="PDF file was not generated"
                )
                
            with open(pdf_path, "rb") as f:
                pdf_content = f.read()
                
            return {
                "message": "Conversion successful",
                "pdf_content": pdf_content
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during conversion: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

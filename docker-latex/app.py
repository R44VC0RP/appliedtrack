from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import tempfile
from typing import Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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
    logger.info("Root endpoint called")
    return {"message": "LaTeX to PDF conversion service is running"}

@app.post("/convert")
async def convert_latex_to_pdf(request: LatexRequest):
    logger.info("Starting LaTeX to PDF conversion")
    logger.debug(f"Received LaTeX content length: {len(request.latex_content)}")
    
    try:
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            logger.info(f"Created temporary directory at: {temp_dir}")
            
            # Create temporary tex file
            tex_path = os.path.join(temp_dir, "input.tex")
            logger.info(f"Writing LaTeX content to: {tex_path}")
            
            with open(tex_path, "w") as f:
                f.write(request.latex_content)
            logger.debug("LaTeX content written to file successfully")
            
            # Print the content of the tex file for debugging
            logger.debug("Content of tex file:")
            with open(tex_path, "r") as f:
                logger.debug(f.read())
            
            # Run pdflatex
            logger.info("Running pdflatex command")
            command = ["pdflatex", "-interaction=nonstopmode", "-output-directory", temp_dir, tex_path]
            logger.debug(f"Command: {' '.join(command)}")
            
            process = subprocess.run(
                command,
                capture_output=True,
                text=True
            )
            
            # Log the output regardless of success/failure
            logger.debug(f"pdflatex stdout:\n{process.stdout}")
            logger.debug(f"pdflatex stderr:\n{process.stderr}")
            logger.info(f"pdflatex return code: {process.returncode}")
            
            if process.returncode != 0:
                logger.error(f"LaTeX compilation failed with return code {process.returncode}")
                logger.error(f"Error output: {process.stderr}")
                raise HTTPException(
                    status_code=500,
                    detail=f"LaTeX compilation failed: {process.stderr}"
                )
            
            # Check for PDF
            pdf_path = os.path.join(temp_dir, "input.pdf")
            logger.info(f"Checking for PDF at: {pdf_path}")
            
            if not os.path.exists(pdf_path):
                logger.error("PDF file was not generated")
                # List directory contents for debugging
                logger.debug(f"Directory contents: {os.listdir(temp_dir)}")
                raise HTTPException(
                    status_code=500,
                    detail="PDF file was not generated"
                )
            
            logger.info(f"PDF file exists, size: {os.path.getsize(pdf_path)} bytes")
            
            with open(pdf_path, "rb") as f:
                pdf_content = f.read()
                logger.info(f"Successfully read PDF content, size: {len(pdf_content)} bytes")
                
            logger.info("Conversion completed successfully")
            return {
                "message": "Conversion successful",
                "pdf_content": pdf_content
            }
            
    except Exception as e:
        logger.exception("Unexpected error during conversion")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error message: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during conversion: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting LaTeX to PDF conversion service")
    uvicorn.run(app, host="0.0.0.0", port=8000)

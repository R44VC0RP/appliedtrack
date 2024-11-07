from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import tempfile
from typing import Optional
import logging
import uvicorn
import formattex

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

def preprocess_latex_content(content: str) -> str:
    """Preprocess LaTeX content to escape special characters and fix common issues."""
    replacements = {
        '&': '\\&',  # Escape ampersand
        '%': '\\%',  # Escape percent
        '_': '\\_',  # Escape underscore
        '#': '\\#',  # Escape hash
        '~': '\\~{}',  # Escape tilde
        '^': '\\^{}',  # Escape caret
    }
    
    # Only replace & characters that aren't already escaped
    lines = content.split('\n')
    processed_lines = []
    for line in lines:
        # Skip replacement in verbatim environments or already escaped sequences
        if '\\begin{verbatim}' in line or '\\end{verbatim}' in line:
            processed_lines.append(line)
            continue
            
        for char, replacement in replacements.items():
            # Don't replace if it's already escaped
            if f'\\{char}' not in line:
                line = line.replace(char, replacement)
        processed_lines.append(line)
    
    return '\n'.join(processed_lines)

def format_latex(content: str) -> str:
    """Format LaTeX content using formattex."""
    try:
        # Create a temporary file for formatting
        with tempfile.NamedTemporaryFile(mode='w', suffix='.tex', delete=False) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Format the content using formattex
        # Check the correct method name from formattex documentation
        if hasattr(formattex, 'format_string'):
            formatted_content = formattex.format_string(content)
        elif hasattr(formattex, 'format_tex'):
            formatted_content = formattex.format_tex(content)
        else:
            logger.warning("No suitable formatting method found in formattex")
            return content
            
        # Clean up
        os.unlink(temp_file_path)
        return formatted_content
    except Exception as e:
        logger.warning(f"LaTeX formatting failed: {str(e)}")
        return content  # Return original content if formatting fails

@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {"message": "LaTeX to PDF conversion service is running"}

@app.post("/convert")
async def convert_latex_to_pdf(request: LatexRequest):
    logger.info("Starting LaTeX to PDF conversion")
    
    try:
        # First format the LaTeX content
        # formatted_content = format_latex(request.latex_content)
        
        # Then preprocess the formatted content
        # processed_content = preprocess_latex_content(formatted_content)
        processed_content = request.latex_content
        logger.debug(f"Processed LaTeX content length: {len(processed_content)}")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            tex_path = os.path.join(temp_dir, "input.tex")
            
            # Write the content
            with open(tex_path, "w", encoding='utf-8') as f:
                f.write(processed_content)
            
            # Run pdftex twice to resolve references
            for _ in range(2):
                process = subprocess.run(
                    ["pdftex", "-interaction=nonstopmode", "-output-directory", temp_dir, tex_path],
                    capture_output=True,
                    text=True
                )
                
                if process.returncode != 0:
                    logger.error(f"LaTeX compilation failed: {process.stderr}")
                    # Check if the PDF was still generated despite errors
                    pdf_path = os.path.join(temp_dir, "input.pdf")
                    if not os.path.exists(pdf_path):
                        raise HTTPException(
                            status_code=500,
                            detail="PDF generation failed completely"
                        )
            
            # Read the generated PDF
            pdf_path = os.path.join(temp_dir, "input.pdf")
            with open(pdf_path, "rb") as f:
                pdf_content = f.read()
            
            return {
                "message": "Conversion successful",
                "pdf_content": pdf_content
            }
            
    except Exception as e:
        logger.exception("Error during PDF conversion")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

if __name__ == "__main__":
    
    logger.info("Starting LaTeX to PDF conversion service")
    uvicorn.run(app, host="0.0.0.0", port=8000)

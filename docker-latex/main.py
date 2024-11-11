import subprocess
import sys
from fastapi import FastAPI, HTTPException, UploadFile, File
import uvicorn
from fastapi.responses import FileResponse
import os
import tempfile
import re

app = FastAPI()

def run_latex(tex_file_path: str):
    try:
        # Run pdflatex twice to resolve references
        for i in range(2):
            process = subprocess.run(
                [
                    'pdflatex',
                    '-interaction=nonstopmode',  # Don't stop on error
                    '-halt-on-error',           # But do halt on serious errors
                    '-file-line-error',         # Give file and line numbers
                    tex_file_path
                ],
                capture_output=True,
                text=True,
                check=False,  # Don't raise exception immediately
                cwd=os.path.dirname(tex_file_path)
            )
            
            # Print output for debugging
            print(f"LaTeX Output (Pass {i+1}):")
            print(process.stdout)
            
            if process.stderr:
                print(f"Errors/Warnings (Pass {i+1}):")
                print(process.stderr)
            
            # Check for specific error patterns
            if "Missing $ inserted" in process.stdout:
                raise HTTPException(
                    status_code=400,
                    detail="LaTeX syntax error: Missing math mode delimiter ($). Please check your equations and special characters."
                )
            
            if process.returncode != 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"LaTeX compilation failed: {process.stdout.split('!')[-1]}"
                )

        # Get the PDF path
        pdf_path = os.path.splitext(tex_file_path)[0] + '.pdf'
        
        # Verify PDF exists
        if not os.path.exists(pdf_path):
            print(f"PDF file not found: {pdf_path}")
            raise HTTPException(
                status_code=500,
                detail="PDF file was not created despite successful compilation"
            )
            
        return {"status": "success", "output": process.stdout, "pdf_path": pdf_path}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "LaTeX Compiler API"}

@app.post("/compile")
async def compile_latex():
    return run_latex()

@app.get("/download")
async def download_pdf():
    return FileResponse("test.pdf")

def validate_latex_content(content: str) -> bool:
    required_elements = [
        r'\documentclass',
        r'\begin{document}',
        r'\end{document}'
    ]
    
    for element in required_elements:
        if element not in content:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid LaTeX: Missing {element}"
            )
    
    # Check for common errors
    potential_errors = [
        (r'[^\\]_', "Unescaped underscore found. Use \_ or math mode"),
        (r'[^\\]&', "Unescaped ampersand found. Use \\&"),
        (r'[^\\]%', "Unescaped percent sign found. Use \\%"),
        (r'[^\\]\$', "Unescaped dollar sign found. Use \\$"),
    ]
    
    for pattern, message in potential_errors:
        if re.search(pattern, content):
            raise HTTPException(
                status_code=400,
                detail=f"LaTeX syntax error: {message}"
            )
    
    return True

@app.post("/convert")
async def convert_latex(file: UploadFile = File(...)):
    temp_dir = tempfile.mkdtemp()
    try:
        content = (await file.read()).decode('utf-8')
        
        # Validate LaTeX content
        validate_latex_content(content)
        
        # Create temporary file path
        temp_file_path = os.path.join(temp_dir, file.filename or "input.tex")
        
        # Save uploaded file content
        with open(temp_file_path, "wb") as temp_file:
            temp_file.write(content.encode('utf-8'))
        
        # Format the LaTeX file using latexindent
        try:
            format_process = subprocess.run(
                ['latexindent', '-w', temp_file_path],  # -w flag writes changes to file
                capture_output=True,
                text=True,
                check=True,
                cwd=temp_dir
            )
            
            if format_process.stderr:
                print("Formatting Warnings:")
                print(format_process.stderr)
                
        except subprocess.CalledProcessError as e:
            print(f"Error formatting LaTeX: {e}")
            # Continue with unformatted file if formatting fails
            pass
        
        # Run LaTeX compilation
        result = run_latex(temp_file_path)
        
        # Return the PDF file
        return FileResponse(
            result["pdf_path"],
            media_type="application/pdf",
            filename="output.pdf"
        )
        
    except Exception as e:
        print(f"Error in convert_latex: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temporary directory
        if os.path.exists(temp_dir):
            try:
                import shutil
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f"Error cleaning up temporary directory: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    # Run LaTeX initially
    # run_latex()
    # Start FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8000)

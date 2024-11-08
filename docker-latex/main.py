import subprocess
import sys
from fastapi import FastAPI, HTTPException
import uvicorn

app = FastAPI()

def run_latex():
    try:
        # Run pdflatex command
        process = subprocess.run(
            ['pdflatex', 'test.tex'],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Print output
        print("LaTeX Output:")
        print(process.stdout)
        
        if process.stderr:
            print("Errors/Warnings:")
            print(process.stderr)
            
        return {"status": "success", "output": process.stdout}
            
    except subprocess.CalledProcessError as e:
        print(f"Error running pdflatex: {e}")
        print("LaTeX Output:")
        print(e.stdout)
        print("Error Output:") 
        print(e.stderr)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "LaTeX Compiler API"}

@app.post("/compile")
async def compile_latex():
    return run_latex()

if __name__ == "__main__":
    # Run LaTeX initially
    run_latex()
    # Start FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8000)

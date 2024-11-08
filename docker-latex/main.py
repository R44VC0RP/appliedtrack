import subprocess
import sys

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
            
    except subprocess.CalledProcessError as e:
        print(f"Error running pdflatex: {e}")
        print("LaTeX Output:")
        print(e.stdout)
        print("Error Output:") 
        print(e.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_latex()

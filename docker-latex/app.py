from flask import Flask, request, jsonify, send_file
import os
import subprocess
import uuid
import base64

app = Flask(__name__)

TEX_DIR = "tex_files"
PDF_DIR = "pdf_files"

# Ensure directories exist
os.makedirs(TEX_DIR, exist_ok=True)
os.makedirs(PDF_DIR, exist_ok=True)

@app.route('/convert', methods=['POST'])
def convert_latex():
    try:
        # Get LaTeX content from request
        data = request.get_json()
        latex_content = data.get('latex_content')
        if not latex_content:
            return jsonify({'error': 'No LaTeX content provided'}), 400

        # Generate unique filename
        filename = f"{uuid.uuid4()}"
        tex_path = os.path.join(TEX_DIR, f"{filename}.tex")
        
        # Write LaTeX content to file
        with open(tex_path, 'w') as f:
            f.write(latex_content)

        # Run pdflatex in the latex container
        result = subprocess.run([
            "docker", "exec", "latex",
            "pdflatex", "-output-directory=/data", f"/data/{filename}.tex"
        ], capture_output=True, text=True)

        if result.returncode != 0:
            return jsonify({
                'error': 'PDF generation failed',
                'details': result.stderr
            }), 500

        # Read the generated PDF and convert to base64
        pdf_path = os.path.join(PDF_DIR, f"{filename}.pdf")
        with open(pdf_path, 'rb') as pdf_file:
            pdf_content = base64.b64encode(pdf_file.read()).decode('utf-8')

        return jsonify({
            'pdf_content': pdf_content
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/pdf/<filename>', methods=['GET'])
def get_pdf(filename):
    try:
        return send_file(
            os.path.join(PDF_DIR, filename),
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6000)
import fitz 
import sys
import pytesseract

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
import io

from docx import Document
from PIL import Image

import re

def read_pdf(path):

    full_text = ""
    try:
        with fitz.open(path) as pdf:
            for page in pdf:
                text = page.get_text().strip()
                images = page.get_images()

                if len(text) >= 2:
                    full_text+=text

                elif len(images) > 0:
                    for img in images:

                        # The image id
                        xref = img[0]
                        img_content = pdf.extract_image(xref)

                        img_bytes = img_content["image"]

                        full_text+=read_ocr_bytes(img_bytes)
            
        return full_text

    
    except Exception as e:
        print("Error opening or reading pdf: " + str(e))
        return None
    
def read_pptx(path):
    try:
        pptx = Presentation(path)

        text = []

        for slide in pptx.slides:
            for shape in slide.shapes:

                if shape.has_text_frame:
                    text.append(shape.text.strip())

                if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:

                    # Raw bytes
                    img_bytes = shape.image.blob

                    img_text = read_ocr_bytes(img_bytes)

                    text.append(img_text.strip())

        # Combine all strings separate by new lines
        return "\n".join(text)

    except Exception as e:
        print("Error opening or reading pptx: " + str(e))
        return None
    
def read_docx(path):
    try: 
        doc = Document(path)
        text = []

        for para in doc.paragraphs:
            text.append(para.text.strip())

        return "\n".join(text)

    except Exception as e:
        print("Error opening or reading docx: " + str(e))
        return None

def read_ocr_path(path):
    img = Image.open(path)
    text = pytesseract.image_to_string(img)

    return text

def read_ocr_bytes(bytes):
    img = Image.open(io.BytesIO(bytes))

    # Assumes block of text (--psm 6)
    text = pytesseract.image_to_string(img, config="--oem 3 --psm 6")

    # Regex: text has to be letters/numbers, with 2 or more characters
    if not re.search(r"[A-Za-z0-9]{2,}", text):
        return ""

    return text


if __name__ == "__main__":

    # 1st arg is .py file, 2nd is file to be read
    path = sys.argv[1]

    if(path.endswith(".pdf")):
        print(read_pdf(path))
    elif(path.endswith(".pptx")):
        print(read_pptx(path))
    elif(path.endswith(".docx")):
        print(read_docx(path))
    elif(path.endswith(".png") or path.endswith(".jpg") or path.endswith(".jpeg")):
        print(read_ocr_path(path))
    else:
        print("Unknown file type")

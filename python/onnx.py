from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse, HTMLResponse
from io import BytesIO
from PIL import Image, ImageDraw
import onnxruntime as ort
import numpy as np

app = FastAPI()

# Load the ONNX model
sess = ort.InferenceSession('best.onnx')

def process_image(image_bytes):
    # Convert bytes to PIL Image
    image = Image.open(BytesIO(image_bytes)).convert('RGB')
    
    # Preprocess the image as required by the model
    original_size = image.size
    image = image.resize((640, 640))
    img_arr = np.array(image).astype('float32')
    img_arr = np.transpose(img_arr, (2, 0, 1))  # Change HWC to CHW
    img_arr = img_arr / 255.0  # Normalize if required by your model
    img_arr = np.expand_dims(img_arr, axis=0)  # Add batch dimension

    # Run inference
    inputs = {sess.get_inputs()[0].name: img_arr}
    outputs = sess.run(None, inputs)
    
    image = image.resize(original_size)

    # Process the outputs
    draw = ImageDraw.Draw(image)
    for output in outputs[0][0]:
        x1, y1, x2, y2, conf, class_id = output
        if conf > 0.5:  # Confidence threshold
            # Rescale coordinates to the original image size
            x1 = int(x1 / 640 * original_size[0])
            y1 = int(y1 / 640 * original_size[1])
            x2 = int(x2 / 640 * original_size[0])
            y2 = int(y2 / 640 * original_size[1])
            draw.rectangle([x1, y1, x2, y2], outline="red", width=2)
            draw.text((x1, y1), f"Class: {int(class_id)}, Conf: {conf:.2f}", fill="red")

    return image

@app.post("/process-image/")
async def process_image_endpoint(file: UploadFile = File(...)):
    image_bytes = await file.read()
    processed_image = process_image(image_bytes)
    
    # Save processed image to a temporary buffer
    buf = BytesIO()
    processed_image.save(buf, format='PNG')
    buf.seek(0)
    
    return StreamingResponse(buf, media_type='image/png', headers={"Content-Disposition": "inline; filename=processed_image.png"})

@app.get("/")
async def main():
    with open("index.html") as f:
        return HTMLResponse(content=f.read(), status_code=200)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("onnx:app", host="0.0.0.0", port=8000, reload=True)

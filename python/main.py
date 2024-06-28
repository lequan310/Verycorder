from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from io import BytesIO
from PIL import Image, ImageDraw
import torch
import torchvision.transforms as transforms

app = FastAPI()

# Load YOLO model
model = torch.load('best.pt')  # Adjust the path to your YOLO .pt file
model.eval()  # Set the model to evaluation mode

def process_image(image_bytes):
    # Convert bytes to PIL Image
    image = Image.open(BytesIO(image_bytes)).convert('RGB')
    
    # Preprocess the image
    transform = transforms.Compose([
        transforms.Resize((640, 640)),
        transforms.ToTensor()
    ])
    image_tensor = transform(image).unsqueeze(0)  # Add batch dimension
    
    # Run inference
    with torch.no_grad():
        predictions = model(image_tensor)
    
    # Process the predictions (assuming the model returns bounding boxes and labels)
    # Drawing bounding boxes on the image
    draw = ImageDraw.Draw(image)
    for pred in predictions[0]:
        x1, y1, x2, y2, conf, cls = pred
        if conf > 0.5:  # Confidence threshold
            draw.rectangle([x1, y1, x2, y2], outline="red", width=2)
    
    return image

@app.post("/process-image/")
async def process_image_endpoint(file: UploadFile = File(...)):
    image_bytes = await file.read()
    processed_image = process_image(image_bytes)
    
    # Save processed image to a temporary buffer
    buf = BytesIO()
    processed_image.save(buf, format='PNG')
    buf.seek(0)
    
    return FileResponse(buf, media_type='image/png', filename='processed_image.png')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

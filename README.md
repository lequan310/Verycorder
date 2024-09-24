# Summary

The purpose of this project is to tackle the challenges when performing UI Testing on canvas-based web application, such as those using Flutter framework. 
The main idea is to generate a a locator that describes the visual aspect of the web element during record, and find the corresponding element during replay using the recorded visual-based locator.
The recorder utilizes 3 state-of-the-art ML models to record and replay test cases: YOLOv10, OpenAI GPT-4o, and OpenAI text-embedding-3-large.

## Record Workflow: 

![CanvasRecord drawio](https://github.com/user-attachments/assets/317f0468-9817-4389-830e-b865bafd31fa)

## Replay Workflow:

![CanvasReplay drawio](https://github.com/user-attachments/assets/7effb93d-9d81-4c25-a267-a5bc379a1a0a)


# Setup Guide

1. Clone the project

```bash
git clone https://github.com/lequan310/Verycorder.git
```

2. Install packages

```bash
npm install
```

3. Setup your .env file in the root folder
```env
OPENAI_API_KEY="Your OpenAI API Key"
```

4. Create a folder "Models" in the src folder. Place the web element detection model (best.onnx) in that folder

5. Run the application
```bash
npm start
``` 

# App Demo

[Demo](https://github.com/user-attachments/assets/321ad799-044c-4a0a-8209-29b45ee499a1)

const ort = require('onnxruntime-node');
import * as Jimp from 'jimp';
import sharp from 'sharp';
import { BoundingBox } from '../Types/bbox';

type Tensor = typeof ort.Tensor;
type InferenceSession = typeof ort.InferenceSession;

const MODEL_PATH = "./src/Models/best.onnx";

let session: InferenceSession | null = null;

export async function createOnnxSession() {
    if (!session) session = await ort.InferenceSession.create(MODEL_PATH);
    console.log("Session created");
}

export async function releaseOnnxSession() {
    await session?.release();
    session = null;
    console.log("Session released");
}

function imageBufferToTensor(imageBufferData: Buffer, dims: number[]): Tensor {
    // 1. Get buffer data from image and create R, G, and B arrays.
    const redArray = new Array<number>();
    const greenArray = new Array<number>();
    const blueArray = new Array<number>();

    // 2. Loop through the image buffer and extract the R, G, and B channels
    for (let i = 0; i < imageBufferData.length; i += 4) {
        redArray.push(imageBufferData[i]);
        greenArray.push(imageBufferData[i + 1]);
        blueArray.push(imageBufferData[i + 2]);
        // skip data[i + 3] to filter out the alpha channel
    }

    // 3. Concatenate RGB to transpose [224, 224, 3] -> [3, 224, 224] to a number array
    const transposedData = redArray.concat(greenArray).concat(blueArray);

    // create the Float32Array size 3 * 224 * 224 for these dimensions output
    const float32Data = new Float32Array(dims[1] * dims[2] * dims[3]);
    for (let i = 0; i < transposedData.length; i++) {
        float32Data[i] = transposedData[i] / 255.0; // convert to float
    }

    // 5. create the tensor object from onnxruntime-node.
    const inputTensor = new ort.Tensor("float32", float32Data, dims);
    return inputTensor;
}

export async function loadImagefromPath(path: string, width: number = 640, height: number = 640): Promise<Jimp> {
    // Use Jimp to load the image and resize it.
    var imageData = await Jimp.read(path).then((imageBuffer: Jimp) => {
        return imageBuffer.resize(width, height);
    });

    return imageData;
}

// Function to process the image
export async function processImage(imageBuffer: Buffer): Promise<Jimp> {
    // Wait for the session to be ready
    const session = await ort.InferenceSession.create(MODEL_PATH);

    const image = await Jimp.default.create(imageBuffer), originalImage = image.clone();
    const originalWidth = image.getWidth(), originalHeight = image.getHeight();

    image.resize(640, 640);
    const imageTensor = imageBufferToTensor(image.bitmap.data, [1, 3, 640, 640]);

    // Run inference
    const feeds = { [session.inputNames[0]]: imageTensor };
    const results = await session.run(feeds);
    const output = results[session.outputNames[0]].data;

    // Draw bounding boxes

    const res: BoundingBox[] = [];

    for (let i = 0; i < output.length; i += 6) {
        const x1 = output[i];
        const y1 = output[i + 1];
        const x2 = output[i + 2];
        const y2 = output[i + 3];
        const conf = output[i + 4];
        // const classId = output[i + 5];


        if (conf > 0.5) {  // Confidence threshold
            // Rescale coordinates to the original image size
            const rescaledX1 = Math.round(x1 / 640 * originalWidth);
            const rescaledY1 = Math.round(y1 / 640 * originalHeight);
            const rescaledX2 = Math.round(x2 / 640 * originalWidth);
            const rescaledY2 = Math.round(y2 / 640 * originalHeight);

            res.push({ x1: rescaledX1, y1: rescaledY1, x2: rescaledX2, y2: rescaledY2 });
        }
    }

    return res;
}

const openai = new OpenAI();

/* 
    Function to generate a caption for an image using OpenAI's GPT-4 model.
    The function takes an image buffer as input and returns a string caption aka locator.
*/
export async function getLocator(base64_image: string): Promise<string> {

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: 'Generate a single precise locator for the web element. Description should contains all information available such as text, background color, shape, etc. If there is text, write text="text". Locator format: [Element description based on visual].'
        },
        {
            role: "user",
            content: [
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/png;base64,${base64_image}`,
                        detail: "low"
                    }
                }
            ]
        }
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        seed: 0,
        messages: messages,
        max_tokens: 30, // Max number of tokens to generate locator. tokens are words, punctuation, etc. (approximately)
        temperature: 0 // 0 to 1 range, lower = more truthful => more consistent, less creative and randomness
    });

    return response.choices[0].message.content;
}

export async function drawBoxes(imageBuffer: Buffer, boundingBoxes: BoundingBox[]): Promise<Buffer> {
    const jimpImage = await Jimp.create(imageBuffer);

    let i = 1;

    //determine font size to use: 
    let imageSize = Math.min(jimpImage.bitmap.width, jimpImage.bitmap.height);
    let fontSize: string = Jimp.FONT_SANS_64_BLACK;

    // if (imageSize < 100) {
    //     fontSize = Jimp.FONT_SANS_10_BLACK;
    // } else if (imageSize < 200) {
    //     fontSize = Jimp.FONT_SANS_12_BLACK;
    // } else if (imageSize < 300) {
    //     fontSize = Jimp.FONT_SANS_14_BLACK;
    // } else if (imageSize < 400) {
    //     fontSize = Jimp.FONT_SANS_16_BLACK;
    // } else if (imageSize < 500) {
    //     fontSize = Jimp.FONT_SANS_32_BLACK;
    // } else {
    //     fontSize = Jimp.FONT_SANS_64_BLACK;
    // }

    for (let boundingBox of boundingBoxes) {
        // Draw rectangle and text
        // Draw the border of the rectangle
        var thickness = 2;

        originalImage.scan(rescaledX1, rescaledY1, rescaledX2 - rescaledX1, thickness, function (x, y, idx) { // Top border
            this.bitmap.data.writeUInt32BE(0xFF0000FF, idx);
        });
        originalImage.scan(rescaledX1, rescaledY2, rescaledX2 - rescaledX1, thickness, function (x, y, idx) { // Bottom border
            this.bitmap.data.writeUInt32BE(0xFF0000FF, idx);
        });
        originalImage.scan(rescaledX1, rescaledY1, thickness, rescaledY2 - rescaledY1, function (x, y, idx) { // Left border
            this.bitmap.data.writeUInt32BE(0xFF0000FF, idx);
        });
        originalImage.scan(rescaledX2, rescaledY1, thickness, rescaledY2 - rescaledY1, function (x, y, idx) { // Right border
            this.bitmap.data.writeUInt32BE(0xFF0000FF, idx);
        });
        // await Jimp.loadFont(Jimp.FONT_SANS_10_BLACK).then(font => {
        //     originalImage.print(font, rescaledX1, rescaledY1, `Class: ${Math.round(classId)}, Conf: ${conf.toFixed(2)}`);
        // });

        // console.log(`Class: ${Math.round(classId)}, Conf: ${conf.toFixed(2)}`);
        // console.log(`Coordinates: (${rescaledX1}, ${rescaledY1}) - (${rescaledX2}, ${rescaledY2})`);
    }
}

session.release();
return originalImage;
}

export async function getImageBuffer(imagePath: string): Promise<Buffer> {
    // Load the image
    const image = sharp(imagePath);

    // Convert image to a buffer
    const imageBuffer = await image.toBuffer();

    return imageBuffer;
}

export async function getBBoxes(imageBuffer: Buffer) {
    const startTime = performance.now();

    const image = await Jimp.default.create(imageBuffer);
    const originalWidth = image.getWidth(), originalHeight = image.getHeight();

    image.resize(640, 640);
    const imageTensor = imageBufferToTensor(image.bitmap.data, [1, 3, 640, 640]);

    // Perform inference
    const feeds = { [session.inputNames[0]]: imageTensor };
    const results = await session.run(feeds);
    const output = results[session.outputNames[0]].data;

    const bboxes: BoundingBox[] = [];
    // Draw bounding boxes
    for (let i = 0; i < output.length; i += 6) {
        const x1 = output[i];
        const y1 = output[i + 1];
        const x2 = output[i + 2];
        const y2 = output[i + 3];
        const conf = output[i + 4];
        //const classId = output[i + 5];
        if (conf > 0.4) {  // Confidence threshold
            // Rescale coordinates to the original image size
            const rescaledX1 = Math.floor(x1 / 640 * originalWidth);
            const rescaledY1 = Math.floor(y1 / 640 * originalHeight);
            const rescaledX2 = Math.ceil(x2 / 640 * originalWidth);
            const rescaledY2 = Math.ceil(y2 / 640 * originalHeight);
            const bbox = BoundingBox.createNewBBox(rescaledX1, rescaledX2, rescaledY1, rescaledY2);
            bboxes.push(bbox);
        }
    }

    const endTime = performance.now();
    const timeTaken = endTime - startTime;
    console.log(`Time taken: ${timeTaken} milliseconds`);
    return bboxes;
}
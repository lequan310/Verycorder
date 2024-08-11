const ort = require('onnxruntime-node');
import Jimp from 'jimp';
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

export async function getImageBuffer(imagePath: string): Promise<Buffer> {
    // Load the image
    const image = sharp(imagePath);

    // Convert image to a buffer
    const imageBuffer = await image.toBuffer();

    return imageBuffer;
}

export async function getBBoxes(imageBuffer: Buffer) {
    const startTime = performance.now();

    const image = await Jimp.create(imageBuffer);
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

export async function drawBoxes(imageBuffer: Buffer) {
    const boundingBoxes = await getBBoxes(imageBuffer);
    const jimpImage = await Jimp.create(imageBuffer);

    let i = 1;

    // determine font size to use: 
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
        const thickness = 2;
        const x1 = boundingBox.x;
        const x2 = boundingBox.x + boundingBox.width;
        const y1 = boundingBox.y;
        const y2 = boundingBox.y + boundingBox.height;

        jimpImage.scan(x1, y1, boundingBox.width, thickness, function (x, y, idx) { // Top border
            this.bitmap.data.writeUInt32BE(0xFF0000FF, idx);
        });
        jimpImage.scan(x1, y2, boundingBox.width, thickness, function (x, y, idx) { // Bottom border
            this.bitmap.data.writeUInt32BE(0xFF0000FF, idx);
        });
        jimpImage.scan(x1, y1, thickness, boundingBox.height, function (x, y, idx) { // Left border
            this.bitmap.data.writeUInt32BE(0xFF0000FF, idx);
        });
        jimpImage.scan(x2, y1, thickness, boundingBox.height, function (x, y, idx) { // Right border
            this.bitmap.data.writeUInt32BE(0xFF0000FF, idx);
        });

        await Jimp.loadFont(fontSize).then(font => {
            const textLabel = `${i}`;

            const measureTextWidth = Jimp.measureText(font, textLabel);
            const measureTextHeight = Jimp.measureTextHeight(font, textLabel, measureTextWidth);

            let textImage = new Jimp(measureTextWidth, measureTextHeight, 0x0);

            textImage.print(font, 0, 0, textLabel);

            textImage.scan(0, 0, textImage.bitmap.width, textImage.bitmap.height, function (x, y, idx) {
                // Get the original color values
                const red = this.bitmap.data[idx + 0];
                const green = this.bitmap.data[idx + 1];
                const blue = this.bitmap.data[idx + 2];

                // Apply XOR operation with 0xFF (255) to invert the color
                this.bitmap.data[idx + 0] = red ^ 0xFF;
                this.bitmap.data[idx + 1] = green ^ 0x00;
                this.bitmap.data[idx + 2] = blue ^ 0x00;
            });

            jimpImage.blit(textImage, x1, y1 - 22);
        });

        i++;
    }

    return { buffer: await jimpImage.getBufferAsync(Jimp.MIME_PNG), bboxes: boundingBoxes };
};
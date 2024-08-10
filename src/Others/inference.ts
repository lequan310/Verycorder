const ort = require('onnxruntime-node');

import Jimp from 'jimp';
import OpenAI from "openai";
import { text } from 'stream/consumers';

// Load ONNX model

type Tensor = typeof ort.Tensor;

function imageBufferToTensor(imageBufferData: Buffer, dims: number[]): Tensor {
    // 1. Get buffer data from image and create R, G, and B arrays.
    const [redArray, greenArray, blueArray] = new Array(new Array<number>(), new Array<number>(), new Array<number>());

    // 2. Loop through the image buffer and extract the R, G, and B channels
    for (let i = 0; i < imageBufferData.length; i += 4) {
        redArray.push(imageBufferData[i]);
        greenArray.push(imageBufferData[i + 1]);
        blueArray.push(imageBufferData[i + 2]);
        // skip data[i + 3] to filter out the alpha channel
    }

    // 3. Concatenate RGB to transpose [224, 224, 3] -> [3, 224, 224] to a number array
    const transposedData = redArray.concat(greenArray).concat(blueArray);

    // 4. convert to float32
    let i, l = transposedData.length; // length, we need this for the loop
    // create the Float32Array size 3 * 224 * 224 for these dimensions output
    const float32Data = new Float32Array(dims[1] * dims[2] * dims[3]);
    for (i = 0; i < l; i++) {
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

export type BoundingBox = {
    x1: number,
    y1: number,
    x2: number,
    y2: number,
};


// Function to process the image
export async function getBoundingBoxes(imageBuffer: Buffer, modelPath: string = "src/Models/best.onnx"): Promise<BoundingBox[]> {
    // Wait for the session to be ready
    const session = await ort.InferenceSession.create(modelPath);

    const image = await Jimp.create(imageBuffer);

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
        max_tokens:30, // Max number of tokens to generate locator. tokens are words, punctuation, etc. (approximately)
        temperature:0 // 0 to 1 range, lower = more truthful => more consistent, less creative and randomness
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

        jimpImage.scan(boundingBox.x1, boundingBox.y1, boundingBox.x2 - boundingBox.x1, thickness, function (x, y, idx) { // Top border
            this.bitmap.data.writeUInt32BE(0xFF0000FF, idx);
        });
        jimpImage.scan(boundingBox.x1, boundingBox.y2, boundingBox.x2 - boundingBox.x1, thickness, function (x, y, idx) { // Bottom border
            this.bitmap.data.writeUInt32BE(0xFF0000FF, idx);
        });
        jimpImage.scan(boundingBox.x1, boundingBox.y1, thickness, boundingBox.y2 - boundingBox.y1, function (x, y, idx) { // Left border
            this.bitmap.data.writeUInt32BE(0xFF0000FF, idx);
        });
        jimpImage.scan(boundingBox.x2, boundingBox.y1, thickness, boundingBox.y2 - boundingBox.y1, function (x, y, idx) { // Right border
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

            jimpImage.blit(textImage, boundingBox.x1, boundingBox.y1 - 22)
        });

        i++;
    }

    return await jimpImage.getBufferAsync(Jimp.MIME_PNG);
};

export type Position = {
    x: number,
    y: number,
    idx: number
};

export async function identifyElement(imageBuffer: Buffer, locator: string): Promise<Position> {
    const boundingBoxes = await getBoundingBoxes(imageBuffer);

    const boxedImageBuffer = await drawBoxes(imageBuffer, boundingBoxes);

    const base64_image = boxedImageBuffer.toString('base64');

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: `You are provided a screenshot of a web page with bounding boxes around the web elements and the index number on the top left of the corresponding bounding box. Which bounding box corresponds to the description ${locator}? Provide only a single index number as the answer or -1 if no box fits the description.`,
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
                },
            ]
        }
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        seed: 0,
        messages: messages,
        max_tokens:30, // Max number of tokens to generate locator. tokens are words, punctuation, etc. (approximately)
        temperature:0 // 0 to 1 range, lower = more truthful => more consistent, less creative and randomness
    });

    const answer = response.choices[0].message.content;

    let index = -1;
    try {
        index = parseInt(answer);
    } catch (e) {
        console.log(e);
    }

    return index === -1 ? { x: -1, y: -1, idx: -1 } : { x: (boundingBoxes[index].x1 + boundingBoxes[index].x2) / 2, y: (boundingBoxes[index].y1 + boundingBoxes[index].y2) / 2, idx: index };
}

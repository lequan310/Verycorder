const ort = require('onnxruntime-node');
import * as Jimp from 'jimp';

// Load ONNX model
const sessionPromise = ort.InferenceSession.create(__dirname + '/model.onnx');

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

export async function loadImagefromPath(path: string, width: number = 640, height: number = 640): Promise<[Jimp, number, number]> {
    // Use Jimp to load the image and resize it.
    var imageData = await Jimp.default.read(path).then((imageBuffer: Jimp) => {
        var originalWidth = imageBuffer.getWidth(), originalHeight = imageBuffer.getHeight();
        return [imageBuffer.resize(width, height), originalWidth, originalHeight] as [Jimp, number, number];
    });

    return imageData;
}


// Function to process the image
export async function processImage(imageBuffer: Buffer): Promise<Jimp> {
    // Wait for the session to be ready
    const session = await sessionPromise;

    const image = await Jimp.default.create(imageBuffer), originalImage = image.clone();
    const originalWidth = image.getWidth(), originalHeight = image.getHeight();

    image.resize(640, 640);
    const imageTensor = imageBufferToTensor(image.bitmap.data, [1, 3, 640, 640]);

    // Run inference
    const feeds = { [session.inputNames[0]]: imageTensor };
    const results = await session.run(feeds);
    const output = results[session.outputNames[0]].data;

    // Draw bounding boxes
    for (let i = 0; i < output.length; i += 6) {
        const x1 = output[i];
        const y1 = output[i + 1];
        const x2 = output[i + 2];
        const y2 = output[i + 3];
        const conf = output[i + 4];
        const classId = output[i + 5];
        if (conf > 0.5) {  // Confidence threshold
            // Rescale coordinates to the original image size
            const rescaledX1 = Math.round(x1 / 640 * originalWidth);
            const rescaledY1 = Math.round(y1 / 640 * originalHeight);
            const rescaledX2 = Math.round(x2 / 640 * originalWidth);
            const rescaledY2 = Math.round(y2 / 640 * originalHeight);

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
            await Jimp.loadFont(Jimp.FONT_SANS_12_BLACK).then(font => {
                originalImage.print(font, rescaledX1 - 20, rescaledY1, `Class: ${Math.round(classId)}, Conf: ${conf.toFixed(2)}`);
            });

            // console.log(`Class: ${Math.round(classId)}, Conf: ${conf.toFixed(2)}`);
            // console.log(`Coordinates: (${rescaledX1}, ${rescaledY1}) - (${rescaledX2}, ${rescaledY2})`);
        }
    }

    return originalImage;
}

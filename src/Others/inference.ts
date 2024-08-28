import * as ort from "onnxruntime-node";
import Jimp from "jimp";
import sharp from "sharp";
import { BoundingBox } from "../Types/bbox";

const MODEL_PATH = "./src/Models/best.onnx";

let session: ort.InferenceSession | null = null;

export async function createOnnxSession(modelPath = MODEL_PATH) {
  if (!session) session = await ort.InferenceSession.create(modelPath);
  console.log("Session created");
}

export async function releaseOnnxSession() {
  await session?.release();
  session = null;
  console.log("Session released");
}

function imageBufferToTensor(imageBufferData: Buffer, dims: number[]): ort.Tensor {
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

export async function loadImagefromPath(
  path: string,
  width: number = 640,
  height: number = 640
): Promise<Jimp> {
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

export async function getBBoxes(imageBuffer: Buffer): Promise<BoundingBox[]> {
  let bboxes: BoundingBox[] = [];

  try {
    const startTime = performance.now();

    const image = await Jimp.create(imageBuffer);
    const originalWidth = image.getWidth(),
      originalHeight = image.getHeight();
    console.log(originalWidth);
    console.log(originalHeight);
    image.resize(640, 640, Jimp.RESIZE_BICUBIC);
    const imageTensor = imageBufferToTensor(
      image.bitmap.data,
      [1, 3, 640, 640]
    );

    // Perform inference
    const feeds = { [session.inputNames[0]]: imageTensor };
    const results = await session.run(feeds);
    const output = results[session.outputNames[0]].data;

    // Draw bounding boxes
    for (let i = 0; i < output.length; i += 6) {
      const x1 = Number(output[i]);
      const y1 = Number(output[i + 1]);
      const x2 = Number(output[i + 2]);
      const y2 = Number(output[i + 3]);
      const conf = Number(output[i + 4]);
      //const classId = output[i + 5];
      if (conf > 0.5) {
        // Confidence threshold
        // Rescale coordinates to the original image size
        let rescaledX1 = Math.floor((x1 / 640) * originalWidth);
        let rescaledY1 = Math.floor((y1 / 640) * originalHeight);
        let rescaledX2 = Math.ceil((x2 / 640) * originalWidth);
        let rescaledY2 = Math.ceil((y2 / 640) * originalHeight);
        if (rescaledX1 < 0) rescaledX1 = 0;
        if (rescaledY1 < 0) rescaledY1 = 0;
        if (rescaledX2 > originalWidth) rescaledX2 = originalWidth;
        if (rescaledY2 > originalHeight) rescaledY2 = originalHeight;
        const bbox = BoundingBox.createNewBBox(
          rescaledX1,
          rescaledX2,
          rescaledY1,
          rescaledY2
        );
        bbox.idx = i / 6;
        bboxes.push(bbox);
      }
    }
    const endTime = performance.now();
    const timeTaken = endTime - startTime;
    console.log(`Time taken: ${timeTaken} milliseconds`);
  } catch (error) {
    console.error(error);
  }

  for (let bbox of bboxes) {
    for (let bbox2 of bboxes) {
      if (bbox !== bbox2 && bbox.containsBbox(bbox2)) {
        ++bbox2.level;
      }
    }
  }

  return bboxes;
}

function setColor(buffer: Buffer, idx: number, colors: number[][], i: number) {
  let color = colors[i % colors.length];

  buffer[idx] = color[0];
  buffer[idx + 1] = color[1];
  buffer[idx + 2] = color[2];
}

function drawSingleBox(
  jimpImage: Jimp,
  boundingBox: BoundingBox,
  colors: number[][],
  i: number,
  thickness: number
) {
  const x1 = boundingBox.x;
  const x2 = boundingBox.x + boundingBox.width;
  const y1 = boundingBox.y;
  const y2 = boundingBox.y + boundingBox.height;

  jimpImage.scan(x1, y1, boundingBox.width, thickness, function (x, y, idx) {
    // Top border
    setColor(this.bitmap.data, idx, colors, i);
  });
  jimpImage.scan(x1, y2, boundingBox.width, thickness, function (x, y, idx) {
    // Bottom border
    setColor(this.bitmap.data, idx, colors, i);
  });
  jimpImage.scan(x1, y1, thickness, boundingBox.height, function (x, y, idx) {
    // Left border
    setColor(this.bitmap.data, idx, colors, i);
  });
  jimpImage.scan(x2, y1, thickness, boundingBox.height, function (x, y, idx) {
    // Right border
    setColor(this.bitmap.data, idx, colors, i);
  });
}

export async function drawBoxes(imageBuffer: Buffer, boundingBoxes: BoundingBox[], withPosition: boolean = false): Promise<Buffer> {
  let jimpImage = await Jimp.create(imageBuffer);

  let i = 0;

  // determine font size to use:
  const imageHeight = jimpImage.bitmap.height;
  const imageWidth = jimpImage.bitmap.width;
  const fontSize: string = Jimp.FONT_SANS_16_BLACK;

  const colors = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 0],
    [255, 0, 255],
    [0, 255, 255],
  ];

  try {
    let font = await Jimp.loadFont(fontSize);

    for (let boundingBox of boundingBoxes) {
      // Draw bounding boxes
      const thickness = 2;
      drawSingleBox(jimpImage, boundingBox, colors, i, thickness);

      // Draw text label
      let textLabel;
      if (withPosition) {
        textLabel = `${i}_${boundingBox.centerX}_${boundingBox.centerY}`;
      } else {
        textLabel = `${i}`;
      }
      const measureTextWidth = Jimp.measureText(font, textLabel);
      const measureTextHeight = Jimp.measureTextHeight(
        font,
        textLabel,
        measureTextWidth
      );
      let textImage = new Jimp(measureTextWidth, measureTextHeight, 0x0);

      textImage.print(font, 0, 0, textLabel);
      textImage.scan(
        0,
        0,
        textImage.bitmap.width,
        textImage.bitmap.height,
        function (x, y, idx) {
          setColor(this.bitmap.data, idx, colors, i);
        }
      );

      jimpImage.blit(textImage, boundingBox.x, boundingBox.y - 16);

      i++;
    }
  } catch (error) {
    console.log(error);
  }

  // Jimp.read(await jimpImage.getBufferAsync(Jimp.MIME_PNG)).then((image: Jimp) => {
  //     image.write("image" + "_output.png");
  // });
  return await jimpImage.getBufferAsync(Jimp.MIME_PNG);
}

export async function getAndDrawBoxes(imageBuffer: Buffer, withPosition: boolean = false) {
  const boundingBoxes = await getBBoxes(imageBuffer);

  let drawnBuffer = await drawBoxes(imageBuffer, boundingBoxes, withPosition);

  return {
    buffer: drawnBuffer,
    bboxes: boundingBoxes,
  };
}

export async function cropImageBuffer(imageBuffer: Buffer, bbox: BoundingBox): Promise<Buffer> {
  const croppedImageBuffer = (await Jimp.read(imageBuffer)).crop(bbox.x, bbox.y, bbox.width, bbox.height).getBufferAsync(Jimp.MIME_PNG);
  return croppedImageBuffer;
}
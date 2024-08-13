import 'dotenv/config'

import Jimp from "jimp";
import { getImageBuffer, getBBoxes, createOnnxSession, releaseOnnxSession, drawBoxes } from "./src/Others/inference";
import { BoundingBox } from "./src/Types/bbox";

// Command to run this file for testing: npx ts-node playground.ts
createOnnxSession();

const imagePath = 'image.png';
const imgName = "image";

Jimp.read(imgName + ".png").then((image: Jimp) => {
    image.getBufferAsync(Jimp.MIME_PNG).then((buffer: Buffer) => {
        drawBoxes(buffer).then((response) => {
            Jimp.read(response.buffer).then((image: Jimp) => {
                image.write(imgName + "_output.png");
                console.log("Output image saved as " + imgName + "_output.png");
            });
        });
    });
});

// getImageBuffer(imagePath).then((buffer: Buffer) => {
//     getBBoxes(buffer).then((bboxes: BoundingBox[]) => {
//         console.log(bboxes);
//     });
// });

releaseOnnxSession();

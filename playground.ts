import Jimp from "jimp";
import { processImage } from "./src/Others/inference";

const imgName = "image";
Jimp.read(imgName + ".png").then((image: Jimp) => {
    image.getBufferAsync(Jimp.MIME_PNG).then((buffer: Buffer) => {
        processImage(buffer, "./src/Models/best.onnx").then((processedImageBuffer: Jimp) => {
            processedImageBuffer.writeAsync(imgName + "-processed.png").then(() => {
                console.log("Image saved");
            });
        });
    });
});


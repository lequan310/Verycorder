import 'dotenv/config'

import Jimp from "jimp";
import { getImageBuffer, getBBoxes, createOnnxSession, releaseOnnxSession, drawBoxes } from "../Others/inference";
import * as openai from "../Others/openai"
import * as fs from "fs";
import { BoundingBox } from "../Types/bbox";

const imagePath = '../../image.png';
const imgName = "image";

type Test = {
    name: string;
    imagePath: string;
    clickPosition: { x: number, y: number };
    locator: string;
}

type Config = {
    tests: Test[];
}

function saveBuffer(buffer: Buffer, name: string) {
    fs.writeFileSync(name, buffer);
}


async function main() {
    await createOnnxSession("../Models/best.onnx");

    let config: Config;
    try {
        let response = fs.readFileSync("config.json");
        config = await JSON.parse(response.toString());
    } catch (error) {
        console.error(error);
        return;
    }

    for (let test of config.tests) {
        let outputDir = `${test.name}/output`;
        console.log("Running Test:", test.name);
        let jimpImg = await Jimp.read(test.imagePath);
        let buffer = await jimpImg.getBufferAsync(Jimp.MIME_PNG);
        let { buffer: drawnBuffer, bboxes } = await drawBoxes(buffer);
        saveBuffer(drawnBuffer, `${outputDir}/drawn.png`);
        let targetBox = null;
        for (let box of bboxes) {
            if (box.contains(test.clickPosition.x, test.clickPosition.y)) {
                targetBox = box;
                break;
            }
        }

        if (!targetBox) {
            console.error("Target box not found");
            return;
        }
        let targetBuffer = jimpImg.crop(targetBox.x, targetBox.y, targetBox.width, targetBox.height);
        let caption = await openai.getCaption(await targetBuffer.getBase64Async(Jimp.MIME_PNG));
        let result = await openai.getReplayTargetBBox(buffer, caption);
        if (result) {
            let resultImg = jimpImg.crop(result.x, result.y, result.width, result.height);
            await resultImg.write(`${outputDir}/result.png`);
        }
    }

    await releaseOnnxSession();
}

main().then(() => {
    console.log("Done");
}).catch((error) => {
    console.error(error);
});


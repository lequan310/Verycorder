import * as fs from "fs";

export function saveData(path: string, data: string | NodeJS.ArrayBufferView) {
    fs.mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
    fs.writeFileSync(path, data);
}

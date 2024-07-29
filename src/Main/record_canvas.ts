import { BoundingBox } from "../Types/bbox";

let bboxes: BoundingBox[] = [];

export function setBBoxes(bboxes: BoundingBox[]) {
    this.bboxes = bboxes;
}
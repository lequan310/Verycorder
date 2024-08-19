export class BoundingBox {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public area: number;
    public centerX: number;
    public centerY: number;

    public static createNewBBox(x1: number, x2: number, y1: number, y2: number): BoundingBox {
        const bbox = new BoundingBox();
        bbox.x = x1;
        bbox.y = y1;
        bbox.width = x2 - x1;
        bbox.height = y2 - y1;
        bbox.area = bbox.width * bbox.height;
        bbox.centerX = bbox.x + bbox.width / 2;
        bbox.centerY = bbox.y + bbox.height / 2;
        return bbox;
    }

    public static replicateBBox(boundingBox: BoundingBox): BoundingBox {
        const bbox = new BoundingBox();
        bbox.x = boundingBox.x;
        bbox.y = boundingBox.y;
        bbox.width = boundingBox.width;
        bbox.height = boundingBox.height;
        bbox.area = boundingBox.area;
        bbox.centerX = boundingBox.centerX;
        bbox.centerY = boundingBox.centerY;
        return bbox;
    }

    contains(mouseX: number, mouseY: number): boolean {
        return (mouseX >= this.x) && (mouseX <= this.x + this.width) && (mouseY >= this.y) && (mouseY <= this.y + this.height);
    }

    entered(prevMouseX: number, prevMouseY: number, mouseX: number, mouseY: number): boolean {
        return !this.contains(prevMouseX, prevMouseY) && this.contains(mouseX, mouseY);
    }

    toString(): string {
        return `BoundingBox(x: ${this.x}, y: ${this.y}, width: ${this.width}, height: ${this.height}, area: ${this.area}, centerX: ${this.centerX}, centerY: ${this.centerY})`;
    }
}

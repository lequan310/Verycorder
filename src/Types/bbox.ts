export class BoundingBox {
    public x1: number;
    public x2: number;
    public y1: number;
    public y2: number;
    public area: number;
    public centerX: number;
    public centerY: number;

    constructor(x1: number, x2: number, y1: number, y2: number) {
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
        this.area = (x2 - x1) * (y2 - y1);
        this.centerX = (x1 + x2) / 2;
        this.centerY = (y1 + y2) / 2;
    }

    contains(mouseX: number, mouseY: number): boolean {
        return mouseX >= this.x1 && mouseX <= this.x2 && mouseY >= this.y1 && mouseY <= this.y2;
    }

    entered(prevMouseX: number, prevMouseY: number, mouseX: number, mouseY: number): boolean {
        return !this.contains(prevMouseX, prevMouseY) && this.contains(mouseX, mouseY);
    }
}
export class BoundingBox {
    constructor(public x1: number, public x2: number, public y1: number, public y2: number) { }

    contains(mouseX: number, mouseY: number): boolean {
        return mouseX >= this.x1 && mouseX <= this.x2 && mouseY >= this.y1 && mouseY <= this.y2;
    }

    entered(prevMouseX: number, prevMouseY: number, mouseX: number, mouseY: number): boolean {
        return !this.contains(prevMouseX, prevMouseY) && this.contains(mouseX, mouseY);
    }
}
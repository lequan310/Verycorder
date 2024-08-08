import { CanvasEvent } from "./canvasEvent"
import { RecordedEvent } from "./recordedEvent"

export interface TestCase {
    url: string
    events: RecordedEvent[]
    size: { width: number, height: number }
}

export interface CanvasTestCase {
    url: string
    events: CanvasEvent[]
    size: { width: number, height: number }
}
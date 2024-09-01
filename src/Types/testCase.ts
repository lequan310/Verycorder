import { CanvasEvent } from "./canvasEvent"
import { RecordedEvent } from "./recordedEvent"

export interface TestCase {
    url: string
    events: RecordedEvent[]
}

export interface CanvasTestCase {
    url: string
    events: CanvasEvent[]
}
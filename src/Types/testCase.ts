import { RecordedEvent } from "./recordedEvent"

export interface TestCase {
    url: string
    events: RecordedEvent[]
    size: { width: number, height: number }
}
interface Gantt {
    title: string;
    slots: Slot[];
}
interface Slot {
    title: string;
    events: Event[];
}
interface Event {
    title: string;
    begin: string;
    end: string;
    color: string;
}
interface NormalizedTimeRange {
    begin: number;
    end: number;
    duration: number;
}
interface EventRender extends Event {
    normalized: NormalizedTimeRange;
}
interface SlotRender extends Slot {
    events: EventRender[];
    normalized: NormalizedTimeRange;
}
interface GanttRender extends Gantt {
    slots: SlotRender[];
    normalized: NormalizedTimeRange;
}
declare function convert(gantt: Gantt): GanttRender;
export { Gantt, convert };
//# sourceMappingURL=main.d.ts.map
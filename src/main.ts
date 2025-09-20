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
    normalized: NormalizedTimeRange
}

interface SlotRender extends Slot {
    events: EventRender[];
    normalized: NormalizedTimeRange
}

interface GanttRender extends Gantt {
    slots: SlotRender[];
    normalized: NormalizedTimeRange
}

declare const dayjs: any;

// use dayjs for date manipulation
// dayjs(str).unix()
function convert(gantt: Gantt): GanttRender {
    // find global begin and end
    let global_begin = Number.POSITIVE_INFINITY;
    let global_end = Number.NEGATIVE_INFINITY;
    for (const slot of gantt.slots) {
        for (const event of slot.events) {
            const begin = dayjs(event.begin).unix();
            const end = dayjs(event.end).unix();
            if (begin < global_begin) {
                global_begin = begin;
            }
            if (end > global_end) {
                global_end = end;
            }
        }
    }
    const global_duration = global_end - global_begin;

    // convert events
    const slots_render: SlotRender[] = [];
    for (const slot of gantt.slots) {
        const events_render: EventRender[] = [];
        let slot_begin = Number.POSITIVE_INFINITY;
        let slot_end = Number.NEGATIVE_INFINITY;
        for (const event of slot.events) {
            const begin = dayjs(event.begin).unix();
            const end = dayjs(event.end).unix();
            if (begin < slot_begin) {
                slot_begin = begin;
            }
            if (end > slot_end) {
                slot_end = end;
            }
            const normalized: NormalizedTimeRange = {
                begin: (begin - global_begin) / global_duration,
                end: (end - global_begin) / global_duration,
                duration: (end - begin) / global_duration,
            };
            events_render.push({
                ...event,
                normalized,
            });
        }
        const slot_duration = slot_end - slot_begin;
        const normalized: NormalizedTimeRange = {
            begin: (slot_begin - global_begin) / global_duration,
            end: (slot_end - global_begin) / global_duration,
            duration: slot_duration / global_duration,
        };
        slots_render.push({
            ...slot,
            events: events_render,
            normalized,
        });
    }

    const gantt_render: GanttRender = {
        ...gantt,
        slots: slots_render,
        normalized: {
            begin: 0,
            end: 1,
            duration: 1,
        },
    };

    return gantt_render;
}

export { Gantt , convert}
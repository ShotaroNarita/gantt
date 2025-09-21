import * as dayjs from "dayjs";

interface RangeInput {
    begin: string
    end: string
}

interface RangeUnixtime {
    begin: number
    end: number
}

interface Gantt {
    title: string
    slots: Slot[];
}

interface Slot {
    title: string
    events: Event[];
}

interface Event {
    title: string
    range: RangeInput
}

interface GanttRender {
    title: string
    slots: SlotRender[];
    range: RangeUnixtime
}

interface SlotRender {
    title: string
    events: EventRender[];
    range: RangeUnixtime
}

interface EventRender {
    title: string
    range: RangeUnixtime
}

// convert Event -> EventRender

function convert(gantt: Gantt): GanttRender {
    let gr = {} as GanttRender;
    gr.title = gantt.title;
    gr.slots = [];

    let global_begin = Number.MAX_SAFE_INTEGER;
    let global_end = Number.MIN_SAFE_INTEGER;

    for (let slot of gantt.slots) {
        let sr = {} as SlotRender;
        sr.title = slot.title;
        sr.events = [];

        let local_begin = Number.MAX_SAFE_INTEGER;
        let local_end = Number.MIN_SAFE_INTEGER;

        for (let event of slot.events) {
            const b = dayjs(event.range.begin).unix()
            const e = dayjs(event.range.end).unix()
            if (b < local_begin) local_begin = b;
            if (e > local_end) local_end = e;

            let er = {} as EventRender;
            er.title = event.title;
            er.range = { begin: b, end: e };
            sr.events.push(er);
        }

        sr.range = { begin: local_begin, end: local_end };
        gr.slots.push(sr);

        if (local_begin < global_begin) global_begin = local_begin;
        if (local_end > global_end) global_end = local_end;
    }

    gr.range = { begin: global_begin, end: global_end };

    return gr;
}

export { Gantt, Slot, Event, RangeInput };
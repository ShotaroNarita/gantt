function convert(gantt) {
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
    const slots_render = [];
    for (const slot of gantt.slots) {
        const events_render = [];
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
            const normalized = {
                begin: (begin - global_begin) / global_duration,
                end: (end - global_begin) / global_duration,
                duration: (end - begin) / global_duration,
            };
            events_render.push(Object.assign(Object.assign({}, event), { normalized }));
        }
        const slot_duration = slot_end - slot_begin;
        const normalized = {
            begin: (slot_begin - global_begin) / global_duration,
            end: (slot_end - global_begin) / global_duration,
            duration: slot_duration / global_duration,
        };
        slots_render.push(Object.assign(Object.assign({}, slot), { events: events_render, normalized }));
    }
    const gantt_render = Object.assign(Object.assign({}, gantt), { slots: slots_render, normalized: {
            begin: 0,
            end: 1,
            duration: 1,
        } });
    return gantt_render;
}
export { convert };
//# sourceMappingURL=main.js.map
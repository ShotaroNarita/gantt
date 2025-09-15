let Blocks_by_Bars = {};

class Bar {
    static ITEMS = {};

    static by_id(id) {
        return Bar.ITEMS[id];
    }

    static id_by_label(label) {
        return Object.entries(Bar.ITEMS).filter(([, item]) => item.label === label).map(([id]) => id)[0];
    }

    constructor(label) {
        // uuid
        const id = crypto.randomUUID();

        this.label = label;

        Blocks_by_Bars[id] = [];

        Bar.ITEMS[id] = this;
    }
}

class Block {
    static ITEMS = {};

    static by_id(id) {
        return Block.ITEMS[id];
    }

    static id_by_label(label) {
        return Object.entries(Block.ITEMS).filter(([, item]) => item.label === label).map(([id]) => id)[0];
    }

    constructor(begin, end, label, bar_id) {
        // uuid
        const id = crypto.randomUUID();

        // this.id = id;
        this.begin = begin;
        this.end = end;
        this.label = label;

        Block.ITEMS[id] = this;

        if((bar_id in Blocks_by_Bars) === false) {
            Blocks_by_Bars[bar_id] = [];
        }

        Blocks_by_Bars[bar_id].push(id);
    }
}

class Chart {
    bars = [];
    constructor() {

    }

    add(bar) {
        this.bars.push(bar);
    }
}


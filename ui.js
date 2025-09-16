


const write_down = () => {
    document.getElementById('bar_list').innerHTML = '';
    Object.keys(Bar.ITEMS).forEach(id => {
        bar = Bar.ITEMS[id];
        const li = document.createElement('li');
        li.textContent = `[${id}] ${bar.label}`;
        document.getElementById('bar_list').appendChild(li);
    });

    document.getElementById('block_list').innerHTML = '';
    Object.keys(Block.ITEMS).forEach(id => {
        block = Block.ITEMS[id];
        const li = document.createElement('li');
        li.textContent = `[${id}] ${block.label}`;
        // li.textContent = `[${block.id}] ${block.label} (${Bar.ITEMS[block.bar_id].label}) ${block.begin.format('YYYY-MM-DD')} - ${block.end.format('YYYY-MM-DD')}`;
        document.getElementById('block_list').appendChild(li);
    });
}

document.getElementById('bar_register').onclick = () => {
    const label = document.getElementById('bar_label');

    new Bar(label.value);
    init_bar_dropdown(label.value);

    label.value = '';

    write_down();
};

document.getElementById('block_register').onclick = () => {
    const label = document.getElementById('block_label');
    const begin = document.getElementById('block_begin');
    const end = document.getElementById('block_end');

    new Block(label.value, begin.value, end.value);

    label.value = '';
    begin.value = '';
    end.value = '';

    write_down();
};
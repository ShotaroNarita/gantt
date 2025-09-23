import { SvgConfig, Gantt, generateGanttSvg, convert } from "./gantt";
import { load } from 'js-yaml'

let config: Partial<SvgConfig> = {
    width: 1000,
    timeAxisFormat: "YYYY/MM",
    timeAxisSteps: 12,
    customRange: { begin: '2024/1/15', end: '2024/5' },
}

let svg_container: HTMLElement;
let gantt: Gantt = {
    title: "Sample Gantt Chart",
    slots: [
        {
            title: "Task 1",
            events: []
        }
    ]
};

function init() {
    console.log("init");

    svg_container = document.getElementById("svg_output") as HTMLElement;

    console.log(svg_container);

    render(svg_container, gantt, config);

    document.getElementById("render_button")?.addEventListener("click", () => {
        render(svg_container, gantt, config);
    });

    (document.getElementById("config_input") as HTMLInputElement).value = JSON.stringify(config, null, 2);

    document.getElementById("config_input")?.addEventListener("input", (event) => {
        const input = event.target as HTMLInputElement;
        console.log(input.value)
        try {
            config = JSON.parse(input.value);
            render(svg_container, gantt, config);
            // (document.getElementById("config_error") as HTMLElement).innerText = "";
        } catch (e) {
            // (document.getElementById("config_error") as HTMLElement).innerText = (e as Error).message;
        }
    })
}

window.onload = () => { init(); }

document.getElementById("file_input_button")?.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            const text = e.target?.result;
            if (typeof text === "string") {
                gantt = load(text) as Gantt;
                render(svg_container, gantt, config);
            }
        };
        reader.readAsText(file);
    }
});

function render(container: HTMLElement, gantt: Gantt, config: Partial<SvgConfig>) {
    try {
        container.innerHTML = generateGanttSvg(convert(gantt), config);
    } catch (e) {
        container.innerHTML = `<p style="color:red;">Error: ${(e as Error).message}</p>`;
    }
}
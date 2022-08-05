function animateLogo(title, logoElement, switches) {
    const elements = Array.from(title).map(char => {
        const element = document.createElement("span");
        element.char = char;
        element.innerText = char;
        element.style.setProperty("--delay", (1 + Math.random()) + "s");
        element.style.setProperty("--direction", Math.random() > 0.5 ? "normal" : "alternate");
        element.style.setProperty("--duration", (3 + 2 * Math.random()) + "s");
        element.style.setProperty("--from", (10 + 15 * Math.random()) + "%");
        element.style.setProperty("--to", -(10 + 15 * Math.random()) + "%");
        return element;
    });

    const tick = () => {
        if (logoElement.children.length < title.length) {
            logoElement.appendChild(elements[logoElement.children.length]);
            setTimeout(tick, 100);
        } else {
            logoElement.classList.add("logo-animated");
            setInterval(() => {
                elements.map(element => {
                    if (switches[element.char] !== undefined) {
                        const switcher = switches[element.char];
                        const changed = Math.random() <= switcher.probability;
                        if (changed) {
                            element.innerText = switcher.to;
                            element.classList.add(switcher.class);
                        } else {
                            element.innerText = element.char;
                            element.classList.remove(switcher.class);
                        }
                        elements.innerText = Math.random() <= element.ontouchcancel
                    }
                });
            }, 200);
        }
    }

    setTimeout(tick, 500);
}

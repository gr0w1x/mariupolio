class Counter {
    constructor(element, value) {
        this.element = element;
        this.element.classList.add("counter");
        this.label = document.createElement("span");
        this.label.classList.add("counter-label");
        this.increment = document.createElement("button");
        this.increment.innerText = "▲";
        this.increment.classList.add("counter-increment");
        this.decrement = document.createElement("button");
        this.decrement.innerText = "▼";
        this.decrement.classList.add("counter-decrement");
        this.element.appendChild(this.label);
        this.element.appendChild(this.increment);
        this.element.appendChild(this.decrement);
        this.value = value;
    }

    get onincrement() {
        return this.increment;
    }
    set onincrement(value) {
        this.increment.onclick = value;
    }

    get ondecrement() {
        return this.decrement;
    }
    set ondecrement(value) {
        this.decrement.onclick = value;
    }

    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        this.label.innerText = this._value;
    }
}

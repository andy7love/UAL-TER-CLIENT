/// <reference path="../../typings/globals/baconjs/index.d.ts" />

interface StateError {
    error: string;
}

export class StateProperty<StateValue> {
    private lastValue: StateValue;
    private bus: Bacon.Bus<StateError, StateValue>;
    private property: Bacon.Property<StateError, StateValue>;

    constructor (initialValue: StateValue) {
        this.bus = new Bacon.Bus();
        this.property = this.bus.toProperty(initialValue);
        this.property.onValue((newValue: StateValue) => {
            this.lastValue = newValue;
        });
    }

    public setValue(newValue: StateValue) {
        this.bus.push(newValue);
    }

    public getValue(): StateValue {
        return this.lastValue;
    }

    public getStream(): Bacon.Property<StateError, StateValue> {
        return this.property;
    }
}
import * as Bacon from 'baconjs';

interface IStateError {
	error: string;
}

export class StateProperty<StateValue> {
	private lastValue: StateValue;
	private bus: Bacon.Bus<IStateError, StateValue>;
	private property: Bacon.Property<IStateError, StateValue>;

	constructor(initialValue: StateValue) {
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

	public getStream(): Bacon.Property<IStateError, StateValue> {
		return this.property;
	}
}

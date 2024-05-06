﻿import type { GesturesObserver as GesturesObserverDefinition } from '.';
import type { View } from '../core/view';
import type { EventData } from '../../data/observable';

export * from './touch-manager';

/**
 * Events emitted during gesture lifecycle
 */
export enum GestureEvents {
	/**
	 * When the gesture is attached to the view
	 * Provides access to the native gesture recognizer for further customization
	 */
	gestureAttached = 'gestureAttached',
	/**
	 * When a touch down was detected
	 */
	touchDown = 'touchDown',
	/**
	 * When a touch up was detected
	 */
	touchUp = 'touchUp',
}

/**
 * Defines an enum with supported gesture types.
 */
export enum GestureTypes {
	/**
	 * Denotes tap (click) gesture.
	 */
	tap = 1 << 0,
	/**
	 * Denotes double tap gesture.
	 */
	doubleTap = 1 << 1,
	/**
	 * Denotes pinch gesture.
	 */
	pinch = 1 << 2,
	/**
	 * Denotes pan gesture.
	 */
	pan = 1 << 3,
	/**
	 * Denotes swipe gesture.
	 */
	swipe = 1 << 4,
	/**
	 * Denotes rotation gesture.
	 */
	rotation = 1 << 5,
	/**
	 * Denotes long press gesture.
	 */
	longPress = 1 << 6,
	/**
	 * Denotes touch action.
	 */
	touch = 1 << 7,
}

/**
 * Defines an enum with supported gesture states.
 */
export enum GestureStateTypes {
	/**
	 * Gesture canceled.
	 */
	cancelled,
	/**
	 * Gesture began.
	 */
	began,
	/**
	 * Gesture changed.
	 */
	changed,
	/**
	 * Gesture ended.
	 */
	ended,
}

/**
 * Defines an enum for swipe gesture direction.
 */
export enum SwipeDirection {
	/**
	 * Denotes right direction for swipe gesture.
	 */
	right = 1 << 0,
	/**
	 * Denotes left direction for swipe gesture.
	 */
	left = 1 << 1,
	/**
	 * Denotes up direction for swipe gesture.
	 */
	up = 1 << 2,
	/**
	 * Denotes down direction for swipe gesture.
	 */
	down = 1 << 3,
}

/**
 * Defines a touch action
 */
export enum TouchAction {
	/**
	 * Down action.
	 */
	down = 'down',

	/**
	 * Up action.
	 */
	up = 'up',

	/**
	 * Move action.
	 */
	move = 'move',

	/**
	 * Cancel action.
	 */
	cancel = 'cancel',
}

/**
 * Provides gesture event data.
 */
export interface GestureEventData extends EventData {
	/**
	 * Gets the type of the gesture.
	 */
	type: GestureTypes;
	/**
	 * Gets the view which originates the gesture.
	 */
	view: View;
	/**
	 * Gets the underlying native iOS specific [UIGestureRecognizer](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIGestureRecognizer_Class/).
	 */
	ios: any /* UIGestureRecognizer */;
	/**
	 * Gets the underlying native android specific [gesture detector](http://developer.android.com/reference/android/view/GestureDetector.html).
	 */
	android: any;
}

/**
 * Provides gesture event data.
 */
export interface TapGestureEventData extends GestureEventData {
	/**
	 * Gets the number of pointers in the event.
	 */
	getPointerCount(): number;
	/**
	 * Gets the X coordinate of this event inside the view that triggered the event
	 */
	getX(): number;
	/**
	 * Gets the Y coordinate of the event inside the view that triggered the event.
	 */
	getY(): number;
}

/**
 * Provides gesture event data.
 */
export interface TouchGestureEventData extends TapGestureEventData {
	/**
	 * Gets action of the touch. Possible values: 'up', 'move', 'down', 'cancel'
	 */
	action: 'up' | 'move' | 'down' | 'cancel';
	/**
	 * Gets the pointers that triggered the event.
	 * Note: In Android there is aways only one active pointer.
	 */
	getActivePointers(): Array<Pointer>;

	/**
	 * Gets all pointers.
	 */
	getAllPointers(): Array<Pointer>;
}

/**
 * Pointer is an object representing a finger (or other object) that is touching the screen.
 */
export interface Pointer {
	/**
	 * The id of the pointer.
	 */
	android: any;

	/**
	 * The UITouch object associated to the touch
	 */
	ios: any;

	/**
	 * Gets the X coordinate of the pointer inside the view that triggered the event.
	 */
	getX(): number;

	/**
	 * Gets the Y coordinate of the pointer inside the view that triggered the event.
	 */
	getY(): number;

	/**
	 * Gests the X coordinate of the pointer inside the view that triggered the event.
	 * @returns The X coordinate in _Device Pixels_.
	 */
	getXPixels(): number;

	/**
	 * Gets the X coordinate of the pointer inside the view that triggered the event.
	 * @returns The X coordinate in _Device Independent Pixels_.
	 */
	getXDIP(): number;

	/**
	 * Gests the Y coordinate of the pointer inside the view that triggered the event.
	 * @returns The Y coordinate in _Device Pixels_.
	 */
	getYPixels(): number;

	/**
	 * Gets the Y coordinate of the pointer inside the view that triggered the event.
	 * @returns The Y coordinate in _Device Independent Pixels_.
	 */
	getYDIP(): number;
}

/**
 * Provides gesture event data.
 */
export interface GestureEventDataWithState extends GestureEventData {
	state: number;
}

/**
 * Provides gesture event data for pinch gesture.
 */
export interface PinchGestureEventData extends GestureEventDataWithState {
	scale: number;

	getFocusX(): number;
	getFocusY(): number;
}

/**
 * Provides gesture event data for swipe gesture.
 */
export interface SwipeGestureEventData extends GestureEventData {
	direction: SwipeDirection;
}

/**
 * Provides gesture event data for pan gesture.
 */
export interface PanGestureEventData extends GestureEventDataWithState {
	deltaX: number;
	deltaY: number;
}

/**
 * Provides gesture event data for rotation gesture.
 */
export interface RotationGestureEventData extends GestureEventDataWithState {
	rotation: number;
}

/**
 * Returns a string representation of a gesture type.
 * @param type - Type of the gesture.
 * @param separator(optional) - Text separator between gesture type strings.
 */
export function toString(type: GestureTypes, separator?: string): string {
	// We can get stronger typings with `keyof typeof GestureTypes`, but sadly
	// indexing into an enum simply returns `string`, so we'd have to type-assert
	// all of the below anyway. Even this `(typeof GestureTypes)[GestureTypes]` is
	// more for documentation than for type-safety (it resolves to `string`, too).
	const types = new Array<(typeof GestureTypes)[GestureTypes]>();

	if (type & GestureTypes.tap) {
		types.push(GestureTypes[GestureTypes.tap]);
	}

	if (type & GestureTypes.doubleTap) {
		types.push(GestureTypes[GestureTypes.doubleTap]);
	}

	if (type & GestureTypes.pinch) {
		types.push(GestureTypes[GestureTypes.pinch]);
	}

	if (type & GestureTypes.pan) {
		types.push(GestureTypes[GestureTypes.pan]);
	}

	if (type & GestureTypes.swipe) {
		types.push(GestureTypes[GestureTypes.swipe]);
	}

	if (type & GestureTypes.rotation) {
		types.push(GestureTypes[GestureTypes.rotation]);
	}

	if (type & GestureTypes.longPress) {
		types.push(GestureTypes[GestureTypes.longPress]);
	}

	if (type & GestureTypes.touch) {
		types.push(GestureTypes[GestureTypes.touch]);
	}

	return types.join(separator);
}

// NOTE: toString could return the text of multiple GestureTypes.
// Souldn't fromString do split on separator and return multiple GestureTypes?
/**
 * Returns a gesture type enum value from a string (case insensitive).
 * @param type - A string representation of a gesture type (e.g. Tap).
 */
export function fromString(type: string): GestureTypes | undefined {
	return GestureTypes[type.trim()];
}

export abstract class GesturesObserverBase implements GesturesObserverDefinition {
	private _callback: (args: GestureEventData) => void;
	private _target: View;
	private _context: any;

	public type: GestureTypes;

	public get callback(): (args: GestureEventData) => void {
		return this._callback;
	}

	public get target(): View {
		return this._target;
	}

	public get context() {
		return this._context;
	}

	constructor(target: View, callback: (args: GestureEventData) => void, context: any) {
		this._target = target;
		this._callback = callback;
		this._context = context;
	}

	public abstract androidOnTouchEvent(motionEvent: android.view.MotionEvent);
	public abstract observe(type: GestureTypes);

	public disconnect() {
		// remove gesture observer from map
		if (this.target) {
			const list = this.target.getGestureObservers(this.type);
			if (list && list.length > 0) {
				for (let i = 0; i < list.length; i++) {
					if (list[i].callback === this.callback) {
						break;
					}
				}
				list.length = 0;

				this.target._gestureObservers[this.type] = undefined;
				delete this.target._gestureObservers[this.type];
			}
		}
		this._target = null;
		this._callback = null;
		this._context = null;
	}
}

///<reference path="../reference.ts" />

module Plottable {
export module Dispatchers {
  export type TouchCallback = (ids: number[], idToPoint: { [id: number]: Point; }, e: TouchEvent) => any;

  export class Touch extends Dispatcher {
    /**
     * Dispatcher.Touch calls callbacks when touch events occur.
     * It reports the (x, y) position of the first Touch relative to the
     * <svg> it is attached to.
     */

    private static _DISPATCHER_KEY = "__Plottable_Dispatcher_Touch";
    private translator: Utils.ClientToSVGTranslator;
    private _startCallbackSet: Utils.CallbackSet<Function>;
    private _moveCallbackSet: Utils.CallbackSet<Function>;
    private _endCallbackSet: Utils.CallbackSet<Function>;

    /**
     * Get a Dispatcher.Touch for the <svg> containing elem. If one already exists
     * on that <svg>, it will be returned; otherwise, a new one will be created.
     *
     * @param {SVGElement} elem A svg DOM element.
     * @return {Dispatcher.Touch} A Dispatcher.Touch
     */
    public static getDispatcher(elem: SVGElement): Dispatchers.Touch {
      var svg = Utils.DOM.getBoundingSVG(elem);

      var dispatcher: Touch = (<any> svg)[Touch._DISPATCHER_KEY];
      if (dispatcher == null) {
        dispatcher = new Touch(svg);
        (<any> svg)[Touch._DISPATCHER_KEY] = dispatcher;
      }
      return dispatcher;
    }

    /**
     * Creates a Dispatcher.Touch.
     * This constructor should not be invoked directly under most circumstances.
     *
     * @param {SVGElement} svg The root <svg> element to attach to.
     */
    constructor(svg: SVGElement) {
      super();

      this.translator = Utils.ClientToSVGTranslator.getTranslator(svg);

      this._startCallbackSet = new Utils.CallbackSet();
      this._moveCallbackSet = new Utils.CallbackSet();
      this._endCallbackSet = new Utils.CallbackSet();
      this._callbackSets = [this._moveCallbackSet, this._startCallbackSet, this._endCallbackSet];

      this._event2Callback["touchstart"] = (e: TouchEvent) => this._measureAndBroadcast(e, this._startCallbackSet);
      this._event2Callback["touchmove"] = (e: TouchEvent) => this._measureAndBroadcast(e, this._moveCallbackSet);
      this._event2Callback["touchend"] = (e: TouchEvent) => this._measureAndBroadcast(e, this._endCallbackSet);
    }

    /**
     * Registers a callback to be called whenever a touch starts,
     * or removes the callback if `null` is passed as the callback.
     *
     * @param {any} key The key associated with the callback.
     *                  Key uniqueness is determined by deep equality.
     * @param {TouchCallback} callback A callback that takes the pixel position
     *                                     in svg-coordinate-space. Pass `null`
     *                                     to remove a callback.
     * @return {Dispatcher.Touch} The calling Dispatcher.Touch.
     */
    public onTouchStart(key: any, callback: TouchCallback): Dispatchers.Touch {
      this._setCallback(this._startCallbackSet, callback);
      return this;
    }

    public offTouchStart(key: any, callback: TouchCallback): Dispatchers.Touch {
      this._unsetCallback(this._startCallbackSet, callback);
      return this;
    }

    /**
     * Registers a callback to be called whenever the touch position changes,
     * or removes the callback if `null` is passed as the callback.
     *
     * @param {any} key The key associated with the callback.
     *                  Key uniqueness is determined by deep equality.
     * @param {TouchCallback} callback A callback that takes the pixel position
     *                                     in svg-coordinate-space. Pass `null`
     *                                     to remove a callback.
     * @return {Dispatcher.Touch} The calling Dispatcher.Touch.
     */
    public onTouchMove(key: any, callback: TouchCallback): Dispatchers.Touch {
      this._setCallback(this._moveCallbackSet, callback);
      return this;
    }

    public offTouchMove(key: any, callback: TouchCallback): Dispatchers.Touch {
      this._unsetCallback(this._moveCallbackSet, callback);
      return this;
    }

    /**
     * Registers a callback to be called whenever a touch ends,
     * or removes the callback if `null` is passed as the callback.
     *
     * @param {any} key The key associated with the callback.
     *                  Key uniqueness is determined by deep equality.
     * @param {TouchCallback} callback A callback that takes the pixel position
     *                                     in svg-coordinate-space. Pass `null`
     *                                     to remove a callback.
     * @return {Dispatcher.Touch} The calling Dispatcher.Touch.
     */
    public onTouchEnd(key: any, callback: TouchCallback): Dispatchers.Touch {
      this._setCallback(this._endCallbackSet, callback);
      return this;
    }

    public offTouchEnd(key: any, callback: TouchCallback): Dispatchers.Touch {
      this._unsetCallback(this._endCallbackSet, callback);
      return this;
    }

    /**
     * Computes the Touch position from the given event, and if successful
     * calls broadcast() on the supplied Broadcaster.
     */
    private _measureAndBroadcast(e: TouchEvent, callbackSet: Utils.CallbackSet<Function>) {
      var touches = e.changedTouches;
      var touchPositions: { [id: number]: Point; } = {};
      var touchIdentifiers: number[] = [];
      for (var i = 0; i < touches.length; i++) {
        var touch = touches[i];
        var touchID = touch.identifier;
        var newTouchPosition = this.translator.computePosition(touch.clientX, touch.clientY);
        if (newTouchPosition != null) {
          touchPositions[touchID] = newTouchPosition;
          touchIdentifiers.push(touchID);
        }
      };
      if (touchIdentifiers.length > 0) {
        callbackSet.callCallbacks(touchIdentifiers, touchPositions, e);
      }
    }
  }
}
}

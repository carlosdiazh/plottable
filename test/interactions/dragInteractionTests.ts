///<reference path="../testReference.ts" />

describe("Interactions", () => {
  describe("Drag Interaction", () => {
    const SVG_WIDTH = 400;
    const SVG_HEIGHT = 400;

    const startPoint = {
      x: SVG_WIDTH / 4,
      y: SVG_HEIGHT / 4
    };
    const endPoint = {
      x: SVG_WIDTH / 2,
      y: SVG_HEIGHT / 2
    };
    const positiveOutsidePoint = {
      x: SVG_WIDTH * 1.5,
      y: SVG_HEIGHT * 1.5
    };
    const negativeOutsidePoint = {
      x: -SVG_WIDTH / 2,
      y: -SVG_HEIGHT / 2
    };

    let svg: d3.Selection<void>;
    let component: Plottable.Component;
    let dragInteraction: Plottable.Interactions.Drag;

    type DragTestCallback = {
      lastStartPoint: Plottable.Point;
      lastEndPoint: Plottable.Point;
      called: boolean;
      reset: () => void;
      (startPoint: Plottable.Point, endPoint: Plottable.Point): void;
    }

    function makeDragCallback() {
      let callback = <DragTestCallback> function(startPoint: Plottable.Point, endPoint: Plottable.Point) {
        callback.lastStartPoint = startPoint;
        callback.lastEndPoint = endPoint;
        callback.called = true;
      };
      callback.called = false;
      callback.reset = () => {
        callback.lastStartPoint = undefined;
        callback.lastStartPoint = undefined;
        callback.called = false;
      };
      return callback;
    }

    function triggerFakeDragStart(point: Plottable.Point,
                                  mode: TestMethods.InteractionMode = TestMethods.InteractionMode.Mouse) {
      TestMethods.triggerFakeInteractionEvent(mode, TestMethods.InteractionType.Start, component.background(), point.x, point.y);
    }

    function triggerFakeDragMove(startPoint: Plottable.Point,
                                 endPoint: Plottable.Point,
                                 mode: TestMethods.InteractionMode = TestMethods.InteractionMode.Mouse) {
      TestMethods.triggerFakeInteractionEvent(mode, TestMethods.InteractionType.Start, component.background(), startPoint.x, startPoint.y);
      TestMethods.triggerFakeInteractionEvent(mode, TestMethods.InteractionType.Move, component.background(), endPoint.x, endPoint.y);
    }

    function triggerFakeDragEnd(startPoint: Plottable.Point,
                                endPoint: Plottable.Point,
                                mode: TestMethods.InteractionMode = TestMethods.InteractionMode.Mouse) {
      TestMethods.triggerFakeInteractionEvent(mode, TestMethods.InteractionType.Start, component.background(), startPoint.x, startPoint.y);
      TestMethods.triggerFakeInteractionEvent(mode, TestMethods.InteractionType.End, component.background(), endPoint.x, endPoint.y);
    }

    beforeEach(() => {
      svg = TestMethods.generateSVG(SVG_WIDTH, SVG_HEIGHT);
      component = new Plottable.Component();
      component.renderTo(svg);

      dragInteraction = new Plottable.Interactions.Drag();
      dragInteraction.attachTo(component);
    });

    afterEach(function() {
      if (this.currentTest.state === "passed") {
        svg.remove();
      }
    });

    describe("onDragStart/offDragStart", () => {
      describe("registration", () => {
        it("registers callback using onDragStart", () => {
          const callback = makeDragCallback();
          assert.strictEqual(dragInteraction.onDragStart(callback), dragInteraction, "registration returns the calling Interaction");

          triggerFakeDragStart(startPoint);
          assert.isTrue(callback.called, "Interaction should trigger the callback");
        });

        it("deregisters callback using offDragStart", () => {
          const callback = makeDragCallback();
          dragInteraction.onDragStart(callback);
          assert.strictEqual(dragInteraction.offDragStart(callback), dragInteraction, "deregistration returns the calling Interaction");

          triggerFakeDragStart(startPoint);
          assert.isFalse(callback.called, "Callback should be disconnected from the interaction");
        });

        it("can register multiple onDragStart callbacks", () => {
          const callback1 = makeDragCallback();
          const callback2 = makeDragCallback();
          dragInteraction.onDragStart(callback1);
          dragInteraction.onDragStart(callback2);

          triggerFakeDragStart(startPoint);
          assert.isTrue(callback1.called, "Interaction should trigger the first callback");
          assert.isTrue(callback2.called, "Interaction should trigger the second callback");
        });

        it("can deregister an onDragStart callback without affecting the other ones", () => {
          const callback1 = makeDragCallback();
          const callback2 = makeDragCallback();
          dragInteraction.onDragStart(callback1);
          dragInteraction.onDragStart(callback2);
          dragInteraction.offDragStart(callback1);

          triggerFakeDragStart(startPoint);
          assert.isFalse(callback1.called, "Callback1 should be disconnected from the click interaction");
          assert.isTrue(callback2.called, "Callback2 should still exist on the click interaction");
        });
      });

      [TestMethods.InteractionMode.Mouse, TestMethods.InteractionMode.Touch].forEach((mode) => {
        describe(`invoking with ${TestMethods.InteractionMode[mode]} events`, () => {
          let callback: DragTestCallback;

          beforeEach(() => {
            callback = makeDragCallback();
            dragInteraction.onDragStart(callback);
          });

          it("invokes onDragStart callback on start event", () => {
            triggerFakeDragStart(startPoint, mode);
            assert.isTrue(callback.called, "callback was called on beginning drag");
            assert.deepEqual(callback.lastStartPoint, startPoint, "was passed the correct point");
          });

          it("does not invoke callback if drag starts outside Component", () => {
            triggerFakeDragStart(positiveOutsidePoint, mode);
            assert.isFalse(callback.called, "does not trigger callback if drag starts outside the Component (positive)");
            triggerFakeDragStart(negativeOutsidePoint, mode);
            assert.isFalse(callback.called, "does not trigger callback if drag starts outside the Component (negative)");
          });

          if (mode === TestMethods.InteractionMode.Mouse) {
            it("does not invoke onDragStart on right click", () => {
              TestMethods.triggerFakeMouseEvent("mousedown", component.background(), startPoint.x, startPoint.y, 2);
              assert.isFalse(callback.called, "callback is not called on right-click");
            });
          }
        });
      });
    });

    describe("onDrag/offDrag", () => {
      describe("registration", () => {
        it("registers callback using onDrag", () => {
          const callback = makeDragCallback();
          assert.strictEqual(dragInteraction.onDrag(callback), dragInteraction, "registration returns the calling Interaction");

          triggerFakeDragMove(startPoint, endPoint);
          assert.isTrue(callback.called, "Interaction should trigger the callback");
        });

        it("deregisters callback using offDrag", () => {
          const callback = makeDragCallback();
          dragInteraction.onDrag(callback);
          assert.strictEqual(dragInteraction.offDrag(callback), dragInteraction, "deregistration returns the calling Interaction");

          triggerFakeDragMove(startPoint, endPoint);
          assert.isFalse(callback.called, "Callback should be disconnected from the interaction");
        });

        it("can register multiple onDrag callbacks", () => {
          const callback1 = makeDragCallback();
          const callback2 = makeDragCallback();
          dragInteraction.onDrag(callback1);
          dragInteraction.onDrag(callback2);

          triggerFakeDragMove(startPoint, endPoint);
          assert.isTrue(callback1.called, "Interaction should trigger the first callback");
          assert.isTrue(callback2.called, "Interaction should trigger the second callback");
        });

        it("can deregister an onDrag callback without affecting the other ones", () => {
          const callback1 = makeDragCallback();
          const callback2 = makeDragCallback();
          dragInteraction.onDrag(callback1);
          dragInteraction.onDrag(callback2);
          dragInteraction.offDrag(callback1);

          triggerFakeDragMove(startPoint, endPoint);
          assert.isFalse(callback1.called, "Callback1 should be disconnected from the click interaction");
          assert.isTrue(callback2.called, "Callback2 should still exist on the click interaction");
        });
      });

      describe("invoking", () => {
        let callback: DragTestCallback;

        beforeEach(() => {
          callback = makeDragCallback();
          dragInteraction.onDrag(callback);
        });

        [TestMethods.InteractionMode.Mouse, TestMethods.InteractionMode.Touch].forEach((mode: TestMethods.InteractionMode) => {
          it("passes correct start and end point on drag for " + TestMethods.InteractionMode[mode], () => {
            triggerFakeDragMove(startPoint, endPoint);
            assert.isTrue(callback.called, "callback was called on dragging");
            assert.deepEqual(callback.lastStartPoint, startPoint, "was passed the correct starting point");
            assert.deepEqual(callback.lastEndPoint, endPoint, "was passed the correct current point");
          });
        });

        it("does not continue dragging once the touch is cancelled", () => {
          const callback = makeDragCallback();
          dragInteraction.onDrag(callback);

          let target = component.background();
          TestMethods.triggerFakeTouchEvent("touchstart", target, [{x: startPoint.x, y: startPoint.y}]);
          TestMethods.triggerFakeTouchEvent("touchmove", target, [{x: endPoint.x - 10, y: endPoint.y - 10}]);
          TestMethods.triggerFakeTouchEvent("touchcancel", target, [{x: endPoint.x - 10, y: endPoint.y - 10}]);
          TestMethods.triggerFakeTouchEvent("touchend", target, [{x: endPoint.x, y: endPoint.y}]);
          assert.isTrue(callback.called, "the callback is called");
          assert.deepEqual(callback.lastStartPoint, {x: startPoint.x, y: startPoint.y}, "1");
          assert.deepEqual(callback.lastEndPoint, {x: endPoint.x - 10, y: endPoint.y - 10}, "2");
        });
      });
    });

    describe("onDragEnd/offDragEnd", () => {
      describe("registration", () => {
        it("registers callback using onDragEnd", () => {
          const callback = makeDragCallback();
          assert.strictEqual(dragInteraction.onDragEnd(callback), dragInteraction, "registration returns the calling Interaction");

          triggerFakeDragEnd(startPoint, endPoint);
          assert.isTrue(callback.called, "Interaction should trigger the callback");
        });

        it("deregisters callback using offDragEnd", () => {
          const callback = makeDragCallback();
          dragInteraction.onDragEnd(callback);
          assert.strictEqual(dragInteraction.offDragEnd(callback), dragInteraction, "deregistration returns the calling Interaction");

          triggerFakeDragEnd(startPoint, endPoint);
          assert.isFalse(callback.called, "Callback should be disconnected from the interaction");
        });

        it("can register multiple onDragEnd callbacks", () => {
          const callback1 = makeDragCallback();
          const callback2 = makeDragCallback();
          dragInteraction.onDragEnd(callback1);
          dragInteraction.onDragEnd(callback2);

          triggerFakeDragEnd(startPoint, endPoint);
          assert.isTrue(callback1.called, "Interaction should trigger the first callback");
          assert.isTrue(callback2.called, "Interaction should trigger the second callback");
        });

        it("can deregister an onDragEnd callback without affecting the other ones", () => {
          const callback1 = makeDragCallback();
          const callback2 = makeDragCallback();
          dragInteraction.onDragEnd(callback1);
          dragInteraction.onDragEnd(callback2);
          dragInteraction.offDragEnd(callback1);

          triggerFakeDragEnd(startPoint, endPoint);
          assert.isFalse(callback1.called, "Callback1 should be disconnected from the click interaction");
          assert.isTrue(callback2.called, "Callback2 should still exist on the click interaction");
        });
      });

      describe("invoking", () => {
        let callback: DragTestCallback;

        beforeEach(() => {
          callback = makeDragCallback();
          dragInteraction.onDragEnd(callback);
        });

        [TestMethods.InteractionMode.Mouse, TestMethods.InteractionMode.Touch].forEach((mode: TestMethods.InteractionMode) => {
          it(`passes correct start and end point on drag ending for ${TestMethods.InteractionMode[mode]}`, () => {
            triggerFakeDragEnd(startPoint, endPoint);

            assert.isTrue(callback.called, "callback was called on drag ending");
            assert.deepEqual(callback.lastStartPoint, startPoint, "was passed the correct starting point");
            assert.deepEqual(callback.lastEndPoint, endPoint, "was passed the correct current point");
          });

          it(`supports multiple start/move/end drag callbacks at the same time for ${TestMethods.InteractionMode[mode]}`, () => {
            const startCallback = makeDragCallback();
            const moveCallback = makeDragCallback();
            const endCallback = makeDragCallback();

            dragInteraction.onDragStart(startCallback);
            dragInteraction.onDrag(moveCallback);
            dragInteraction.onDragEnd(endCallback);

            TestMethods.triggerFakeInteractionEvent(mode,
                                                    TestMethods.InteractionType.Start,
                                                    component.background(),
                                                    startPoint.x,
                                                    startPoint.y);
            assert.isTrue(startCallback.called, "callback for drag start was called");

            TestMethods.triggerFakeInteractionEvent(mode,
                                                    TestMethods.InteractionType.Move,
                                                    component.background(),
                                                    endPoint.x,
                                                    endPoint.y);
            assert.isTrue(moveCallback.called, "callback for drag was called");

            TestMethods.triggerFakeInteractionEvent(mode,
                                                    TestMethods.InteractionType.End,
                                                    component.background(),
                                                    endPoint.x,
                                                    endPoint.y);
            assert.isTrue(endCallback.called, "callback for drag end was called");
          });
        });

        it("does not call callback on mouseup from the right-click button", () => {
            TestMethods.triggerFakeMouseEvent("mousedown", component.background(), startPoint.x, startPoint.y);
            TestMethods.triggerFakeMouseEvent("mouseup", component.background(), endPoint.x, endPoint.y, 2);
            assert.isFalse(callback.called, "callback was not called on mouseup from the right-click button");
            // end the drag
            TestMethods.triggerFakeMouseEvent("mouseup", component.background(), endPoint.x, endPoint.y);
        });
      });
    });

    describe("constrainedToComponent", () => {
      it("is true by default", () => {
        assert.isTrue(dragInteraction.constrainedToComponent(), "constrains by default");
      });

      it("can be set to false", () => {
        assert.strictEqual(dragInteraction.constrainedToComponent(false), dragInteraction, "setter returns calling Drag Interaction");
        assert.isFalse(dragInteraction.constrainedToComponent(), "constrains set to false");
      });

      [TestMethods.InteractionMode.Mouse, TestMethods.InteractionMode.Touch].forEach((mode) => {
        describe(`invoking callbacks with ${TestMethods.InteractionMode[mode]} events when not constrained`, () => {
          let callback: DragTestCallback;

          beforeEach(() => {
            callback = makeDragCallback();
            dragInteraction.constrainedToComponent(false);
            dragInteraction.onDrag(callback);
            dragInteraction.onDragEnd(callback);
          });

          it("does not constrain dragging for onDrag outside Component in positive direction", () => {
            triggerFakeDragMove(startPoint, positiveOutsidePoint);
            assert.deepEqual(callback.lastEndPoint, positiveOutsidePoint, "was passed the correct end point");
          });

          it("does not constrain dragging for onDrag outside Component in negative direction", () => {
            triggerFakeDragMove(startPoint, negativeOutsidePoint);
            assert.deepEqual(callback.lastEndPoint, negativeOutsidePoint, "was passed the correct end point");
          });

          it("does not constrain dragging for onDragEnd outside Component in positive direction", () => {
            triggerFakeDragEnd(startPoint, positiveOutsidePoint);
            assert.deepEqual(callback.lastEndPoint, positiveOutsidePoint, "was passed the correct end point");
          });

          it("does not constrain dragging for onDragEnd outside Component in negative direction", () => {
            triggerFakeDragEnd(startPoint, negativeOutsidePoint);
            assert.deepEqual(callback.lastEndPoint, negativeOutsidePoint, "was passed the correct end point");
          });
        });

        describe(`invoking callbacks with ${TestMethods.InteractionMode[mode]} events when constrained`, () => {
          const constrainedPos = { x: SVG_WIDTH, y: SVG_HEIGHT };
          const constrainedNeg = { x: 0, y: 0 };

          let callback: DragTestCallback;

          beforeEach(() => {
            callback = makeDragCallback();
            dragInteraction.onDrag(callback);
            dragInteraction.onDragEnd(callback);
          });

          it("constrains dragging for onDrag outside Component in positive direction", () => {
            triggerFakeDragMove(startPoint, positiveOutsidePoint);
            assert.deepEqual(callback.lastEndPoint, constrainedPos, "was passed the correct end point");
          });

          it("constrains dragging for onDrag outside Component in negative direction", () => {
            triggerFakeDragMove(startPoint, negativeOutsidePoint);
            assert.deepEqual(callback.lastEndPoint, constrainedNeg, "was passed the correct end point");
          });

          it("constrains dragging for onDragEnd outside Component in positive direction", () => {
            triggerFakeDragEnd(startPoint, positiveOutsidePoint);
            assert.deepEqual(callback.lastEndPoint, constrainedPos, "was passed the correct end point");
          });

          it("constrains dragging for onDragEnd outside Component in negative direction", () => {
            triggerFakeDragEnd(startPoint, negativeOutsidePoint);
            assert.deepEqual(callback.lastEndPoint, constrainedNeg, "was passed the correct end point");
          });
        });
      });
    });
  });
});

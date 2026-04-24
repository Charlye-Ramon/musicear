import { useState, useRef, useCallback } from "react";

/**
 * Unified drag-and-drop hook that works on both desktop (mouse) and mobile (touch).
 * Returns handlers to attach to draggable items and droppable zones.
 *
 * Usage:
 *   const dd = useDragDrop();
 *   // On draggable: {...dd.draggable(itemData)}
 *   // On droppable: {...dd.droppable(onDrop)}
 *   // Current drag payload: dd.dragging
 */
export function useDragDrop() {
  const [dragging, setDragging] = useState(null);   // payload being dragged
  const [dragFrom, setDragFrom] = useState(null);   // source id
  const payloadRef = useRef(null);
  const fromRef    = useRef(null);

  // ── Desktop drag events ──────────────────────────────────────────────────
  const onDragStart = useCallback((payload, from) => (e) => {
    e.dataTransfer.effectAllowed = "move";
    payloadRef.current = payload;
    fromRef.current    = from;
    // Delay state so the ghost image renders before React re-renders
    setTimeout(() => { setDragging(payload); setDragFrom(from); }, 0);
  }, []);

  const onDragEnd = useCallback(() => {
    payloadRef.current = null;
    fromRef.current    = null;
    setDragging(null);
    setDragFrom(null);
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((callback) => (e) => {
    e.preventDefault();
    const payload = payloadRef.current;
    const from    = fromRef.current;
    if (payload !== null && payload !== undefined) {
      callback(payload, from);
    }
    payloadRef.current = null;
    fromRef.current    = null;
    setDragging(null);
    setDragFrom(null);
  }, []);

  // ── Touch events (mobile) ────────────────────────────────────────────────
  // We use a ref to track the touch-started element's payload so that a short
  // tap doesn't accidentally start a drag; we require 150ms hold before drag starts.
  const touchTimer  = useRef(null);
  const touchActive = useRef(false);

  const onTouchStart = useCallback((payload, from) => (e) => {
    touchActive.current = false;
    touchTimer.current = setTimeout(() => {
      touchActive.current = true;
      payloadRef.current = payload;
      fromRef.current    = from;
      setDragging(payload);
      setDragFrom(from);
      // Light haptic feedback on supported devices
      if (navigator.vibrate) navigator.vibrate(30);
    }, 150);
  }, []);

  const onTouchEnd = useCallback((tapCallback) => (e) => {
    clearTimeout(touchTimer.current);
    if (!touchActive.current) {
      // It was a tap, not a drag
      tapCallback?.();
      return;
    }
    touchActive.current = false;

    // Find the element under the finger
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);

    // Walk up the DOM to find a droppable
    let target = el;
    while (target && target !== document.body) {
      if (target.dataset?.droppable) {
        target.dataset.droppable && target.__dropHandler?.(payloadRef.current, fromRef.current);
        break;
      }
      target = target.parentElement;
    }

    payloadRef.current = null;
    fromRef.current    = null;
    setDragging(null);
    setDragFrom(null);
  }, []);

  const onTouchMove = useCallback((e) => {
    if (touchActive.current) e.preventDefault();
  }, []);

  // ── Convenience prop-generators ──────────────────────────────────────────
  const draggableProps = useCallback((payload, from, tapCallback) => ({
    draggable: true,
    onDragStart: onDragStart(payload, from),
    onDragEnd,
    onTouchStart: onTouchStart(payload, from),
    onTouchEnd: onTouchEnd(tapCallback),
    onTouchMove,
    style: { touchAction: "none", userSelect: "none", cursor: "grab" },
  }), [onDragStart, onDragEnd, onTouchStart, onTouchEnd, onTouchMove]);

  const droppableProps = useCallback((callback) => {
    const handler = (payload, from) => callback(payload, from);
    return {
      "data-droppable": "true",
      onDragOver,
      onDrop: onDrop(callback),
      // Store handler so touch can find it via DOM walk
      ref: (el) => { if (el) el.__dropHandler = handler; },
    };
  }, [onDragOver, onDrop]);

  return { dragging, dragFrom, draggableProps, droppableProps };
}
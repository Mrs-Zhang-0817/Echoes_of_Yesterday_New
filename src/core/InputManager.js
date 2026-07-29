export class InputManager {
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.handlers = {};

    // 绑定处理函数以便后续解绑
    this._onPointerDown = (event) => this.dispatch('down', event);
    this._onPointerMove = (event) => this.dispatch('move', event);
    this._onPointerUp = (event) => this.dispatch('up', event);
    this._onPointerCancel = (event) => this.dispatch('cancel', event);
    this._onPointerLeave = (event) => this.dispatch('leave', event);
    this._onContextMenu = (event) => event.preventDefault(); // 阻止长按菜单

    canvas.addEventListener('pointerdown', this._onPointerDown, { passive: false });
    canvas.addEventListener('pointermove', this._onPointerMove, { passive: false });
    canvas.addEventListener('pointerup', this._onPointerUp, { passive: false });
    canvas.addEventListener('pointercancel', this._onPointerCancel, { passive: false });
    canvas.addEventListener('pointerleave', this._onPointerLeave, { passive: false });
    canvas.addEventListener('contextmenu', this._onContextMenu);

    // 阻止 iOS 手势
    canvas.addEventListener('gesturestart', e => e.preventDefault());
    canvas.addEventListener('gesturechange', e => e.preventDefault());
    canvas.addEventListener('gestureend', e => e.preventDefault());
  }

  setHandlers(handlers = {}) {
    this.handlers = handlers;
  }

  dispatch(type, event) {
    const handler = this.handlers[type];
    if (!handler) return;
    event.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;

    const point = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
    };

    if (type === 'down') {
      try { this.canvas.setPointerCapture(event.pointerId); } catch {}
    }
    if (type === 'up' || type === 'cancel') {
      try {
        if (this.canvas.hasPointerCapture?.(event.pointerId))
          this.canvas.releasePointerCapture(event.pointerId);
      } catch {}
    }

    handler(point);
  }

  destroy() {
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerup', this._onPointerUp);
    this.canvas.removeEventListener('pointercancel', this._onPointerCancel);
    this.canvas.removeEventListener('pointerleave', this._onPointerLeave);
    this.canvas.removeEventListener('contextmenu', this._onContextMenu);
    this.handlers = {};
  }
}

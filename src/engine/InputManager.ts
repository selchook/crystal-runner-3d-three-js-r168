export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  space: boolean;
  mouseX: number;
  mouseY: number;
  mousePressed: boolean;
  touchPressed: boolean;
  touchX: number;
  touchY: number;
}

export class InputManager {
  public state: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    mouseX: 0,
    mouseY: 0,
    mousePressed: false,
    touchPressed: false,
    touchX: 0,
    touchY: 0
  };

  private keysPressed = new Set<string>();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.code);
      e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.code);
      e.preventDefault();
    });

    // Mouse events
    window.addEventListener('mousedown', (e) => {
      this.state.mousePressed = true;
      this.updateMousePosition(e);
    });

    window.addEventListener('mouseup', () => {
      this.state.mousePressed = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.updateMousePosition(e);
    });

    // Touch events
    window.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.state.touchPressed = true;
      const touch = e.touches[0];
      this.state.touchX = touch.clientX / window.innerWidth * 2 - 1;
      this.state.touchY = -(touch.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.state.touchPressed = false;
    });

    window.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.state.touchX = touch.clientX / window.innerWidth * 2 - 1;
      this.state.touchY = -(touch.clientY / window.innerHeight) * 2 + 1;
    });
  }

  private updateMousePosition(e: MouseEvent) {
    this.state.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    this.state.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  public update() {
    // Update key states
    this.state.left = this.keysPressed.has('ArrowLeft') || this.keysPressed.has('KeyA');
    this.state.right = this.keysPressed.has('ArrowRight') || this.keysPressed.has('KeyD');
    this.state.up = this.keysPressed.has('ArrowUp') || this.keysPressed.has('KeyW');
    this.state.down = this.keysPressed.has('ArrowDown') || this.keysPressed.has('KeyS');
    this.state.space = this.keysPressed.has('Space');
  }

  public isPressed(): boolean {
    return this.state.space || this.state.mousePressed || this.state.touchPressed;
  }

  public getHorizontalInput(): number {
    if (this.state.touchPressed) {
      return this.state.touchX;
    }
    
    if (this.state.left && !this.state.right) return -1;
    if (this.state.right && !this.state.left) return 1;
    return 0;
  }

  public getVerticalInput(): number {
    if (this.state.touchPressed) {
      return this.state.touchY;
    }
    
    if (this.state.up && !this.state.down) return 1;
    if (this.state.down && !this.state.up) return -1;
    return 0;
  }
}
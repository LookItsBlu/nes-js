/**
 *
 */
function Nes() {
  this.ppu = new Ppu();
  this.cpu = new Cpu();
  this.apu = new Apu();
  this.pad1 = new Joypad();
  this.pad2 = new Joypad();

  this.rom = null;  // set by .setRom()

  this.cpu.initMemoryController(this.ppu, this.pad1);
  this.ppu.initMemoryController(this.cpu);

  this.state = this.STATES.POWER_OFF;

  // for requestAnimationFrame()

  var self = this;
  this.runFunc = function() { self.run(); };

  // event listeners

  this.onFpsUpdates = [];
}

Object.assign(Nes.prototype, {
  isNes: true,

  //

  STATES: {
    POWER_OFF: 0,
    RUN: 1,
    STOP: 2
  },

  KEY_TO_PAD_BUTTONS: {
    13: Joypad.BUTTONS.START,   // enter
    32: Joypad.BUTTONS.SELECT,  // space
    37: Joypad.BUTTONS.LEFT,    // left arrow
    38: Joypad.BUTTONS.UP,      // up arrow
    39: Joypad.BUTTONS.RIGHT,   // right arrow
    40: Joypad.BUTTONS.DOWN,    // down arrow
    88: Joypad.BUTTONS.B,       // x
    90: Joypad.BUTTONS.A        // z
  },

  // event listeners

  /**
   * Registered callbacks will be invoked when
   *   'fps': FPS number is updated
   */
  addEventListener: function(type, func) {
    switch(type) {
      case 'fps':
        this.onFpsUpdates.push(func);
        break;

      default:
        throw new Error('Nes.addEventListener: unknown type ' + type);
    }
  },

  invokeFpsUpdateListeners: function(fps) {
    for(var i = 0, il = this.onFpsUpdates.length; i < il; i++) {
      this.onFpsUpdates[i](fps);
    }
  },

  //

  /**
   *
   */
  setRom: function(rom) {
    this.rom = rom;
    this.cpu.setROM(rom);
    this.ppu.setROM(rom);
  },

  /**
   *
   */
  setDisplay: function(display) {
    this.ppu.setDisplay(display);
  },

  /**
   *
   */
  bootup: function() {
    this.cpu.bootup();
    this.ppu.bootup();
    this.apu.bootup();
    this.state = this.STATES.RUN;
  },

  /**
   *
   */
  reset: function() {
    this.cpu.reset();
    this.ppu.reset();
    this.apu.reset();
  },

  /**
   *
   */
  stop: function() {
    this.state = this.STATES.STOP;
  },

  /**
   *
   */
  resume: function() {
    this.state = this.STATES.RUN;
    this.run();
  },

  /**
   *
   */
  run: function() {
    this.measureFps();

    var cycles = 341 * 262 / 3; // TODO: temporal
    for(var i = 0; i < cycles; i++) {
      this.runCycle();
    }

    if(this.state === this.STATES.RUN)
      requestAnimationFrame(this.runFunc);
  },

  /**
   *
   */
  runCycle: function() {
    this.cpu.runCycle();
    this.ppu.runCycle();
    this.ppu.runCycle();
    this.ppu.runCycle();
  },

  /**
   *
   */
  runStep: function() {
    if(this.state !== this.STATES.STOP)
      return;

    do {
      this.runCycle();
    } while(this.cpu.handling > 0)
  },

  // key input handlers

  handleKeyDown: function(e) {
    if(this.KEY_TO_PAD_BUTTONS[e.keyCode] !== undefined)
      this.pad1.pressButton(this.KEY_TO_PAD_BUTTONS[e.keyCode]);
    e.preventDefault();
  },

  handleKeyUp: function(e) {
    if(this.KEY_TO_PAD_BUTTONS[e.keyCode] !== undefined)
      this.pad1.releaseButton(this.KEY_TO_PAD_BUTTONS[e.keyCode]);
    e.preventDefault();
  },

  //

  measureFps: function() {
    var oldTime = null;
    var frame = 0;

    return function measureFps() {
      if(frame === 60) {
        var newTime = performance.now();

        if (oldTime !== null)
          this.invokeFpsUpdateListeners(60000 / (newTime - oldTime));

        oldTime = newTime;
        frame = 0;
      }
      frame++;
    };
  }(),

  // dump methods

  dumpCpu: function() {
    return this.cpu.dump();
  },

  dumpRam: function() {
    return this.cpu.dumpRAM();
  },

  dumpRom: function() {
    var buffer = '';
    buffer += this.rom.dumpHeader();
    buffer += '\n';
    buffer += this.rom.dump();
    buffer += '\n';
    buffer += this.cpu.disassembleROM();
    buffer += '\n';
    return buffer;
  },

  dumpPpu: function() {
    return this.ppu.dump();
  },

  dumpVRam: function() {
    return this.ppu.dumpVRAM();
  },

  dumpSprRam: function() {
    return this.ppu.dumpSPRRAM();
  }
});
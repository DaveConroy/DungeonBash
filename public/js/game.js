(function(exports) {
//Creates a game instance.
var Game = function() {

  this.curState = {};
  this.prevState = {};

  // Last used ID
  this.lastId = 0;
  this.callbacks = {};

  // Counter for the number of updates
  this.updateCount = 0;
  // Timer for the update loop.
  this.timer = null;
};

Game.UPDATE_INTERVAL = Math.round(1000 / 30);
Game.MAX_DELTA = 10000;
Game.WIDTH = 640;
Game.HEIGHT = 480;
Game.SHOT_AREA_RATIO = 0.02;
Game.SHOT_SPEED_RATIO = 1;
Game.PLAYER_SPEED_RATIO = 0.1;
Game.TRANSFER_RATE = 0.05;
Game.TARGET_LATENCY = 1000; // Maximum latency skew.
Game.RESTART_DELAY = 1000;

})
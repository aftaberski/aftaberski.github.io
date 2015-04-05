var Sakura = function(canvas, txt) {
  this.canvas = canvas;
  this.txt = txt;
  this.ctx = canvas.getContext('2d');
  this.trunk = new Branch('trunk', 1, this);
  this.trunk.angle = 0;
  this.anim = true;
  this.onFrame = this.onFrame.bind(this);
  this.onFrame();
  this.onClick = this.onClick.bind(this);
  canvas.addEventListener('click', this.onClick);
};

Sakura.prototype.onClick = function() {
  this.anim = !this.anim;
  this.onFrame();
  console.log(this);
};

Sakura.prototype.onFrame = function() {
  if (this.anim) {
    window.requestAnimationFrame(this.onFrame);
  }
  this.tick();
  this.paint();
};

Sakura.prototype.tick = function() {
  this.trunk.tick();
};

Sakura.prototype.paint = function() {
  var width = this.canvas.clientWidth;
  var height = this.canvas.clientHeight;
  if (this.width != width || this.height != height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
  }
  this.ctx.strokeStyle = 'rgba(12,7,0, 0.9)';
  this.ctx.lineWidth = this.thickness;

  this.ctx.clearRect(0, 0, width, height);
  this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  var turtle = new Turtle();
  turtle.pos = [width / 2, height];
  this.trunk.paint(this.ctx, turtle);
};

var Branch = function(id, depth, tree) {
  this.id = id;
  this.depth = depth;
  this.length = 0.1;
  this.thickness = 0.1;
  this.children = [];
  this.tree = tree;
  this.age = 0;
  if (depth % 2 == 1) {
    this.angle = Math.random() * 90.0 - 45.0;
  } else {
    this.angle = (Math.random() * 180.0 - 90.0) / Math.sqrt(depth);
  }
};

Branch.prototype.tick = function() {
  ++this.age;
  this.thickness += 0.1 * Math.random() * Math.pow(2, -0.9 * this.depth);
  this.length += 0.05 * this.depth * Math.random();
  if (this.depth < 8) {
    if (this.children.length < 3 && Math.random() < 0.008) {
      if (Math.random() < 0.5) {
        var branch1 = this.branch();
        var branch2 = this.branch();
        branch1.thickness = this.thickness * Math.random();
        branch2.thickness = this.thickness - branch1.thickness;
      } else {
        this.branch();
      }
    }
  }
  var i = this.children.length;
  while(--i >= 0) {
    this.children[i].tick();
  }
};

Branch.prototype.branch = function() {
  var child = new Branch(this.id + '/' + this.children.length, this.depth + 1, this.tree);
  this.children.push(child);
  return child;
};

Branch.prototype.toString = function() {
  var indent = new Array(this.depth + 1).join('  ');
  var self = [indent, this.id,
    'length:', this.length,
    'thickness:', this.thickness,
    'angle:', this.angle].join(' ');
  var children = this.children.map(function(b) { return b.toString(); });
  return [self].concat(children).join('\n');
};

Branch.prototype.paint = function(ctx, turtle) {
  ctx.lineWidth = this.thickness;
  var start = turtle.pos;
  var end = turtle.turn(this.angle).fwd(this.length).pos;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  if (this.age > 200) {
    if (this.thickness < 2) {
      var flowers = 4;
      var r = start.to(end);
      ctx.fillStyle = '#FF69B4';
      while (--flowers > 0) {
        var pos = r.t(flowers);
        // ctx.fillRect(pos.x, pos.y, 5, 5);
        // ctx.arc(pos.x, pos.y, 2, 0, Math.PI*2);
        // ctx.fill();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI*2);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  var i = this.children.length;
  while(--i >= 0) {
    this.children[i].paint(ctx, turtle.spawn());
  }
};

Branch.prototype.debugPaint = function(ctx, turtle) {
  ctx.lineWidth = this.thickness;
  ctx.beginPath();
  ctx.moveTo(turtle.x, turtle.y);
  turtle.turn(this.angle);
  console.log(this)
  turtle.fwd(this.length);
  ctx.lineTo(turtle.x, turtle.y);
  ctx.stroke();

  var i = this.children.length;
  while(--i >= 0) {
    this.children[i].paint(ctx, turtle.spawn());
  }
};
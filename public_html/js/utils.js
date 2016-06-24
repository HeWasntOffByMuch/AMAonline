window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;

function sgn(x) {	return (x>0) - (x<0); }

Array.prototype.min = function(f){ if(!this.length) return null; var min = this[0]; var minval = f(min); for(var i = this.length; i--;) {if (f(this[i]) < minval) {minval = f(this[i]); min = this[i]}} return min; }


Object.defineProperty(Object.prototype, "min", { 
  value: function(f) {
    var min = null; var minval = null; for(var i in this) { if (minval ==null || f(this[i]) < minval) {minval = f(this[i]); min = this[i]}} return min;
  },
  enumerable : false
});

function fadeOut(object, property, startVal, endVal, time, callback){
	var startTime = new Date().getTime();
	if(object['currentAnimationId']) startVal = object[property];
	object[property] = startVal;
	clearInterval(object['currentAnimationId']||0);
	var intId = setInterval(function(){
		var currentTime = new Date().getTime();
		if((currentTime-startTime)>=time){
			clearInterval(intId);
			object[property] = endVal;
			object['currentAnimationId'] = null;
			if (callback)
				callback();
		}
		else
			object[property] = startVal + (endVal - startVal)*(currentTime-startTime)/time;
	}, 60);
	object['currentAnimationId'] = intId;
}

function isPointWithin(a, p) { return a.x <= p.x && a.x + a.w > p.x && a.y <= p.y && a.y + a.h > p.y; }

function dist(a, b) {
	return Math.sqrt((a.tx-b.tx)*(a.tx-b.tx)+(a.ty-b.ty)*(a.ty-b.ty));
}

CanvasRenderingContext2D.prototype.drawRotatedImage = function(image, x, y, w, h, angle) {
	this.save(); 
	this.translate(x, y);
	this.init_angle = image.init_angle || 0;
	this.rotate(angle + this.init_angle);
	this.drawImage(image, -(image.width/2), -(image.height/2), w, h);
	this.restore();
}

CanvasRenderingContext2D.prototype.drawRotatedAnim = function(image, partX, partY, w, h, x, y, angle, size) {
	this.save(); 
	this.translate(x, y);
	this.rotate(angle);
	this.drawImage(image, partX, partY, w, h, -w/2*size, -h/2*size, w*size, h*size);
	this.restore();
}

function MovementQueue(map) {
    this.currentPath = [];
    this.findPath = function(x, y, x_dest, y_dest) {
        this.currentPath = findPath(map, [x, y], [x_dest, y_dest]);
        this.currentPath.shift();
    }
    this.findPathToDist = function(x, y, x_dest, y_dest, dist) {
        this.currentPath = findPathToDist(map, [x, y], [x_dest, y_dest], dist);
        this.currentPath.shift();
    };
    this.queueMove = function(x, y) {
        this.currentPath = [
            [x, y]
        ];
    };
    this.getLength = function() {
        return this.currentPath.length;
    };
    this.getMove = function() {
        return this.currentPath.shift();
    };
    this.getCurrentPath = function() {
      return this.currentPath;
    };
}
function calcLineOfSight (start_x, start_y, end_x, end_y) {
  var coordinatesArray = [];
  var x1 = start_x;
  var y1 = start_y;
  var x2 = end_x;
  var y2 = end_y;
  var dx = Math.abs(x2 - x1);
  var dy = Math.abs(y2 - y1);
  var sx = (x1 < x2) ? 1 : -1;
  var sy = (y1 < y2) ? 1 : -1;
  var err = dx - dy;
  coordinatesArray.push([y1, x1]);
  // Main loop
  while (!((x1 == x2) && (y1 == y2))) {
    var e2 = err << 1;
    if (e2 > -dy) {
      err -= dy;
      x1 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y1 += sy;
    }
    coordinatesArray.push([y1, x1]);
  }
  for(var i=0; i<coordinatesArray.length; i++){
  	var y = coordinatesArray[i][0];
  	var x = coordinatesArray[i][1];
  	if(!GAME.map.isShotValid(x, y)) return {isClear: false, obstacle: {x: x, y: y}};
  }
  return {isClear: true};
}

expTable={1:0,2:5,3:15,4:35,5:101,6:250,7:500,8:1000,9:1974,10:3208,11:4986,12:7468,13:10844,14:15338,15:21210,16:28766,17:38356,18:50382,19:65306,20:83656,21:106032,22:133112,23:165668,24:204564,25:250780,26:305412,27:369692,28:444998,29:532870,30:635026,31:753378,32:890062,33:1047438,34:1228138,35:1435074,36:1671470,37:1940892,38:2247288,39:2595010,40:2988860,41:3434132,42:3936658,43:4502856,44:5139778,45:5855180,46:6657576,47:7556310,48:8561630,49:9684764,50:10938016,51:12334856,52:13890020,53:15619622,54:17541282,55:19674240,56:22039516,57:24660044,58:27560852,59:30769230,60:37746418,61:45876427,62:59571153,63:75703638,64:94615279,65:116688304,66:155291059,67:186418013,68:238159614,69:298622278,70:368975850,71:450525549,72:568409779,73:679324744,74:806544569,75:952091724,76:1188099236,77:1480429211,78:1776125584,79:2091634902,80:2425349810,81:2440895086,82:3202613610,83:4102685060,84:5144967760,85:6351931110,86:7749594660,87:9623811110,88:11794153710,89:14307410410,90:17217761660,91:20587948360,92:24490624510,93:29009923460,94:34243271610,95:40303488760,96:47321220210,97:55447753210,98:64858278410,99:75755666560,100:88374842010,101:102255935010,102:117525137310,103:134321259860,104:152796994660,105:173120302960,106:195475942060,107:218582593060,108:242490255960,109:267248930760,110:292908617460,111:319519316060,112:347131026560,113:375793748960,114:405557483260,115:436472229460,116:468587987560,117:500703745660,118:534070515660,119:568738297560,120:604757091360,121:642176897060,122:683338683310,123:728616648160,124:778422409460,125:833208746860,126:893473718010,127:966394333110,128:1046607009710,129:1134840953960,130:1231898292660}
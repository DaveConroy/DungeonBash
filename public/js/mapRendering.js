function onLoadHandler() {

Array.prototype.erase = function (item) {
	for (var i = this.length; i--; i) {
		if (this[i] === item) this.splice(i, 1);
	}

	return this;
};

Function.prototype.bind = function (bind) {
	var self = this;
	return function () {
		var args = Array.prototype.slice.call(arguments);
		return self.apply(bind || null, args);
	};
};

merge = function (original, extended) {
	for (var key in extended) {
		var ext = extended[key];
		if (typeof (ext) != 'object' || ext instanceof Class) {
			original[key] = ext;
		} else {
			if (!original[key] || typeof (original[key]) != 'object') {
				original[key] = {};
			}
			merge(original[key], ext);
		}
	}
	return original;
};

function copy(object) {
	if (!object || typeof (object) != 'object' || object instanceof Class) {
		return object;
	} else if (object instanceof Array) {
		var c = [];
		for (var i = 0, l = object.length; i < l; i++) {
			c[i] = copy(object[i]);
		}
		return c;
	} else {
		var c = {};
		for (var i in object) {
			c[i] = copy(object[i]);
		}
		return c;
	}
}

function ksort(obj) {
	if (!obj || typeof (obj) != 'object') {
		return [];
	}

	var keys = [],
		values = [];
	for (var i in obj) {
		keys.push(i);
	}

	keys.sort();
	for (var i = 0; i < keys.length; i++) {
		values.push(obj[keys[i]]);
	}

	return values;
}

// -----------------------------------------------------------------------------
// Class object based on John Resigs code; inspired by base2 and Prototype
// http://ejohn.org/blog/simple-javascript-inheritance/
(function () {
	var initializing = false,
		fnTest = /xyz/.test(function () {
			xyz;
		}) ? /\bparent\b/ : /.*/;

	this.Class = function () {};
	var inject = function (prop) {
		var proto = this.prototype;
		var parent = {};
		for (var name in prop) {
			if (typeof (prop[name]) == "function" && typeof (proto[name]) == "function" && fnTest.test(prop[name])) {
				parent[name] = proto[name]; // save original function
				proto[name] = (function (name, fn) {
					return function () {
						var tmp = this.parent;
						this.parent = parent[name];
						var ret = fn.apply(this, arguments);
						this.parent = tmp;
						return ret;
					};
				})(name, prop[name]);
			} else {
				proto[name] = prop[name];
			}
		}
	};

	this.Class.extend = function (prop) {
		var parent = this.prototype;

		initializing = true;
		var prototype = new this();
		initializing = false;

		for (var name in prop) {
			if (typeof (prop[name]) == "function" && typeof (parent[name]) == "function" && fnTest.test(prop[name])) {
				prototype[name] = (function (name, fn) {
					return function () {
						var tmp = this.parent;
						this.parent = parent[name];
						var ret = fn.apply(this, arguments);
						this.parent = tmp;
						return ret;
					};
				})(name, prop[name]);
			} else {
				prototype[name] = prop[name];
			}
		}

		function Class() {
			if (!initializing) {

				// If this class has a staticInstantiate method, invoke it
				// and check if we got something back. If not, the normal
				// constructor (init) is called.
				if (this.staticInstantiate) {
					var obj = this.staticInstantiate.apply(this, arguments);
					if (obj) {
						return obj;
					}
				}

				for (var p in this) {
					if (typeof (this[p]) == 'object') {
						this[p] = copy(this[p]); // deep copy!
					}
				}

				if (this.init) {
					this.init.apply(this, arguments);
				}
			}

			return this;
		}

		Class.prototype = prototype;
		Class.constructor = Class;
		Class.extend = arguments.callee;
		Class.inject = inject;

		return Class;
	};

})();

newGuid_short = function () {
	var S4 = function () {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	};
	return (S4()).toString();
};

	


//Map Rendering
function xhrGet(reqUri,callback) {
	var xhr = new XMLHttpRequest();

	xhr.open("GET", reqUri, true);
	xhr.onload = callback;
	//var jsonObject = JSON.parse(xhr.responseText);
	xhr.send();
}







var loadMap = Class.extend({

	mapData: null,
	
	numXTiles: 100,
	
	numYTiles: 100,
	
	tileSize: {
		"x": 64,
		"y": 64
	},
	
	pixelSize: {
		"x": 64,
		"y": 64
	},
	
	tilesets:[],
	
	imgLoaded : 0,
	loaded: false,
	//Pass in location to map for HXRHttpRequest to load
	load: function (map) {
			
		//alert("Hello! I am an alert box!!");
		xhrGet(map, function (data) {
			getMap.parsedMapJSON(data.responseText);
			console.log(data);      });
		
	},
	
	parsedMapJSON: function(mapJSON) {
	
		//console.log(mapJSON);
		this.mapData = JSON.parse(mapJSON);		
		var map = this.mapData;
		this.numXTiles = map.width;
		this.numYTiles = map.height;
		this.tileSize.x = map.tilewidth;
		this.tileSize.y = map.tileheight;
		this.pixelSize.x = this.numXTiles * this.tileSize.x;
		this.pixelSize.y = this.numYTiles * this.tileSize.y;
		
		
		var getMap = this;
		
		for(var i = 0; i < map.tilesets.length; i++) {
			var img = new Image();
			img.onload= function() {
				getMap.imgLoadCount++;
				if(getMap.imgLoadCount === getMap.tilesets.length) {
					getMap.loaded = true;
				}
			};
			//img.src = "../data/" + map.tileSet[i].image.replace('/^.*[\\\/] , '');
			img.src = map.tilesets[i].image;
		
			var ts = { 
				
				"firstgid": map.tilesets[i].firstgid,
                "image": img,
                "imageheight": map.tilesets[i].imageheight,
                "imagewidth": map.tilesets[i].imagewidth,
                "name": map.tilesets[i].name,
                "numXTiles": Math.floor(map.tilesets[i].imagewidth / this.tileSize.x),
                "numYTiles": Math.floor(map.tilesets[i].imageheight / this.tileSize.y)
            }; 
			getMap.tilesets.push(ts);
		}
		
		//this.loaded = true;
	},
	
	getTilePacket: function (tileIndex) {
        var pkt = {
            "img": null,
            "px": 0,
            "py": 0
        };
			

			var i = 0;
			for(i = this.tilesets.length -1; i >= 0; i--) 
			{
				if(this.tilesets[i].firstgid <= tileIndex) break;
			}
			pkt.img = this.tilesets[i].image;
			//Finding offset
			var localIdx = tileIndex - this.tilesets[i].firstgid;
			var lTileX = Math.floor(localIdx % this.tilesets[i].numXtiles);
			var lTileY = Math.floor(localIdx / this.tilesets[i].numYtiles);
			pkt.px = (lTileX * this.tileSize.x);
			pkt.py = (lTileY * this.tileSize.y);
        
        return pkt;
    },
	
	draw: function (ctx) {

		if(!getMap.loaded) return;
		for(var layer = 0; layer < mapData.layers.length; layer++) {
			if(this.mapData.layers[layer].type != "tilelayer")  continue
				var data = this.mapData.layers[i].data;
				for (var j = 0; j < data.length; j++) {
				
					var tileID = data[j];
					if(tileID === 0) continue;
				
					var tilePKT = this.getTilePacket(tID);
					//Position to draw tile in the world
					var worldX = Math.floor(tileIDX % this.numXTiles) * this.tileSize.x; 
					var worldY = Math.floor(tileIDX / this.numXTiles) * this.tileSize.y; 
					
					ctx.drawImage(tilePKT.img, tilePKT.px, tilePKT.py, 
								this.tileSize.x, this.tileSize.y, worldX, worldY,
								this.tileSize.x, this.tileSize.y);
				}
		
		
		
		}
	
	}
});

var getMap = new loadMap();
var c = document.getElementById("gameCanvas");
var ctx = c.getContext("2d");
ctx.fillStyle = "#FF0000";
getMap.load("../images/map2.json");
//ctx.fillRect(0,0,150,75);
}
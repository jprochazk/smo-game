
function generateID() {
    const d = new Date();
    const r = Math.floor(Math.random() * 1000);
    return d.getTime().toString(16)+r.toString(16);
}

class Color {
    r = 0;
    g = 0;
    b = 0;
    constructor(r, g, b) {
        if(r < 0 ||  g < 0 ||  b < 0) {
            throw new Error('Cannot create color with values lower than 0');
        } else if (r > 255 || g > 255 || b > 255) {
            throw new Error('Cannot create color with values higher than 0');
        }
        this.r = r;
        this.g = g;
        this.b = b;
    }

    toHex() {
        function decimalToHex(n) {
            let hex = Number(n).toString(16).toUpperCase();
            if(hex.length < 2) {
                hex = "0"+hex;
            }
            return hex;
        }
        return "#"+decimalToHex(this.r)+decimalToHex(this.g)+decimalToHex(this.b);
    }
}

class Entity {
    constructor(x = 0, y = 0, id = 0) {
        this.pos = {
            x: x,
            y: y,
            lastX: 0,
            lastY: 0
        };
        this.nextPos = {
            x: x,
            y: y
        };
        this.w = 8;
        this.h = 8;
        if(id === 0) {
            this.id = generateID();
        }
        this.color = new Color(255, 51, 0);

        this.speed = 4;
    }

    move(xv, yv) {
        this.pos.x += this.speed*xv;
        this.pos.y += this.speed*yv;
    }

    commitMovement() {
        this.pos = this.nextPos;
    }

    setMoveTo(pos) {
        this.nextPos = pos;
    }

    draw() {
        let ctx = engine.getContext();
        ctx.fillStyle = this.color.toHex();
        ctx.fillRect(this.pos.x-(this.w/2), this.pos.y-(this.h/2), this.w, this.h);
    }
}

class Player extends Entity {
    constructor(x = 0, y = 0, id = 0) {
        super(x, y, id);
        this.w = 16;
        this.h = 16;
        this.color = new Color(51, 102, 255);
    }
}

class LocalPlayer extends Player {
    constructor(x = 0, y = 0) {
        super(x, y, 0);
        this.color = new Color(153, 51, 255);

        connectionHandler.sendData({
            'type': 'post',
            'request': 'register',
            'data': {
                'playerUUID': this.id,
                'pos': this.pos
            }
        });
    }
}

const getMousePos = function (canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
};

let engine = {
    timer: 0,
    running: 0,
    entities: {
        localPlayer: null,
        players: [],
        npcs: []
    },
    keysPressed: [],
    mousePos: {},
    leftMouseButtonState: 0,
    rightMouseButtonState: 0,
    updateMousePos: function(mp) {
        engine.mousePos = mp;
    },

    lookupEntity(type, id) {
        if(type === 'player') {
            return engine.entities.players[id];
        }
    },

    eraseEntity(type, id) {
        if(type === 'player') {
            console.log(engine.entities.players);
            delete engine.entities.players[id];
            console.log(engine.entities.players);
        }
    },

    createEntity(type, pos, id) {
        if(type === 'player') {
            engine.entities.players[id] = new Player(pos.x, pos.y, id);
        }
    },

    movePlayer(e) {
        e.pos.lastX = e.pos.x;
        e.pos.lastY = e.pos.y;

        if(engine.keysPressed["w"]) e.move(0, -1);
        if(engine.keysPressed["s"]) e.move(0, 1);
        if(engine.keysPressed["a"]) e.move(-1, 0);
        if(engine.keysPressed["d"]) e.move(1, 0);

        if(e.pos.lastX !== e.pos.x || e.pos.lastY !== e.pos.y) {
            connectionHandler.sendData({
                'type': 'post',
                'request': 'move',
                'data': {
                    'UUID': e.id,
                    'pos': e.pos
                }
            });
        }
    },

    draw: function() {
        engine.clear();
        /*engine.entities.npcs.forEach(function(e) {
            e.draw();
        });*/
        for(let key in engine.entities.players) {
            engine.entities.players[key].commitMovement();
            engine.entities.players[key].draw();
        }
        if(engine.entities.localPlayer) {
            engine.movePlayer(engine.entities.localPlayer);
            engine.entities.localPlayer.draw();
        }

    },

    clear: function() {
        engine.canvas.width = engine.canvas.width;
        engine.canvas.height = engine.canvas.height;
        let ctx = engine.getContext();
        let black = new Color(0, 0, 0);
        ctx.fillStyle = black.toHex();
        ctx.fillRect(0, 0, engine.canvas.width, engine.canvas.height);
    },

    resize: function() {
        engine.canvas.width = 600;
        engine.canvas.height = 600;
    },

    getContext: function() {
        return engine.canvas.getContext('2d');
    },

    init: function() {

        engine.canvas = document.getElementById('game');
        engine.canvas.width = 600;
        engine.canvas.height = 600;
        engine.clear(engine.canvas);

        setTimeout(function() {
            engine.entities.localPlayer = new LocalPlayer(engine.canvas.width/4, engine.canvas.height/4);
        }, 500);

        try {
            connectionHandler.init();
            connectionHandler.getData();
        } catch (e) {
            console.log(e);
        }

        window.addEventListener('mousemove', function(e){
            engine.updateMousePos(getMousePos(engine.canvas,e));
        });
        window.addEventListener('mousedown', function(e){
            engine.updateMousePos(getMousePos(engine.canvas,e));
            if(e.button === 0) engine.leftMouseButtonState = 1;
            if(e.button === 2) engine.rightMouseButtonState = 1;
        });
        window.addEventListener('mouseup', function(e){
            engine.updateMousePos(getMousePos(engine.canvas,e));
            if(e.button === 0) engine.leftMouseButtonState = 0;
            if(e.button === 2) engine.rightMouseButtonState = 0;
        });
        window.addEventListener('keydown', function(e){
            engine.keysPressed[e.key] = true;
        });
        window.addEventListener('keyup', function(e){
            engine.keysPressed[e.key] = false;
        });
        window.addEventListener('resize', function(){ engine.resize() });
        window.setInterval(this.draw, 1000/30);

    }
};

function autoMove(e) {
    e.pos.lastX = e.pos.x;
    e.pos.lastY = e.pos.y;

    let xv = 1;
    let yv = 1;

    if(e.pos.x+e.speed > engine.canvas.width-100) {
        console.log("right wall");
        xv *= -1;
    } else if(e.pos.x-e.speed < 100) {
        console.log("left wall");
        xv *= -1;
    }

    if(e.pos.y+e.speed > engine.canvas.height-100) {
        console.log("bottom wall");
        yv *= -1;
    } else if(e.pos.y-e.speed < 100) {
        console.log("top wall");
        yv *= -1;
    }

    e.move(xv, 0);
    e.move(0, yv);

    if(e.pos.lastX !== e.pos.x || e.pos.lastY !== e.pos.y) {
        connectionHandler.sendData({
            'type': 'post',
            'request': 'move',
            'data': {
                'UUID': e.id,
                'pos': e.pos
            }
        });
    }
}

let connectionHandler = {
    connection: null,
    connectionId: null,
    getData: function(request) {
        if(request !== undefined) {
            const data = {};
            data.type = 'get';
            data.request = request;
            this.sendData(data);
        }
    },
    sendData: function(d) {
        if(this.connection !== null) {
            try {
                this.connection.send(JSON.stringify(d));
            } catch(e) {
                console.log("error while sending data", d);
            }
        }
    },
    init: function() {
        let self = this;
        this.connection = new WebSocket('ws://localhost:8080');
        self.connection.onmessage = function(e) {
            let d = JSON.parse(e.data);
            if(d.connectionId) {
                self.connectionId = d.connectionId;
            }
            if(d.type === 'update') {
                if(d.event === 'entityMove') {
                    let entityData = d.data;
                    let entity = engine.lookupEntity(entityData.type, entityData.UUID);
                    entity.setMoveTo(entityData.pos);
                } else
                if(d.event === 'entityData') {
                    let entityData = d.data;
                    engine.createEntity(entityData.type, entityData.pos, entityData.UUID);
                } else
                if(d.event === 'entityDelete') {
                    console.log('entityDelete', d);
                    let entityData = d.data;
                    engine.eraseEntity(entityData.type, entityData.UUID);
                }
            }
        };
        this.connection.onopen = function(e) {
            self.getData('player');
            console.log("Connection established");
        };

        this.connection.onclose = function(e) {
            console.log("connection closed");
        };
    },
};

$(document).ready(function() {
    engine.init();

    window.addEventListener('beforeunload', function() {
        connectionHandler.connection.close();
    });
});
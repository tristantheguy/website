function generateDungeon() {
const DUNGEON_WIDTH = 50; // width of the dungeon in tiles
const DUNGEON_HEIGHT = 50; // height of the dungeon in tiles
const MAX_ROOMS = 10; // maximum number of rooms to generate
const MIN_ROOM_SIZE = 3; // minimum size of a room (in tiles)
const MAX_ROOM_SIZE = 8; // maximum size of a room (in tiles)
const TRAP_CHANCE = 0.1; // chance of a trap being placed in a room or corridor
const MONSTER_CHANCE = 0.1; // chance of a monster being placed in a room or corridor

// create a 2D array to represent the dungeon map
let dungeon = [];
for (let y = 0; y < DUNGEON_HEIGHT; y++) {
dungeon.push([]);
for (let x = 0; x < DUNGEON_WIDTH; x++) {
dungeon[y].push({
type: 0, // 0 = empty, 1 = room, 2 = corridor
trap: false, // true if there is a trap on this tile
monster: false // true if there is a monster on this tile
});
}
}

// create a list of rooms
let rooms = [];

// create the first room
let room = createRandomRoom();
rooms.push(room);
placeRoom(room);

// create the rest of the rooms
while (rooms.length < MAX_ROOMS) {
// pick a random room to branch from
let parentRoom = rooms[Math.floor(Math.random() * rooms.length)];
// create a new room
let room = createRandomRoom();
// calculate the position of the new room based on the parent room
let x = parentRoom.x + Math.floor(Math.random() * 3) - 1;
let y = parentRoom.y + Math.floor(Math.random() * 3) - 1;
// adjust the position of the room so that it doesn't go out of bounds
if (x < 1) x = 1;
if (y < 1) y = 1;
if (x + room.width > DUNGEON_WIDTH - 1) x = DUNGEON_WIDTH - 1 - room.width;
if (y + room.height > DUNGEON_HEIGHT - 1) y = DUNGEON_HEIGHT - 1 - room.height;
// update the room's position
room.x = x;
room.y = y;
// add the room to the list
rooms.push(room);
// place the room on the map
placeRoom(room);
}

// draw the map to the console
for (let y = 0; y < DUNGEON_HEIGHT; y++) {
let row = "";
for (let x = 0; x < DUNGEON_WIDTH; x++) {
let tile = dungeon[y][x];
if (tile.type === 0) {
row += ".";
} else if (tile.type === 1) {
row += "X";
} else if (tile.type === 2) {
row += "O";
}
if (tile.trap) {
row += "T";
}
if (tile.monster) {
row += "M";
}
}
console.log(row);
}
}

// creates a new room with random size and position
function createRandomRoom() {
let room = {};
room.width = MIN_ROOM_SIZE + Math.floor(Math.random() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE + 1));
room.height = MIN_ROOM_SIZE + Math.floor(Math.random() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE + 1));
room.x = Math.floor(Math.random() * (DUNGEON_WIDTH - room.width - 1)) + 1;
room.y = Math.floor(Math.random() * (DUNGEON_HEIGHT - room.height - 1)) + 1;
return room;
}

// places a room on the map
function placeRoom(room) {
for (let y = 0; y < room.height; y++) {
for (let x = 0; x < room.width; x++) {
let tile = dungeon[room.y + y][room.x + x];
tile.type = 1;
if (Math.random() < TRAP_CHANCE) {
tile.trap = true;
}
if (Math.random() < MONSTER_CHANCE) {
tile.monster = true;
}
}
}
}





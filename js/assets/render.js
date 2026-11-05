window.initMaze = function() {
    const canvas = document.getElementById("_maze_canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const INTERNAL_WIDTH = 240;
    const INTERNAL_HEIGHT = 180;
    canvas.width = INTERNAL_WIDTH;
    canvas.height = INTERNAL_HEIGHT;

    let currentMazeSize = 9;
    let level = 0;

    let map = [];

    let player = { x: 1.5, y: 1.5, angle: 0 };
    let orb = { x: 0, y: 0 };
    
    let keysList = [];
    let doorsList = [];
    let playerHasKey = false;

    let hexAngX = 0.0;
    let hexAngY = 0.0;
    let hexAngZ = 0.0;
    
    let introProgress = 0.0;
    const animSpeed = 0.02;
    let gameState = "RISING";

    let bobTimer = 0.0;

    const keys = {};
    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);

    const ceilingImg = document.getElementById("tex_ceiling");
    const wallImg = document.getElementById("tex_wall");
    const floorImg = document.getElementById("tex_floor");
    const smileImg = document.getElementById("tex_smile");
    const keyImg = document.getElementById("tex_key");
    const doorImg = document.getElementById("tex_door");

    function getImageData(img) {
        if (!img || !img.complete || img.naturalWidth === 0) return null;
        let c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        let cx = c.getContext('2d');
        cx.drawImage(img, 0, 0);
        return cx.getImageData(0, 0, c.width, c.height);
    }

    let ceilingData = null;
    let floorData = null;
    let wallData = null;
    let orbData = null;
    let keyData = null;
    let doorData = null;

    function loadTextures() {
        if (!ceilingData) ceilingData = getImageData(ceilingImg);
        if (!floorData) floorData = getImageData(floorImg);
        if (!wallData) wallData = getImageData(wallImg);
        if (!orbData) orbData = getImageData(smileImg);
        if (!keyData) keyData = getImageData(keyImg);
        if (!doorData) doorData = getImageData(doorImg);
    }

    function generateRandomMaze(rows, cols) {
        let grid = Array(rows).fill(0).map(() => Array(cols).fill(1));

        function isValid(r, c) {
            return r > 0 && r < rows - 1 && c > 0 && c < cols - 1;
        }

        function carve(r, c) {
            grid[r][c] = 0;
            let dirs = [[-2, 0], [0, 2], [2, 0], [0, -2]];
            dirs.sort(() => Math.random() - 0.5);

            for (let [dr, dc] of dirs) {
                let nr = r + dr;
                let nc = c + dc;
                if (isValid(nr, nc) && grid[nr][nc] === 1) {
                    grid[r + dr / 2][c + dc / 2] = 0;
                    carve(nr, nc);
                }
            }
        }

        carve(1, 1);
        grid[1][1] = 0;
        return grid;
    }

    function initLevel() {
        map = generateRandomMaze(currentMazeSize, currentMazeSize);
        level += 1;
        playerHasKey = false;
        keysList = [];
        doorsList = [];

        let level_txt = document.getElementById("_level_txt");
        if (level_txt) {
            level_txt.textContent = "Level: " + level;
            level_txt.title = "Level " + level;
        }
        
        let _map_size_txt = document.getElementById("_map_size_txt");
        if (_map_size_txt) {
            _map_size_txt.textContent = "Map size: " + currentMazeSize + "x" + currentMazeSize;
            _map_size_txt.title = "Map size: " + currentMazeSize + "x" + currentMazeSize;
        }

        player.x = 1.5;
        player.y = 1.5;
        player.angle = 0;

        let startR = Math.floor(player.y);
        let startC = Math.floor(player.x);

        function findSolutionPath(sr, sc) {
            let queue = [{ r: sr, c: sc, path: [{ r: sr, c: sc }] }];
            let visited = Array(map.length).fill(0).map(() => Array(map[0].length).fill(false));
            visited[sr][sc] = true;

            let furthestNode = queue[0];

            while (queue.length > 0) {
                let curr = queue.shift();
                furthestNode = curr;

                let dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                dirs.sort(() => Math.random() - 0.5);

                for (let [dr, dc] of dirs) {
                    let nr = curr.r + dr;
                    let nc = curr.c + dc;
                    if (nr > 0 && nr < map.length - 1 && nc > 0 && nc < map[0].length - 1) {
                        if (map[nr][nc] === 0 && !visited[nr][nc]) {
                            visited[nr][nc] = true;
                            queue.push({ r: nr, c: nc, path: [...curr.path, { r: nr, c: nc }] });
                        }
                    }
                }
            }
            return furthestNode.path;
        }

        let path = findSolutionPath(startR, startC);
        let pathToSet = new Set(path.map(p => `${p.r},${p.c}`));

        function findOffPathCell(targetCoord) {
            let queue = [{ r: targetCoord.r, c: targetCoord.c, dist: 0 }];
            let visited = Array(map.length).fill(0).map(() => Array(map[0].length).fill(false));
            visited[targetCoord.r][targetCoord.c] = true;
            let candidates = [];

            while (queue.length > 0) {
                let curr = queue.shift();
                let dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

                for (let [dr, dc] of dirs) {
                    let nr = curr.r + dr;
                    let nc = curr.c + dc;
                    if (nr > 0 && nr < map.length - 1 && nc > 0 && nc < map[0].length - 1) {
                        if (map[nr][nc] === 0 && !visited[nr][nc]) {
                            visited[nr][nc] = true;
                            let coordKey = `${nr},${nc}`;
                            if (!pathToSet.has(coordKey)) {
                                candidates.push({ r: nr, c: nc });
                            }
                            if (curr.dist < 3) {
                                queue.push({ r: nr, c: nc, dist: curr.dist + 1 });
                            }
                        }
                    }
                }
            }

            if (candidates.length > 0) {
                return candidates[Math.floor(Math.random() * candidates.length)];
            }
            return null;
        }

        if (level >= 3 && path.length > 15) {
            let doorCount = Math.max(1, level - 2);

            let finishCoord = path[path.length - 1];
            orb = { x: finishCoord.c + 0.5, y: finishCoord.r + 0.5 };
            map[finishCoord.r][finishCoord.c] = 2;

            let segmentSize = path.length / (doorCount + 1);

            for (let i = 1; i <= doorCount; i++) {
                let keyIndex = Math.floor(segmentSize * i - segmentSize * 0.4);
                if (keyIndex > 0 && keyIndex < path.length - 1) {
                    let pathCoord = path[keyIndex];
                    let keyCoord = findOffPathCell(pathCoord);
                    
                    if (!keyCoord && map[pathCoord.r][pathCoord.c] === 0) {
                        keyCoord = pathCoord;
                    }

                    if (keyCoord && map[keyCoord.r][keyCoord.c] === 0) {
                        map[keyCoord.r][keyCoord.c] = 4;
                        keysList.push({ x: keyCoord.c + 0.5, y: keyCoord.r + 0.5, r: keyCoord.r, c: keyCoord.c });
                    }
                }

                let doorIndex = Math.floor(segmentSize * i);
                if (doorIndex > 0 && doorIndex < path.length - 1) {
                    let doorCoord = path[doorIndex];
                    if (map[doorCoord.r][doorCoord.c] === 0) {
                        map[doorCoord.r][doorCoord.c] = 3;
                        doorsList.push({ x: doorCoord.c + 0.5, y: doorCoord.r + 0.5, r: doorCoord.r, c: doorCoord.c });
                    }
                }
            }
        } else {
            let furthest = path[path.length - 1];
            orb = { x: furthest.c + 0.5, y: furthest.r + 0.5 };
            map[furthest.r][furthest.c] = 2;
        }

        introProgress = 0.0;
        gameState = "RISING";

        let buildSound = document.getElementById("snd_build");
        if (buildSound) {
            buildSound.currentTime = 0;
            buildSound.play().catch(err => {
                console.warn("Audio could not be played:", err);
            });
        }
    }

    initLevel();

    function updatePlayer() {
        if (gameState !== "PLAYING") return;

        let moveSpeed = 0.05;
        let rotSpeed = 0.05;

        let isMoving = false;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.angle -= rotSpeed;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) player.angle += rotSpeed;

        let dx = Math.cos(player.angle) * moveSpeed;
        let dy = Math.sin(player.angle) * moveSpeed;

        let isWalkable = (val) => val === 0 || val === 2 || val === 4 || (val === 3 && playerHasKey);

        if (keys['ArrowUp'] || keys['w'] || keys['W']) {
            if (isWalkable(map[Math.floor(player.y)][Math.floor(player.x + dx * 2)])) { player.x += dx; isMoving = true; }
            if (isWalkable(map[Math.floor(player.y + dy * 2)][Math.floor(player.x)])) { player.y += dy; isMoving = true; }
        }
        if (keys['ArrowDown'] || keys['s'] || keys['S']) {
            if (isWalkable(map[Math.floor(player.y)][Math.floor(player.x - dx * 2)])) { player.x -= dx; isMoving = true; }
            if (isWalkable(map[Math.floor(player.y - dy * 2)][Math.floor(player.x)])) { player.y -= dy; isMoving = true; }
        }

        if (isMoving) {
            bobTimer += 0.15;
        }

        let pCellX = Math.floor(player.x);
        let pCellY = Math.floor(player.y);

        if (playerHasKey === false) {
            if (map[pCellY] && map[pCellY][pCellX] === 4) {
                map[pCellY][pCellX] = 0;
                playerHasKey = true;
                keysList = keysList.filter(k => !(k.r === pCellY && k.c === pCellX));

                let pickupSound = document.getElementById("snd_key");
                if (pickupSound) {
                    pickupSound.volume = 0.75;
                    pickupSound.currentTime = 0;
                    pickupSound.play().catch(err => {
                        console.warn("Audio could not be played:", err);
                    });
                }
            }
        }

        if (map[pCellY] && map[pCellY][pCellX] === 3 && playerHasKey) {
            map[pCellY][pCellX] = 0;
            playerHasKey = false;
            doorsList = doorsList.filter(d => !(d.r === pCellY && d.c === pCellX));

            let pickupSound = document.getElementById("snd_door");
            if (pickupSound) {
                pickupSound.volume = 0.5;
                pickupSound.currentTime = 0;
                pickupSound.play().catch(err => {
                    console.warn("Audio could not be played:", err);
                });
            }
        }

        if (map[pCellY] && map[pCellY][pCellX] === 2) {
            map[pCellY][pCellX] = 0;
            
            let orbSound = document.getElementById("snd_orb");
            if (orbSound) {
                orbSound.currentTime = 0;
                orbSound.play().catch(err => {
                    console.warn("Audio could not be played:", err);
                });
            }

            gameState = "FALLING";
        }
    }

    const screenBuffer = ctx.createImageData(INTERNAL_WIDTH, INTERNAL_HEIGHT);

    function render() {
        loadTextures();

        if (gameState === "RISING") {
            introProgress += animSpeed;
            if (introProgress >= 1.0) {
                introProgress = 1.0;
                gameState = "PLAYING";
            }
        } else if (gameState === "FALLING") {
            introProgress -= animSpeed;
            if (introProgress <= 0.0) {
                introProgress = 0.0;
                currentMazeSize = currentMazeSize + 4;
                initLevel();
            }
        }

        const l = level - 1;
        
        const wallTintR = level === 1 ? 1.0 : 1.0 + Math.sin(l * 0.8) * 0.6;
        const wallTintG = level === 1 ? 1.0 : 1.0 + Math.cos(l * 0.5) * 0.5;
        const wallTintB = level === 1 ? 1.0 : 1.0 + Math.sin(l * 1.1 + 1.0) * 0.7;

        const doorTintR = level === 1 ? 1.0 : 1.0 + Math.sin(l * 0.8) * 0.6;
        const doorTintG = level === 1 ? 1.0 : 1.0 + Math.cos(l * 0.5) * 0.5;
        const doorTintB = level === 1 ? 1.0 : 1.0 + Math.sin(l * 1.1 + 1.0) * 0.7;

        const floorTintR = level === 1 ? 1.0 : 1.0 + Math.cos(l * 0.7 + 2.0) * 0.6;
        const floorTintG = level === 1 ? 1.0 : 1.0 + Math.sin(l * 0.9 + 1.5) * 0.5;
        const floorTintB = level === 1 ? 1.0 : 1.0 + Math.cos(l * 0.6) * 0.7;

        const ceilTintR = level === 1 ? 1.0 : 1.0 + Math.sin(l * 0.6 + 4.0) * 0.5;
        const ceilTintG = level === 1 ? 1.0 : 1.0 + Math.cos(l * 1.2 + 0.5) * 0.6;
        const ceilTintB = level === 1 ? 1.0 : 1.0 + Math.sin(l * 0.7 + 2.5) * 0.7;

        const orbTintR = level === 1 ? 1.0 : 1.0 + Math.cos(l * 1.0 + 1.0) * 0.7;
        const orbTintG = level === 1 ? 1.0 : 1.0 + Math.sin(l * 0.8 + 3.0) * 0.6;
        const orbTintB = level === 1 ? 1.0 : 1.0 + Math.cos(l * 0.9 + 4.0) * 0.5;

        let buf = screenBuffer.data;

        let cameraBobX = Math.sin(bobTimer * 0.35) * 8.0;
        let cameraBobY = Math.abs(Math.sin(bobTimer * 0.7)) * 1.5;

        let halfH = INTERNAL_HEIGHT / 2;
        let bobbedHalfH = halfH + cameraBobY;
        let fov = Math.PI / 3;

        let angleOffset = (cameraBobX / INTERNAL_WIDTH) * fov;

        let rayDirX0 = Math.cos(player.angle - fov / 2 + angleOffset);
        let rayDirY0 = Math.sin(player.angle - fov / 2 + angleOffset);
        let rayDirX1 = Math.cos(player.angle + fov / 2 + angleOffset);
        let rayDirY1 = Math.sin(player.angle + fov / 2 + angleOffset);

        let wallTops = new Int32Array(INTERNAL_WIDTH);
        let wallBottoms = new Int32Array(INTERNAL_WIDTH);
        let wallTexX = new Int32Array(INTERNAL_WIDTH);
        let wallHeights = new Int32Array(INTERNAL_WIDTH);
        let wallTypes = new Int8Array(INTERNAL_WIDTH);
        let zBuffer = new Float32Array(INTERNAL_WIDTH);

        for (let i = 0; i < INTERNAL_WIDTH; i++) {
            let rayAngle = (player.angle - fov / 2 + angleOffset) + (i / INTERNAL_WIDTH) * fov;

            let eyeX = Math.cos(rayAngle);
            let eyeY = Math.sin(rayAngle);

            let mapX = Math.floor(player.x);
            let mapY = Math.floor(player.y);

            let deltaDistX = Math.abs(1 / eyeX);
            let deltaDistY = Math.abs(1 / eyeY);

            let stepX, stepY;
            let sideDistX, sideDistY;

            if (eyeX < 0) {
                stepX = -1;
                sideDistX = (player.x - mapX) * deltaDistX;
            } else {
                stepX = 1;
                sideDistX = (mapX + 1.0 - player.x) * deltaDistX;
            }
            if (eyeY < 0) {
                stepY = -1;
                sideDistY = (player.y - mapY) * deltaDistY;
            } else {
                stepY = 1;
                sideDistY = (mapY + 1.0 - player.y) * deltaDistY;
            }

            let hit = 0;
            let side = 0;
            let hitType = 1;

            while (hit === 0) {
                if (sideDistX < sideDistY) {
                    sideDistX += deltaDistX;
                    mapX += stepX;
                    side = 0;
                } else {
                    sideDistY += deltaDistY;
                    mapY += stepY;
                    side = 1;
                }
                if (mapY < 0 || mapY >= map.length || mapX < 0 || mapX >= map[0].length) {
                    hit = 1;
                    hitType = 1;
                } else if (map[mapY][mapX] === 1 || map[mapY][mapX] === 3) {
                    hit = 1;
                    hitType = map[mapY][mapX];
                }
            }

            wallTypes[i] = hitType;

            let correctedDist;
            if (side === 0) {
                correctedDist = (mapX - player.x + (1 - stepX) / 2) / eyeX;
            } else {
                correctedDist = (mapY - player.y + (1 - stepY) / 2) / eyeY;
            }
            if (correctedDist < 0.1) correctedDist = 0.1;

            zBuffer[i] = correctedDist;

            let fullWallHeight = Math.min(INTERNAL_HEIGHT * 2, Math.floor(INTERNAL_HEIGHT / correctedDist));
            let wallHeight = Math.floor(fullWallHeight * introProgress);

            let targetBottom = Math.floor(bobbedHalfH + (fullWallHeight / 2));
            let wallBottom = targetBottom;
            let wallTop = targetBottom - wallHeight;

            wallTops[i] = Math.max(0, wallTop);
            wallBottoms[i] = Math.min(INTERNAL_HEIGHT, wallBottom);
            wallHeights[i] = wallHeight;

            let wallX;
            if (side === 0) {
                wallX = player.y + correctedDist * eyeY;
            } else {
                wallX = player.x + correctedDist * eyeX;
            }
            wallX -= Math.floor(wallX);

            let activeTexData = (hitType === 3) ? doorData : wallData;

            if (activeTexData) {
                let tx = Math.floor(wallX * activeTexData.width);
                if (tx < 0) tx = 0;
                if (tx >= activeTexData.width) tx = activeTexData.width - 1;
                wallTexX[i] = tx;
            } else {
                wallTexX[i] = -1;
            }
        }

        for (let y = 0; y < INTERNAL_HEIGHT; y++) {
            let isFloor = y > bobbedHalfH;
            let isCeiling = y < bobbedHalfH;

            let rowDist = 0;
            if (y !== bobbedHalfH) {
                let p = isFloor ? y - bobbedHalfH : bobbedHalfH - y;
                rowDist = (INTERNAL_HEIGHT * 0.5) / p;
            }

            let floorStepX = rowDist * (rayDirX1 - rayDirX0) / INTERNAL_WIDTH;
            let floorStepY = rowDist * (rayDirY1 - rayDirY0) / INTERNAL_WIDTH;
            let floorX = player.x + rowDist * rayDirX0;
            let floorY = player.y + rowDist * rayDirY0;

            for (let x = 0; x < INTERNAL_WIDTH; x++) {
                let idx = (y * INTERNAL_WIDTH + x) * 4;

                if (y >= wallTops[x] && y < wallBottoms[x]) {
                    let wtX = wallTexX ? wallTexX[x] : 0;
                    let wallH = wallHeights ? wallHeights[x] : INTERNAL_HEIGHT;
                    let hitT = wallTypes ? wallTypes[x] : 1;
                    
                    let activeTexData = (hitT === 3) ? doorData : wallData;
                    let tR = (hitT === 3) ? doorTintR : wallTintR;
                    let tG = (hitT === 3) ? doorTintG : wallTintG;
                    let tB = (hitT === 3) ? doorTintB : wallTintB;

                    let texHeight = activeTexData ? activeTexData.height : 64;
                    let wtY = Math.floor(((y - (bobbedHalfH - wallH / 2)) / wallH) * texHeight);
                    if (wtY < 0) wtY = 0;
                    if (wtY >= texHeight) wtY = texHeight - 1;

                    if (activeTexData && wtX >= 0) {
                        let wIdx = (wtY * activeTexData.width + wtX) * 4;
                        buf[idx]     = Math.min(255, activeTexData.data[wIdx] * tR);
                        buf[idx + 1] = Math.min(255, activeTexData.data[wIdx + 1] * tG);
                        buf[idx + 2] = Math.min(255, activeTexData.data[wIdx + 2] * tB);
                        buf[idx + 3] = 255;
                    } else {
                        buf[idx]     = Math.min(255, 200 * tR);
                        buf[idx + 1] = Math.min(255, 200 * tG);
                        buf[idx + 2] = Math.min(255, 200 * tB);
                        buf[idx + 3] = 255;
                    }
                } else if (isCeiling) {
                    if (ceilingData) {
                        let cellX = Math.floor(floorX);
                        let cellY = Math.floor(floorY);
                        let tx = Math.abs(Math.floor((floorX - cellX) * ceilingData.width)) % ceilingData.width;
                        let ty = Math.abs(Math.floor((floorY - cellY) * ceilingData.height)) % ceilingData.height;
                        let cIdx = (ty * ceilingData.width + tx) * 4;

                        buf[idx]     = Math.min(255, ceilingData.data[cIdx] * ceilTintR);
                        buf[idx + 1] = Math.min(255, ceilingData.data[cIdx + 1] * ceilTintG);
                        buf[idx + 2] = Math.min(255, ceilingData.data[cIdx + 2] * ceilTintB);
                        buf[idx + 3] = 255;
                    } else {
                        buf[idx]     = Math.min(255, 25 * ceilTintR);
                        buf[idx + 1] = Math.min(255, 25 * ceilTintG);
                        buf[idx + 2] = Math.min(255, 25 * ceilTintB);
                        buf[idx + 3] = 255;
                    }
                } else if (isFloor) {
                    if (floorData) {
                        let cellX = Math.floor(floorX);
                        let cellY = Math.floor(floorY);
                        let tx = Math.abs(Math.floor((floorX - cellX) * floorData.width)) % floorData.width;
                        let ty = Math.abs(Math.floor((floorY - cellY) * floorData.height)) % ceilingData.height;
                        let fIdx = (ty * floorData.width + tx) * 4;

                        buf[idx]     = Math.min(255, floorData.data[fIdx] * floorTintR);
                        buf[idx + 1] = Math.min(255, floorData.data[fIdx + 1] * floorTintG);
                        buf[idx + 2] = Math.min(255, floorData.data[fIdx + 2] * floorTintB);
                        buf[idx + 3] = 255;
                    } else {
                        buf[idx]     = Math.min(255, 45 * floorTintR);
                        buf[idx + 1] = Math.min(255, 45 * floorTintG);
                        buf[idx + 2] = Math.min(255, 45 * floorTintB);
                        buf[idx + 3] = 255;
                    }
                }

                floorX += floorStepX;
                floorY += floorStepY;
            }
        }

        function renderSprite(spriteObj, texSource) {
            let sX = spriteObj.x - player.x;
            let sY = spriteObj.y - player.y;

            let dist = Math.hypot(sX, sY);
            let targetAngle = Math.atan2(sY, sX);
            let angleDiff = targetAngle - player.angle;

            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

            let currentFovHalf = fov / 2;

            if (dist > 0.1 && Math.abs(angleDiff) < currentFovHalf) {
                let screenX = Math.floor((INTERNAL_WIDTH / 2) + (angleDiff / currentFovHalf) * (INTERNAL_WIDTH / 2));
                
                let rotY = dist * Math.cos(angleDiff);
                if (rotY < 0.1) rotY = 0.1;

                let spriteHeight = Math.min(INTERNAL_HEIGHT, Math.floor(INTERNAL_HEIGHT / rotY * 0.3));
                let spriteWidth = spriteHeight;

                // Fixed to static halfH instead of bobbedHalfH
                let drawStartX = Math.max(0, Math.floor(screenX - spriteWidth / 2));
                let drawEndX = Math.min(INTERNAL_WIDTH, Math.floor(screenX + spriteWidth / 2));
                let drawStartY = Math.max(0, Math.floor(halfH - spriteHeight / 2));
                let drawEndY = Math.min(INTERNAL_HEIGHT, Math.floor(halfH + spriteHeight / 2));

                if (texSource) {
                    for (let x = drawStartX; x < drawEndX; x++) {
                        if (rotY < zBuffer[x]) {
                            let texX = Math.floor(((x - (screenX - spriteWidth / 2)) / spriteWidth) * texSource.width);
                            if (texX < 0) texX = 0;
                            if (texX >= texSource.width) texX = texSource.width - 1;

                            for (let y = drawStartY; y < drawEndY; y++) {
                                let texY = Math.floor(((y - (halfH - spriteHeight / 2)) / spriteHeight) * texSource.height);
                                if (texY < 0) texY = 0;
                                if (texY >= texSource.height) texY = texSource.height - 1;

                                let tIdx = (texY * texSource.width + texX) * 4;
                                let alpha = texSource.data[tIdx + 3];

                                if (alpha > 128) {
                                    let idx = (y * INTERNAL_WIDTH + x) * 4;
                                    buf[idx]     = texSource.data[tIdx];
                                    buf[idx + 1] = texSource.data[tIdx + 1];
                                    buf[idx + 2] = texSource.data[tIdx + 2];
                                    buf[idx + 3] = 255;
                                }
                            }
                        }
                    }
                }
            }
        }

        for (let keyObj of keysList) {
            renderSprite(keyObj, keyData);
        }

        if (playerHasKey && keyData) {
            let heldWidth = 62;
            let heldHeight = 62;
            let heldX = INTERNAL_WIDTH - heldWidth + 7.5;
            // Removed Math.sin(bobTimer) * 6 from the held inventory key so it stays fixed
            let heldY = INTERNAL_HEIGHT - heldHeight + 10; 

            for (let y = 0; y < heldHeight; y++) {
                let sy = Math.floor(heldY + y);
                if (sy < 0 || sy >= INTERNAL_HEIGHT) continue;

                for (let x = 0; x < heldWidth; x++) {
                    let sx = Math.floor(heldX + x);
                    if (sx < 0 || sx >= INTERNAL_WIDTH) continue;

                    let texX = Math.floor((x / heldWidth) * keyData.width);
                    let texY = Math.floor((y / heldHeight) * keyData.height);
                    let tIdx = (texY * keyData.width + texX) * 4;
                    let alpha = keyData.data[tIdx + 3];

                    if (alpha > 128) {
                        let idx = (sy * INTERNAL_WIDTH + sx) * 4;
                        buf[idx]     = keyData.data[tIdx];
                        buf[idx + 1] = keyData.data[tIdx + 1];
                        buf[idx + 2] = keyData.data[tIdx + 2];
                        buf[idx + 3] = 255;
                    }
                }
            }
        }

        hexAngX += 0.025;
        hexAngY += 0.04;
        hexAngZ += 0.015;

        let spriteX = orb.x - player.x;
        let spriteY = orb.y - player.y;

        let dist = Math.hypot(spriteX, spriteY);
        let targetAngle = Math.atan2(spriteY, spriteX);
        let angleDiff = targetAngle - player.angle;

        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        let currentFovHalf = fov / 2;

        if (dist > 0.1 && Math.abs(angleDiff) < currentFovHalf) {
            let screenX = Math.floor((INTERNAL_WIDTH / 2) + (angleDiff / currentFovHalf) * (INTERNAL_WIDTH / 2));
            
            let rotY = dist * Math.cos(angleDiff);
            if (rotY < 0.1) rotY = 0.1;

            let screenCenterY = halfH; // Fixed to static halfH instead of bobbedHalfH
            let radius = 0.25; 

            let t = (1.0 + Math.sqrt(5.0)) / 2.0;
            let rawVerts = [
                {x: -1, y:  t, z:  0}, {x:  1, y:  t, z:  0}, {x: -1, y: -t, z:  0}, {x:  1, y: -t, z:  0},
                {x:  0, y: -1, z:  t}, {x:  0, y:  1, z:  t}, {x:  0, y: -1, z: -t}, {x:  0, y:  1, z: -t},
                {x:  t, y:  0, z: -1}, {x:  t, y:  0, z:  1}, {x: -t, y:  0, z: -1}, {x: -t, y:  0, z:  1}
            ].map(v => {
                let len = Math.hypot(v.x, v.y, v.z);
                return { x: (v.x / len) * radius, y: (v.y / len) * radius, z: (v.z / len) * radius };
            });

            let faces = [
                [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
                [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
                [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
                [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
            ];

            let cx = Math.cos(hexAngX), sx = Math.sin(hexAngX);
            let cy = Math.cos(hexAngY), sy = Math.sin(hexAngY);
            let cz = Math.cos(hexAngZ), sz = Math.sin(hexAngZ);

            let rotatedVerts = rawVerts.map(v => {
                let y1 = v.y * cx - v.z * sx;
                let z1 = v.y * sx + v.z * cx;
                let x1 = v.x;

                let x2 = x1 * cy + z1 * sy;
                let z2 = -x1 * sy + z1 * cy;
                let y2 = y1;

                let x3 = x2 * cz - y2 * sz;
                let y3 = x2 * sz + y2 * cz;
                let z3 = z2;

                let scaledX = x3 * introProgress;
                let scaledY = y3 * introProgress;

                let px = Math.floor(screenX + (scaledX / rotY) * INTERNAL_WIDTH);
                let py = Math.floor(screenCenterY - (scaledY / rotY) * INTERNAL_HEIGHT);
                return { x: px, y: py, z: z3 };
            });

            function fillTriangle(p0, p1, p2, shade) {
                let minX = Math.max(0, Math.min(p0.x, p1.x, p2.x));
                let maxX = Math.min(INTERNAL_WIDTH, Math.max(p0.x, p1.x, p2.x) + 1);
                let minY = Math.max(0, Math.min(p0.y, p1.y, p2.y));
                let maxY = Math.min(INTERNAL_HEIGHT, Math.max(p0.y, p1.y, p2.y) + 1);

                let area = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
                if (Math.abs(area) < 0.5) return;

                for (let sy = minY; sy < maxY; sy++) {
                    for (let sx = minX; sx < maxX; sx++) {
                        if (rotY < zBuffer[sx]) {
                            let s = ((p1.x - sx) * (p2.y - sy) - (p1.y - sy) * (p2.x - sx)) / area;
                            let t = ((p2.x - sx) * (p0.y - sy) - (p2.y - sy) * (p0.x - sx)) / area;
                            let u = 1.0 - s - t;

                            if (s >= 0 && t >= 0 && u >= 0) {
                                let idx = (sy * INTERNAL_WIDTH + sx) * 4;
                                buf[idx]     = Math.min(255, shade * orbTintR);
                                buf[idx + 1] = Math.min(255, shade * orbTintG);
                                buf[idx + 2] = Math.min(255, shade * orbTintB);
                                buf[idx + 3] = 255;
                            }
                        }
                    }
                }
            }

            for (let i = 0; i < faces.length; i++) {
                let [i0, i1, i2] = faces[i];
                let p0 = rotatedVerts[i0];
                let p1 = rotatedVerts[i1];
                let p2 = rotatedVerts[i2];

                let faceShade = 100 + (i * 7) % 90;
                fillTriangle(p0, p1, p2, faceShade);
            }
        }

        ctx.putImageData(screenBuffer, 0, 0);
    }

    function loop() {
        updatePlayer();
        render();
        requestAnimationFrame(loop);
    }
    loop();
};

console.log("// render.js loaded //");
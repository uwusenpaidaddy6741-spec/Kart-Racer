export default {
    async fetch(request, env) {

        const url = new URL(request.url);

        // ============================================================
// MULTIPLAYER API — forward requests to the shared room server
// ============================================================
if (url.pathname.startsWith("/api/rooms")) {
    if (!env.ROOMS) {
        return Response.json(
            { error: "ROOMS Durable Object binding is missing" },
            { status: 500 }
        );
    }

    const id = env.ROOMS.idFromName("kart-racer-global");
    const roomServer = env.ROOMS.get(id);

    return roomServer.fetch(request);
}

        // ============================================================
        // LEADERBOARD API
        // ============================================================

        if (url.pathname === "/api/leaderboard") {

            try {

                // ====================================================
                // GET LEADERBOARD
                // ====================================================

                if (request.method === "GET") {

                    const track =
                        url.searchParams.get("track");

                    if (!track) {

                        return new Response(
                            JSON.stringify({
                                error: "Missing track"
                            }),
                            {
                                status: 400,
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                }
                            }
                        );
                    }

                    if (!env.MY_DB) {

                        return new Response(
                            JSON.stringify({
                                error:
                                    "MY_DB binding is missing"
                            }),
                            {
                                status: 500,
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                }
                            }
                        );
                    }

                    const result =
                        await env.MY_DB
                            .prepare(`
                                SELECT name, time
                                FROM leaderboard
                                WHERE track = ?
                                ORDER BY time ASC, id ASC
                                LIMIT 5
                            `)
                            .bind(track)
                            .all();

                    return new Response(
                        JSON.stringify(
                            result.results
                        ),
                        {
                            status: 200,
                            headers: {
                                "Content-Type":
                                    "application/json"
                            }
                        }
                    );
                }


                // ====================================================
                // POST NEW LEADERBOARD TIME
                // ====================================================

                if (request.method === "POST") {

                    const data =
                        await request.json();

                    const track =
                        data.track;

                    const name =
                        data.name;

                    const time =
                        data.time;


                    // ------------------------------------------------
                    // VALIDATE DATA
                    // ------------------------------------------------

                    if (
                        !track ||
                        !name ||
                        typeof time !== "number" ||
                        !Number.isFinite(time) ||
                        time <= 0
                    ) {

                        return new Response(
                            JSON.stringify({
                                error:
                                    "Missing or invalid data"
                            }),
                            {
                                status: 400,
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                }
                            }
                        );
                    }


                    if (!env.MY_DB) {

                        return new Response(
                            JSON.stringify({
                                error:
                                    "MY_DB binding is missing"
                            }),
                            {
                                status: 500,
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                }
                            }
                        );
                    }


                    // ------------------------------------------------
                    // INSERT + CLEANUP
                    // ------------------------------------------------
                    //
                    // First insert the new time.
                    //
                    // Then delete every time for this track
                    // that isn't in the fastest 5.
                    //
                    // ------------------------------------------------

                    const insert =
                        env.MY_DB
                            .prepare(`
                                INSERT INTO leaderboard
                                (track, name, time)
                                VALUES (?, ?, ?)
                            `)
                            .bind(
                                track,
                                name.trim().slice(0, 20),
                                time
                            );


                    const cleanup =
                        env.MY_DB
                            .prepare(`
                                DELETE FROM leaderboard
                                WHERE track = ?
                                AND id NOT IN (
                                    SELECT id
                                    FROM leaderboard
                                    WHERE track = ?
                                    ORDER BY time ASC, id ASC
                                    LIMIT 5
                                )
                            `)
                            .bind(
                                track,
                                track
                            );


                    await env.MY_DB.batch([
                        insert,
                        cleanup
                    ]);


                    // ------------------------------------------------
                    // GET THE NEW TOP 5
                    // ------------------------------------------------

                    const updated =
                        await env.MY_DB
                            .prepare(`
                                SELECT name, time
                                FROM leaderboard
                                WHERE track = ?
                                ORDER BY time ASC, id ASC
                                LIMIT 5
                            `)
                            .bind(track)
                            .all();


                    return new Response(
                        JSON.stringify({
                            success: true,
                            leaderboard:
                                updated.results
                        }),
                        {
                            status: 200,
                            headers: {
                                "Content-Type":
                                    "application/json"
                            }
                        }
                    );
                }


                // ====================================================
                // METHOD NOT ALLOWED
                // ====================================================

                return new Response(
                    JSON.stringify({
                        error:
                            "Method not allowed"
                    }),
                    {
                        status: 405,
                        headers: {
                            "Content-Type":
                                "application/json"
                        }
                    }
                );


            } catch (error) {

                console.error(
                    "LEADERBOARD ERROR:",
                    error
                );

                return new Response(
                    JSON.stringify({
                        error:
                            "Leaderboard server error",

                        details:
                            error?.message ||
                            String(error)
                    }),
                    {
                        status: 500,
                        headers: {
                            "Content-Type":
                                "application/json"
                        }
                    }
                );
            }
        }


        // ============================================================
        // SERVE GAME FILES
        // ============================================================

               return env.ASSETS.fetch(request);
    }
};

    

export class KartRooms {
    constructor(state, env) {
        this.state = state;
        this.env = env;
    }

    async fetch(request) {
        const url = new URL(request.url);
        const parts = url.pathname.split("/").filter(Boolean);

        // LIVE RACE CONNECTION
if (
    parts[0] === "api" &&
    parts[1] === "rooms" &&
    parts[3] === "connect"
) {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return Response.json(
            { error: "WebSocket upgrade required" },
            { status: 426 }
        );
    }

    const roomId = parts[2];
    const playerId = url.searchParams.get("playerId") || "";
    const room = await this.state.storage.get(`room:${roomId}`);

    if (!room) {
        return Response.json(
            { error: "Room not found" },
            { status: 404 }
        );
    }

    const player = room.players.find(p => p.id === playerId);

    if (!player) {
        return Response.json(
            { error: "Join the room before connecting" },
            { status: 403 }
        );
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.state.acceptWebSocket(server, [roomId]);

    server.serializeAttachment({
        roomId,
        playerId,
        playerName: player.name
    });

    server.send(JSON.stringify({
        type: "connected",
        roomId,
        playerId,
        hostId: room.hostId,
        status: room.status,
        startAt: room.startAt || null,
        players: room.players
    }));

    this.broadcastToRoom(roomId, {
        type: "player-joined",
        playerId,
        playerName: player.name
    }, server);

    return new Response(null, {
        status: 101,
        webSocket: client
    });
}

        // Send a message to everyone connected to one room.
broadcastToRoom(roomId, message, exceptSocket = null) {
    const sockets = this.state.getWebSockets(roomId);
    const payload = JSON.stringify(message);

    for (const socket of sockets) {
        if (socket === exceptSocket) continue;

        try {
            socket.send(payload);
        } catch (error) {
            console.warn("Could not send multiplayer update:", error);
        }
    }
}

// Handle messages sent by connected racers.
async webSocketMessage(socket, message) {
    let data;

    try {
        data = JSON.parse(message);
    } catch {
        return;
    }

    const attachment = socket.deserializeAttachment();

    if (!attachment?.roomId || !attachment?.playerId) {
        socket.close(1008, "Missing player information");
        return;
    }

    const { roomId, playerId, playerName } = attachment;
    const storageKey = `room:${roomId}`;
    const room = await this.state.storage.get(storageKey);

    if (!room || !room.players.some(p => p.id === playerId)) {
        socket.close(1008, "Room membership not found");
        return;
    }

    // The room host starts a synchronized countdown.
    if (data.type === "start") {
        if (room.hostId !== playerId) {
            socket.send(JSON.stringify({
                type: "error",
                message: "Only the room host can start the race."
            }));
            return;
        }

        if (room.status !== "waiting") {
            return;
        }

        room.status = "racing";
        room.startAt = Date.now() + 5000;

        await this.state.storage.put(storageKey, room);

        this.broadcastToRoom(roomId, {
            type: "race-start",
            startAt: room.startAt
        });

        return;
    }

    // Broadcast the player's current position to their room.
    if (data.type === "state") {
        const numeric = value =>
            typeof value === "number" && Number.isFinite(value)
                ? value
                : null;

        const x = numeric(data.x);
        const y = numeric(data.y);
        const z = numeric(data.z);
        const rotation = numeric(data.rotation);
        const speed = numeric(data.speed);

        if (
            x === null ||
            y === null ||
            z === null ||
            rotation === null ||
            speed === null
        ) {
            return;
        }

        this.broadcastToRoom(roomId, {
            type: "player-state",
            playerId,
            playerName,
            x,
            y,
            z,
            rotation,
            speed
        }, socket);
    }
}

// Let the remaining racers know when a connection closes.
webSocketClose(socket, code, reason, wasClean) {
    const attachment = socket.deserializeAttachment();

    if (attachment?.roomId && attachment?.playerId) {
        this.broadcastToRoom(attachment.roomId, {
            type: "player-disconnected",
            playerId: attachment.playerId
        }, socket);
    }
}

webSocketError(socket, error) {
    console.warn("Kart Racer WebSocket error:", error);
}
        
        // Expected paths:
        // /api/rooms
        // /api/rooms/health
        // /api/rooms/ROOM_ID
        // /api/rooms/ROOM_ID/join
        // /api/rooms/ROOM_ID/leave

        if (url.pathname === "/api/rooms/health") {
            return Response.json({
                success: true,
                service: "Kart Racer multiplayer",
                status: "online"
            });
        }

        // List public rooms
        if (url.pathname === "/api/rooms" && request.method === "GET") {
            const storedRooms = await this.state.storage.list({
                prefix: "room:"
            });

            const rooms = [];

            for (const room of storedRooms.values()) {
                if (!room.private) {
                    rooms.push({
                        id: room.id,
                        name: room.name,
                        track: room.track,
                        maxPlayers: room.maxPlayers,
                        players: room.players.length,
                        status: room.status
                    });
                }
            }

            return Response.json(rooms);
        }

        // Create a room
        if (url.pathname === "/api/rooms" && request.method === "POST") {
            let data;

            try {
                data = await request.json();
            } catch {
                return Response.json(
                    { error: "Invalid JSON" },
                    { status: 400 }
                );
            }

            const name = String(data.name || "Race Room")
                .trim()
                .slice(0, 30);

            const track = String(data.track || "1").slice(0, 40);
            const maxPlayers = Number(data.maxPlayers || 4);
            const isPrivate = Boolean(data.private);

            if (![2, 4, 6, 8].includes(maxPlayers)) {
                return Response.json(
                    { error: "Player limit must be 2, 4, 6, or 8" },
                    { status: 400 }
                );
            }

            const id = crypto.randomUUID().slice(0, 8);

            const room = {
                id,
                name,
                track,
                maxPlayers,
                private: isPrivate,
                players: [],
                hostId: null,
                status: "waiting",
                createdAt: Date.now()
            };

            await this.state.storage.put(`room:${id}`, room);

            return Response.json(
                { success: true, room },
                { status: 201 }
            );
        }

        // Join, leave, or view a particular room
        if (parts[0] === "api" && parts[1] === "rooms" && parts[2]) {
            const roomId = parts[2];
            const action = parts[3];
            const storageKey = `room:${roomId}`;
            const room = await this.state.storage.get(storageKey);

            if (!room) {
                return Response.json(
                    { error: "Room not found. It may have been closed." },
                    { status: 404 }
                );
            }

            // Get lobby information
            if (!action && request.method === "GET") {
                return Response.json({
                    success: true,
                    room: {
                        id: room.id,
                        name: room.name,
                        track: room.track,
                        maxPlayers: room.maxPlayers,
                        private: room.private,
                        players: room.players,
                        hostId: room.hostId,
                        status: room.status
                    }
                });
            }

            // Join room
            if (action === "join" && request.method === "POST") {
                let data;

                try {
                    data = await request.json();
                } catch {
                    return Response.json(
                        { error: "Invalid JSON" },
                        { status: 400 }
                    );
                }

                const playerId = String(data.playerId || "").slice(0, 80);
                const playerName = String(data.playerName || "Player")
                    .trim()
                    .slice(0, 20);

                if (!playerId) {
                    return Response.json(
                        { error: "Missing player ID. Refresh and try again." },
                        { status: 400 }
                    );
                }

                // Don't register the same browser twice in the same room.
                const existingPlayer = room.players.find(
                    player => player.id === playerId
                );

                if (existingPlayer) {
                    return Response.json({
                        success: true,
                        room: {
                            id: room.id,
                            name: room.name,
                            track: room.track,
                            maxPlayers: room.maxPlayers,
                            players: room.players,
                            hostId: room.hostId,
                            status: room.status
                        }
                    });
                }

                if (room.status !== "waiting") {
                    return Response.json(
                        { error: "This race has already started." },
                        { status: 409 }
                    );
                }

                if (room.players.length >= room.maxPlayers) {
                    return Response.json(
                        { error: "This room is full." },
                        { status: 409 }
                    );
                }

                room.players.push({
                    id: playerId,
                    name: playerName || "Player",
                    joinedAt: Date.now()
                });

                if (!room.hostId) {
                    room.hostId = playerId;
                }

                await this.state.storage.put(storageKey, room);

                return Response.json({
                    success: true,
                    room: {
                        id: room.id,
                        name: room.name,
                        track: room.track,
                        maxPlayers: room.maxPlayers,
                        players: room.players,
                        hostId: room.hostId,
                        status: room.status
                    }
                });
            }

            // Leave room
            if (action === "leave" && request.method === "POST") {
                let data;

                try {
                    data = await request.json();
                } catch {
                    return Response.json(
                        { error: "Invalid JSON" },
                        { status: 400 }
                    );
                }

                const playerId = String(data.playerId || "").slice(0, 80);

                if (!playerId) {
                    return Response.json(
                        { error: "Missing player ID." },
                        { status: 400 }
                    );
                }

                room.players = room.players.filter(
                    player => player.id !== playerId
                );

                // Transfer host status if the host leaves.
                if (room.hostId === playerId) {
                    room.hostId = room.players.length
                        ? room.players[0].id
                        : null;
                }

                // Remove empty rooms so abandoned rooms don't pile up.
                if (room.players.length === 0) {
                    await this.state.storage.delete(storageKey);
                    return Response.json({ success: true, closed: true });
                }

                await this.state.storage.put(storageKey, room);

                return Response.json({
                    success: true,
                    room: {
                        id: room.id,
                        name: room.name,
                        track: room.track,
                        maxPlayers: room.maxPlayers,
                        players: room.players,
                        hostId: room.hostId,
                        status: room.status
                    }
                });
            }
        }

        return Response.json(
            { error: "Multiplayer endpoint not found" },
            { status: 404 }
        );
    }
}

export default {
    async fetch(request, env) {

        const url = new URL(request.url);

        // ================================
        // API
        // ================================
        if (url.pathname === "/api/leaderboard") {

            try {

                // ================================
                // GET LEADERBOARD
                // ================================
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
                                    "Content-Type": "application/json"
                                }
                            }
                        );
                    }

                    if (!env.MY_DB) {
                        return new Response(
                            JSON.stringify({
                                error: "MY_DB binding is missing"
                            }),
                            {
                                status: 500,
                                headers: {
                                    "Content-Type": "application/json"
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
                                ORDER BY time ASC
                                LIMIT 5
                            `)
                            .bind(track)
                            .all();

                    return new Response(
                        JSON.stringify(result.results),
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/json"
                            }
                        }
                    );
                }

                // ================================
                // POST LEADERBOARD TIME
                // ================================
                if (request.method === "POST") {

                    const data =
                        await request.json();

                    const track = data.track;
                    const name = data.name;
                    const time = data.time;

                    if (
                        !track ||
                        !name ||
                        typeof time !== "number"
                    ) {
                        return new Response(
                            JSON.stringify({
                                error: "Missing or invalid data",
                                received: {
                                    track,
                                    name,
                                    time
                                }
                            }),
                            {
                                status: 400,
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            }
                        );
                    }

                    if (!env.MY_DB) {
                        return new Response(
                            JSON.stringify({
                                error: "MY_DB binding is missing"
                            }),
                            {
                                status: 500,
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            }
                        );
                    }

                    await env.MY_DB
                        .prepare(`
                            INSERT INTO leaderboard
                            (track, name, time)
                            VALUES (?, ?, ?)
                        `)
                        .bind(
                            track,
                            name,
                            time
                        )
                        .run();

                    return new Response(
                        JSON.stringify({
                            success: true
                        }),
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/json"
                            }
                        }
                    );
                }

                return new Response(
                    JSON.stringify({
                        error: "Method not allowed"
                    }),
                    {
                        status: 405,
                        headers: {
                            "Content-Type": "application/json"
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
                        error: "Leaderboard server error",
                        details: error?.message || String(error)
                    }),
                    {
                        status: 500,
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                );
            }
        }

        // ================================
        // SERVE GAME FILES
        // ================================
        return env.ASSETS.fetch(request);
    }
};

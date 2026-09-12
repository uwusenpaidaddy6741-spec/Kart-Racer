export default {
    async fetch(request, env) {

        const url = new URL(request.url);

        // API routes
        if (url.pathname.startsWith("/api/")) {

            // GET leaderboard
            if (
                url.pathname === "/api/leaderboard" &&
                request.method === "GET"
            ) {

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
                        headers: {
                            "Content-Type":
                                "application/json"
                        }
                    }
                );
            }

            // POST new leaderboard time
            if (
                url.pathname === "/api/leaderboard" &&
                request.method === "POST"
            ) {

                const data =
                    await request.json();

                const {
                    track,
                    name,
                    time
                } = data;

                if (
                    !track ||
                    !name ||
                    typeof time !== "number"
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
                        headers: {
                            "Content-Type":
                                "application/json"
                        }
                    }
                );
            }

            return new Response(
                JSON.stringify({
                    error:
                        "API endpoint not found"
                }),
                {
                    status: 404,
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );
        }

        // Serve the actual game files
        return env.ASSETS.fetch(request);
    }
};

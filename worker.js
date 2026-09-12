export default {
    async fetch(request, env) {

        const url = new URL(request.url);

        // API routes
        if (url.pathname.startsWith("/api/")) {

            if (url.pathname === "/api/leaderboard") {

                const track = url.searchParams.get("track");

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

                const result = await env.MY_DB
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
                            "Content-Type": "application/json"
                        }
                    }
                );
            }

            return new Response(
                JSON.stringify({
                    error: "API endpoint not found"
                }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // Serve the actual game files
        return env.ASSETS.fetch(request);
    }
};

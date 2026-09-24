export default {
    async fetch(request, env) {

        const url = new URL(request.url);

        // ============================================================
        // API ROUTES
        // ============================================================

        if (url.pathname.startsWith("/api/")) {

            // --------------------------------------------------------
            // CHECK DATABASE BINDING
            // --------------------------------------------------------

            if (!env.MY_DB) {

                return new Response(
                    JSON.stringify({
                        error:
                            "MY_DB D1 binding is missing from the Worker."
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


            // ========================================================
            // GET LEADERBOARD
            // ========================================================

            if (
                url.pathname === "/api/leaderboard" &&
                request.method === "GET"
            ) {

                const track =
                    url.searchParams.get("track");

                if (!track) {

                    return new Response(
                        JSON.stringify({
                            error:
                                "Missing track"
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

                try {

                    const result =
                        await env.MY_DB
                            .prepare(`
                                SELECT
                                    name,
                                    time
                                FROM leaderboard
                                WHERE track = ?
                                ORDER BY time ASC
                                LIMIT 5
                            `)
                            .bind(track)
                            .all();

                    return new Response(
                        JSON.stringify(
                            result.results || []
                        ),
                        {
                            status: 200,
                            headers: {
                                "Content-Type":
                                    "application/json"
                            }
                        }
                    );

                } catch (error) {

                    console.error(
                        "GET leaderboard error:",
                        error
                    );

                    return new Response(
                        JSON.stringify({
                            error:
                                "Database error while loading leaderboard.",
                            details:
                                error.message
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


            // ========================================================
            // POST LEADERBOARD TIME
            // ========================================================

            if (
                url.pathname === "/api/leaderboard" &&
                request.method === "POST"
            ) {

                try {

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
                            (
                                track,
                                name,
                                time
                            )
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
                                "Content-Type":
                                    "application/json"
                            }
                        }
                    );

                } catch (error) {

                    console.error(
                        "POST leaderboard error:",
                        error
                    );

                    return new Response(
                        JSON.stringify({
                            error:
                                "Database error while saving leaderboard time.",
                            details:
                                error.message
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


            // ========================================================
            // UNKNOWN API ROUTE
            // ========================================================

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


        // ============================================================
        // SERVE GAME FILES
        // ============================================================

        return env.ASSETS.fetch(request);
    }
};

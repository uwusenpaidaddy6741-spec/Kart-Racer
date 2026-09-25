export default {
    async fetch(request, env) {

        const url = new URL(request.url);

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

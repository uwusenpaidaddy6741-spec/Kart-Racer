export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // POST new leaderboard score
        if (
            url.pathname === "/api/leaderboard" &&
            request.method === "POST"
        ) {
            try {
                const data = await request.json();

                const track = String(data.track);
                const name = String(data.name).trim();
                const time = Number(data.time);

                if (
                    !["1", "2", "3"].includes(track) ||
                    !name ||
                    !Number.isFinite(time) ||
                    time <= 0
                ) {
                    return new Response("Invalid score", {
                        status: 400
                    });
                }

                await env.MY_DB
                    .prepare(
                        "INSERT INTO leaderboard (track, name, time) VALUES (?, ?, ?)"
                    )
                    .bind(track, name, time)
                    .run();

                return Response.json({
                    success: true
                });
            } catch {
                return new Response("Invalid request", {
                    status: 400
                });
            }
        }

        // GET leaderboard
        if (
            url.pathname === "/api/leaderboard" &&
            request.method === "GET"
        ) {
            const track = url.searchParams.get("track");

            if (!track) {
                return new Response("Missing track", {
                    status: 400
                });
            }

            const result = await env.MY_DB
                .prepare(
                    "SELECT name, time FROM leaderboard WHERE track = ? ORDER BY time ASC LIMIT 5"
                )
                .bind(track)
                .all();

            return Response.json(result.results);
        }

        return env.ASSETS.fetch(request);
    }
};

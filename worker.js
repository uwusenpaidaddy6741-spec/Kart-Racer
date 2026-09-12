export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/api/leaderboard") {
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

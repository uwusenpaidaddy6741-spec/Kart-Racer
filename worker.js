export default {
    async fetch(request, env) {
        return new Response("Kart Racer API is online!", {
            headers: {
                "Content-Type": "text/plain"
            }
        });
    }
};

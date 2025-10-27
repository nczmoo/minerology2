window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

function fetch_rand(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}
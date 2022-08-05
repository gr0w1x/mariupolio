const logo = document.getElementById("logo");
const gameItems = document.getElementById("game-items");

animateLogo("MARIUPOLIO", logo, {
    "I": {
        probability: 0.1,
        to: "1",
        class: "logo-1",
    },
    "O": {
        probability: 0.1,
        to: "0",
        class: "logo-0",
    },
});

Array.from(Object.values(games)).forEach(game => {
    const gameItem = document.createElement("a");
    gameItem.classList.add("list-item", "no-text-link");
    gameItem.href = game.url;
    gameItem.innerHTML = `
        <button>
            ${game.icon}
            <span>${game.name}</span>
        </button>
    `;
    gameItems.appendChild(gameItem);
});

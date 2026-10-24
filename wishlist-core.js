(function (root) {
  const seed = [
    { id: "bedding", title: "Sengelinned sæt til 2 dyner og puder", description: "Dynebetræk og pudebetræk · str. 140 × 220", price: "450 kr.", url: "https://www.home-tex.dk/shop/bambus-sengetoej-140x220-15489p.html", image: "https://www.home-tex.dk/images/Beige-1.webp" },
    { id: "sheet", title: "Stræklagen", description: "Stræklagen til halvandenmandsseng, 140 × 200.", price: "150–200 kr.", url: "https://jysk.dk/sovevaerelse/lagner/kuvertlagner/kuvertlagen-edith-140x200x6-10-hvid?article=1638501#product-intro", image: "https://cdn1.jysk.com/getimage/wd3.medium/262005" },
    { id: "running-shirt", title: "Langærmet sportstrøje", description: "En man kan løbe i og holde varmen i koldere vejr. Uden hætte.", price: "300–350 kr.", url: "https://www.zalando.dk/under-armour-tech-20-12-langarmet-t-shirt-black-007-un242g056-q32.html", image: "https://img01.ztat.net/article/spp-media-p1/2bb3c63d607c455bbec77448484003f4/4cf6bdd5ff884005a9cf6c54495cf411.png?imwidth=1800" },
    { id: "plants", title: "Penge til planter", description: "Til planter inde i lejligheden.", price: "Ca. 100 kr.", url: "https://www.silvan.dk/produkt/violinfigen-ficus-lyrata-oe17-cm-7300-9846407", image: "https://webassets.silvan.dk/resources/Images/9846407_Large.jpg?width=480&height=480" },
    { id: "belt", title: "Bælte", description: "Gerne med justeringssystem som Nordform.", price: "Ca. 1.199 kr. (for 3)", url: "https://nordformstore.dk/vare/triple-saet/", image: "https://nordformstore.dk/wp-content/uploads/2023/12/Triple-Set-product-pic.jpg" },
    { id: "keyboard", title: "Tastatur", description: "Hotswap. RGB er ikke nødvendigt; gerne MX Brown eller Red.", price: "Ca. 680 kr.", url: "https://www.maxgaming.dk/dk/gaming-tastatur/one-3-tkl-pure-white-rgb-hotswap-tastatur-mx-red", image: "https://www.maxgaming.dk/bilder/artiklar/zoom/26967_1.jpg?m=1705476560" },
    { id: "socks", title: "Sokker", description: "Simpelt design, men gerne lidt kvalitet.", price: "Ca. 300 kr.", url: "https://www.zalando.dk/boss-5-pack-stroemper-black-bb182f08n-q11.html", image: "https://img01.ztat.net/article/spp-media-p1/f7e1e59ed409419cb1acd9ee2eb8b2cd/eea48a5529f14525a0a294195db0c11d.jpg?imwidth=1800&filter=packshot" },
    { id: "toothbrush", title: "Elektrisk tandbørste", description: "Skulle være ret god til prisen.", price: "Ca. 600 kr.", url: "https://www.compumail.dk/da/p/oral-b-sort-lava-tandborste-1000842382", image: "https://cdn.cs.1worldsync.com/2d/46/2d46b060-0197-4202-baf7-aba9ae5a987f.jpg" }
  ];

  function starterWishes() {
    return seed.map(wish => ({ ...wish }));
  }

  function moveWish(wishes, id, direction) {
    const from = wishes.findIndex(wish => String(wish.id) === String(id));
    const to = from + direction;
    if (from < 0 || to < 0 || to >= wishes.length) return wishes;

    const next = [...wishes];
    [next[from], next[to]] = [next[to], next[from]];
    return next;
  }

  function reorderWishes(wishes, requestedIds) {
    const byId = new Map(wishes.map(wish => [String(wish.id), wish]));
    const seen = new Set();
    const ordered = [];

    for (const id of requestedIds) {
      const key = String(id);
      const wish = byId.get(key);
      if (wish && !seen.has(key)) {
        ordered.push(wish);
        seen.add(key);
      }
    }

    // A missing DOM id must never turn a reorder into a deletion.
    for (const wish of wishes) {
      const key = String(wish.id);
      if (!seen.has(key)) ordered.push(wish);
    }
    return ordered;
  }

  function upsertWish(wishes, wish) {
    const index = wishes.findIndex(item => String(item.id) === String(wish.id));
    if (index < 0) return [wish, ...wishes];
    return wishes.map((item, currentIndex) => currentIndex === index ? wish : item);
  }

  function removeWish(wishes, id) {
    return wishes.filter(wish => String(wish.id) !== String(id));
  }

  function normalizeWishes(list) {
    if (!Array.isArray(list)) return [];
    return list
      .filter(item => item && typeof item.title === "string")
      .map((item, index) => ({
        id: String(item.id || root.crypto?.randomUUID?.() || `wish-${Date.now()}-${index}`),
        title: item.title,
        description: String(item.description || ""),
        price: String(item.price || ""),
        url: String(item.url || ""),
        image: String(item.image || "")
      }));
  }

  function encodeSnapshot(wishes) {
    const bytes = new TextEncoder().encode(JSON.stringify(wishes));
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeSnapshot(encoded) {
    try {
      const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      const list = JSON.parse(new TextDecoder().decode(bytes));
      return Array.isArray(list) ? normalizeWishes(list) : null;
    } catch {
      return null;
    }
  }

  function reviewUrl(currentUrl, wishes) {
    const url = new URL(currentUrl);
    url.searchParams.set("view", "reviewer");
    url.hash = `list=${encodeSnapshot(wishes)}`;
    return url.href;
  }

  const api = {
    starterWishes,
    moveWish,
    reorderWishes,
    upsertWish,
    removeWish,
    normalizeWishes,
    encodeSnapshot,
    decodeSnapshot,
    reviewUrl
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.WishlistCore = api;
})(typeof globalThis !== "undefined" ? globalThis : window);

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Core = require("../wishlist-core.js");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const publishedWishes = JSON.parse(fs.readFileSync(path.join(root, "data", "wishes.json"), "utf8"));

const ids = wishes => wishes.map(wish => wish.id);

test("starter data retains all eight wishes and unique ids", () => {
  const wishes = Core.starterWishes();
  assert.equal(wishes.length, 8);
  assert.equal(new Set(ids(wishes)).size, 8);
  assert.ok(wishes.every(wish => !Object.hasOwn(wish, "taken")));
});

test("add and edit preserve existing wishes and order", () => {
  const start = Core.starterWishes();
  const added = Core.upsertWish(start, {id:"new",title:"Ny lampe"});
  assert.equal(added.length, start.length + 1);
  assert.equal(added[0].title, "Ny lampe");
  const edited = Core.upsertWish(added, {...added[0],title:"Bordlampe"});
  assert.equal(edited.length, added.length);
  assert.equal(edited[0].title, "Bordlampe");
  assert.equal(start[0].title, "Sengelinned sæt til 2 dyner og puder");
});

test("delete removes just the selected wish", () => {
  const start = Core.starterWishes();
  const next = Core.removeWish(start, "plants");
  assert.equal(next.length, start.length - 1);
  assert.equal(next.some(wish => wish.id === "plants"), false);
});

test("arrows reorder a wish and respect list boundaries", () => {
  const start = Core.starterWishes();
  const moved = Core.moveWish(start, "plants", -1);
  assert.deepEqual(ids(moved).slice(0, 5), ["bedding", "sheet", "plants", "running-shirt", "belt"]);
  assert.equal(moved.length, start.length);
  assert.equal(Core.moveWish(start, "bedding", -1), start);
  assert.equal(Core.moveWish(start, "missing", 1), start);
});

test("dragging preserves every wish if a card id is missing", () => {
  const start = Core.starterWishes();
  const missingDomIds = start.map(() => undefined);
  assert.deepEqual(ids(Core.reorderWishes(start, missingDomIds)), ids(start));
  const moved = Core.reorderWishes(start, ["toothbrush", "bedding"]);
  assert.deepEqual(ids(moved), ["toothbrush", "bedding", "sheet", "running-shirt", "plants", "belt", "keyboard", "socks"]);
  assert.equal(new Set(ids(moved)).size, start.length);
});

test("drag order ignores unknown and duplicate ids", () => {
  const start = Core.starterWishes().slice(0, 3);
  assert.deepEqual(ids(Core.reorderWishes(start, ["sheet", "unknown", "sheet"])), ["sheet", "bedding", "running-shirt"]);
});

test("rendered cards include the ids required by drag reordering", () => {
  assert.match(script, /data-wish-id="\$\{escapeHtml\(wish\.id\)\}"/);
  assert.match(script, /item\.dataset\.wishId/);
  assert.match(script, /WishlistCore\.reorderWishes\(wishes,\s*order\)/);
});

test("snapshot round-trip keeps Danish text and order", () => {
  const wishes = Core.moveWish(Core.starterWishes(), "toothbrush", -1);
  assert.deepEqual(Core.decodeSnapshot(Core.encodeSnapshot(wishes)), wishes);
});

test("invalid snapshots are rejected", () => {
  assert.equal(Core.decodeSnapshot("bad data"), null);
  assert.equal(Core.decodeSnapshot(btoa("{}")), null);
});

test("old browser data is cleaned of removed reservation fields", () => {
  const cleaned = Core.normalizeWishes([{id:"old",title:"Wish",taken:true,description:"Note"}]);
  assert.deepEqual(cleaned, [{id:"old",title:"Wish",description:"Note",price:"",url:"",image:""}]);
});

test("repository data starts with all wishes", () => {
  assert.deepEqual(publishedWishes, Core.starterWishes());
});

test("share links keep one stable read-only reviewer URL", () => {
  const review = new URL(Core.reviewUrl("https://example.test/?campaign=x#old-snapshot"));
  assert.equal(review.searchParams.get("view"), "reviewer");
  assert.equal(review.searchParams.get("campaign"), "x");
  assert.equal(review.hash, "");
});

test("Pages app has creator/reviewer modes and mobile safe-area/touch styles", () => {
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /wishlist-core\.js/);
  assert.match(script, /get\("view"\) === "reviewer"/);
  assert.match(script, /if \(action === "share" && !reviewerMode\)/);
  assert.match(script, /data\/wishes\.json/);
  assert.match(script, /data-action="publish"/);
  assert.match(script, /Onskeseddel\/edit\/main\/data\/wishes\.json/);
  assert.doesNotMatch(script, /Find den helt rigtige gave|Her er ønskerne på listen|Ønskelisten er delt med dig — god gavejagt!/);
  assert.doesNotMatch(script, /toggleTaken|Reserver ønske|updatedCreatorUrl|taken/);
  assert.doesNotMatch(css, /reserve-button|\.reserved\{/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@media\s*\(max-width:\s*600px\)/);
  assert.match(css, /flex:\s*0\s+0\s+44px/);
  assert.match(css, /touch-action:\s*none/);
});

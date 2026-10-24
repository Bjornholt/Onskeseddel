# Ønskeliste

A static wishlist for GitHub Pages. The creator can add, edit, delete, and reorder wishes. Guests use a separate read-only reviewer URL.

## GitHub Pages

Keep `index.html`, `styles.css`, `script.js`, and `wishlist-core.js` in the repository root. In the repository's **Settings → Pages**, publish the `main` branch from the root folder.

## How saves work

Wish edits are saved in the creator's browser and included in new reviewer links. The reviewer can see the wishes but cannot change them. GitHub Pages cannot accept edits to a repository file from a visitor's browser.

## Tests

The frontend tests use Node's built-in test runner and no packages. Run them with `npm test` (Node.js required for development/testing; the published site itself does not need Node).

# Ønskeliste

A static wishlist for GitHub Pages. The creator can add, edit, delete, and reorder wishes. Reviewers use one stable, read-only link.

## GitHub Pages

Keep the site files and `data/wishes.json` in the repository. In **Settings → Pages**, publish the `main` branch from the root folder.

## Publish the shared list

1. Make changes in the creator view. They are saved in that browser.
2. Click **Kopiér til GitHub**. The latest list is copied as JSON and the GitHub editor opens.
3. In the editor, select the existing file contents, paste the copied JSON, and commit the change to `main`. If clipboard access is unavailable, the app downloads `wishes.json` instead; upload that file into the `data` folder.
4. GitHub Pages publishes the update. Reviewers keep using the same reviewer link and see the latest published list.

The reviewer page reads `data/wishes.json` directly. Publishing may take a few minutes. The JSON file is public, like the GitHub Pages site.

## Tests

The frontend tests use Node's built-in test runner and no packages. Run them with `npm test` (Node.js required for development/testing; the published site itself does not need Node).

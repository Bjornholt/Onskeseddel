# Ønskeliste

A static wishlist for GitHub Pages. The creator can add, edit, delete, and reorder wishes. Reviewers use one stable, read-only link.

## GitHub Pages

Keep the site files and `data/wishes.json` in the repository. In **Settings → Pages**, publish the `main` branch from the root folder.

## Publish the shared list

1. Make changes in the creator view. They are saved in that browser.
2. Click **Download wishes.json**. The latest list is downloaded and GitHub's upload page opens.
3. Upload the downloaded file into the `data` folder, replace the existing file if asked, and commit the change to `main`.
4. GitHub Pages publishes the update. Reviewers keep using the same reviewer link and see the latest published list.

The reviewer page reads `data/wishes.json` directly. Publishing may take a few minutes. The JSON file is public, like the GitHub Pages site.

## Tests

The frontend tests use Node's built-in test runner and no packages. Run them with `npm test` (Node.js required for development/testing; the published site itself does not need Node).

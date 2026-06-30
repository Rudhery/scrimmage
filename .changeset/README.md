# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets). It records
intended version bumps and changelog entries for the publishable packages in this monorepo
(`@scrimmage/core`, `@scrimmage/storage-sqlite`).

When you make a change that should be released, run:

```bash
npm run changeset
```

…and follow the prompts. Commit the generated file in this folder along with your change.

# Publishing @usualui/lint

The npm package is `@usualui/lint`. Its executable remains `usual-design`, so project scripts and existing CLI commands keep the same name. Other Usual packages can share the `@usualui` scope without becoming part of this package.

No npm release is implied by this configuration. The initial registry check returned no public package, and the local npm session was unauthorized. Scope ownership and publishing permission need an authenticated npm owner.

## One-time owner setup

1. Sign into npm and create or confirm ownership of the `usualui` user/organization scope. Grant the publishing account permission for public packages. Do not paste credentials or tokens into issues or chat.
2. Review the initial `0.1.0` candidate, license, release notes, and known compatibility boundaries.
3. For the first package publication, use an authenticated owner session. From a clean checkout, run the checks in the [maintainer guide](maintaining.md) and `npm run verify:package`. Then explicitly publish the verified archive:

   ```sh
   npm login
   npm whoami
   npm publish .usual-design/artifacts/usualui-lint-0.1.0.tgz --access public --ignore-scripts --registry https://registry.npmjs.org/
   ```

   Complete npm's authentication/2FA prompts yourself. This command is a public release, not a dry run. A local initial publish does not have GitHub provenance. Do not rerun it blindly after an uncertain response; check the registry first.

4. In the package's npm settings, add a GitHub Actions trusted publisher:

   | Setting           | Value          |
   | ----------------- | -------------- |
   | Organization/user | `usual-labs`   |
   | Repository        | `usual-design` |
   | Workflow filename | `publish.yml`  |
   | Environment       | `npm`          |
   | Allowed action    | Publish        |

5. In GitHub, configure the `npm` environment to allow only `main`. Add required reviewers if the team wants a separate release approval. The workflow already refuses other branches; environment protections are additional platform settings, not established by this file.
6. Use the workflow for the next unpublished version. Under npm's current rules, a new trusted-publisher configuration must complete a successful publication within two days or it expires. Create it when ready to release, not weeks ahead.

No `NPM_TOKEN` repository secret is required for trusted publishing. Do not configure npm's organization and GitHub's organization as if they were the same identity.

## Verify or publish a subsequent version

Update the version in `package.json`, `package-lock.json`, and `src/cli.ts`, plus the changelog and affected examples. Commit and push to `main`.

In **Actions → Publish npm package → Run workflow**, choose `main` and enter the exact stable version:

- Leave **publish** unchecked to run checks, install-test the packed archive, perform `npm publish --dry-run`, and retain the archive and proof as a workflow artifact.
- Check **publish** only to authorize a public npm release. The workflow publishes the same archive that passed the installed-package smoke test, with provenance.

The workflow uses GitHub-hosted runners, Node 22, npm 11.5.1, and `id-token: write` for OIDC. Local development remains pinned to npm 10.9.8. No publish happens on a normal push, pull request, or tag. Releases are serialized and never canceled midway by a newer run. This initial workflow supports stable versions published to `latest`; prerelease distribution needs a deliberate later change.

If publishing fails or the result is uncertain, inspect the workflow and registry before retrying. npm versions cannot be overwritten:

```sh
npm view @usualui/lint version dist-tags --json
npm view @usualui/lint@0.1.0 dist.integrity --json
```

Use the actual release version in the second command and compare its integrity with the workflow's `package-smoke.json`. Verify a clean installation separately. Once a public release exists, users can install it with:

```sh
npm install --save-dev @usualui/lint
npx --no-install usual-design --help
```

For projects configured with the earlier unpublished `@usual/design-lint` candidate, install the new package and rerun `usual-design setup` in preview mode. Generated hook runners contain the package path; review and apply their update with `--write` before relying on native hooks.

## References

- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) — runtime requirements, exact workflow/environment identity, two-day initial validation, and automatic provenance.
- [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish/) — scoped public access, tarball publishing, and dry runs.

Configuration and dry runs prove preparation, not npm ownership or successful public publication.

# Branch Protection Rules 

Apply these rules in **GitHub → Settings → Branches → Add branch protection rule** for the `main` branch.

## Branch Name Pattern

```
main
```

## Required Settings

### 1. Require a Pull Request Before Merging

- **Require a pull request before merging**
- **Require approvals** → Set to **1**
- **Dismiss stale pull request approvals when new commits are pushed**
- **Require review from Code Owners** (after CODEOWNERS file is added)

### 2. Require Status Checks to Pass Before Merging

- **Require status checks to pass before merging**
- **Require branches to be up to date before merging**
- Add these required status checks:
  - `aeryion-lint`
  - `aeryion-typecheck`
  - `aeryion-test`
  - `coltiva-lint`
  - `coltiva-typecheck`
  - `coltiva-test`
  - `linktrade-backend-lint`
  - `linktrade-backend-typecheck`
  - `linktrade-backend-test`
  - `linktrade-web-lint`
  - `shared-lint`
  - `shared-typecheck`
  - `shared-test`

### 3. Require Signed Commits

- **Require signed commits**

> All contributors must configure GPG or SSH commit signing.
> Guide: https://docs.github.com/en/authentication/managing-commit-signature-verification

### 4. Require Linear History

- **Require linear history**

> This enforces squash merging or rebase merging. No merge commits allowed.
> Recommended: use **Squash and merge** as the default merge strategy.

### 5. Additional Recommended Settings

- **Do not allow bypassing the above settings** (applies to admins too)
- **Restrict who can push to matching branches** → Limit to repository admins
- **Allow force pushes** → Disabled
- **Allow deletions** → Disabled

## Merge Strategy Configuration

Go to **Settings → General → Pull Requests**:

- **Allow squash merging** (set as default)
- **Allow merge commits** (disable)
- **Allow rebase merging**
- **Always suggest updating pull request branches**
- **Automatically delete head branches**

## CODEOWNERS File

Create `.github/CODEOWNERS` in the repository:

```
/aeryion/    @aeris-group/aeryion-team
/coltiva/    @aeris-group/coltiva-team
/linktrade/  @aeris-group/linktrade-team
/shared/     @aeris-group/platform-team
```


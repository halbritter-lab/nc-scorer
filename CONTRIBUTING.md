# Contributing to NC-Scorer

First off, thank you for considering contributing to NC-Scorer!

## Where do I go from here?

If you've noticed a bug or have a feature request, [make one](https://github.com/halbritter-lab/nc-scorer/issues/new)! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

If you have a general question, feel free to ask in the [Discussions section](https://github.com/halbritter-lab/nc-scorer/discussions).

## Fork & create a branch

If you decide to fix a bug or implement a feature, please fork the repository and create a new branch from `main`. A good branch name would be (where issue #123 is the ticket you're working on):

```bash
git checkout -b 123-fix-button-styling
```

## Get the test suite running

*(Placeholder: Add instructions on how to run the test suite here once testing is implemented.)*

## Implement your fix or feature

At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first :smile_cat:

## Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with NC-Scorer's main branch:

```bash
git remote add upstream git@github.com:halbritter-lab/nc-scorer.git
git checkout main
git pull upstream main
```

Then update your feature branch from your local copy of main, and push it!

```bash
git checkout 123-fix-button-styling
git rebase main
git push --force-with-lease origin 123-fix-button-styling
```

Finally, go to GitHub and make a Pull Request :D

## Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

To learn more about rebasing, check out [this guide](https://docs.github.com/en/get-started/using-git/about-git-rebase).

Once you've updated your branch, push the changes with `git push --force-with-lease`

## Merging a PR (for maintainers)

A PR can only be merged into main by a maintainer if:

*   It is passing CI.
*   It has been approved by at least one maintainer.
*   It has no requested changes.
*   It is up to date with current main.

Any maintainer is allowed to merge a PR if all of these conditions are met.

## Shipping a release (for maintainers)

Maintainers should follow the release process outlined in the project's internal documentation. *(Placeholder: Add details about the release process if applicable)*

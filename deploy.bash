#!/bin/bash
git checkout gh-pages
git pull origin gh-pages
git merge master
gulp build
git add -A
git commit -m "Update gh-pages version of comments."
git push
git checkout master

#!/bin/bash
# mirrors a website using wget, creates github repo and uploads the mirror to the gh-pages branch

DOMAIN=""
GHREPO=$DOMAIN
GHUSER=""
GHURL="git@github.com:$GHUSER/$GHREPO.git"
GHTOKEN=""

# clone website
wget -mkEpnp $DOMAIN

# get only newer and changed files
#wget -NmkEpnp $DOMAIN

# cd into website directory made by wget
cd $DOMAIN

# make cname file for domain redirection
echo $DOMAIN > CNAME

# create repo
curl -i -H "Authorization: token $GHTOKEN" -d '{ "name": "'$DOMAIN'", "auto_init": false, "private": false, "itignore_template": "nanoc"  }' https://api.github.com/user/repos
	
# initialize repo and upload to github to gh-pages directly
git init
git add *
git commit -m "first commit" 
git remote add origin $GHURL
git branch gh-pages
git checkout gh-pages
git push -u origin gh-pages
The setup... I already had golang installed... Annoyingly this is the first
thing I needed that depended on something in a mercurial database.

```
dnf install mercurial python-pygments -y
go get -v github.com/spf13/hugo
git subtree add --squash --prefix themes/detox https://github.com/allnightgrocery/hugo-theme-blueberry-detox.git master
```

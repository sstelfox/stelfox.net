---
title: Javascript Deobfuscation
---

There is a very very slick tool that impressively cleans up packed and
obfuscated javascript. It's entirely javascript based and the source can be
found [https://github.com/einars/js-beautify here]. There is also a hosted
version available [http://jsbeautifier.org/ here], or you can use the following
as a bookmarlet:

```js
javascript:(function(){s=document.getElementsByTagName('SCRIPT');tx='';sr=[];for(i=0;i<s.length;i++){with(s.item(i)){t=text;if(t){tx+=t;}else{sr.push(src)};}};with(window.open()){document.write('<textarea%20id="t">'+(sr.join("\n"))+"\n\n-----\n\n"+tx+'</textarea><script%20src="http://jsbeautifier.org/beautify.js"></script><script>with(document.getElementById("t")){value=js_beautify(value);with(style){width="99%";height="99%";borderStyle="none";}};</script>');document.close();}})();
```


#use

> open abe.json file

set domain

```json
"seo": {
  "domain":"http://www.mydomain.com/"
},
```

replace lang

if lang = "gb" but you want "en" into hreflang value, use

```json
"seo": {
	"replace": {
	  "gb": "en"
	}
},
```

Search same url

Example 1:

Url: /fr/my-blog.html
Hreflangs:
- /de/my-blog.html
- /es/my-blog.html
- /it/my-blog.html

the regex for the url should be something like : /(anything-here)/my-blog.html

```json
"seo": {
	"templates": {
		"blog": {
			"regex": "\/(.*?)\/(.*?).html",
			"substitute": "\/(.*?)\/$1.html",
		}
	}
},
```

Example 2:

Url: /my-blog.fr.html
Hreflangs:
- /my-blog.de.html
- /my-blog.es.html
- /my-blog.it.html

the regex for the url should be something like : /my-blog.(anything-here).html

```json
"seo": {
	"templates": {
		"blog": {
			"regex": "\/(.*?)\.(.*?).html",
			"substitute": "/$1\.(.*?).html",
		}
	}
},
```

Example 3:

Url: /france/my-blog.fr.html
Hreflangs:
- /deutschland/my-blog.de.html
- /espana/my-blog.es.html
- /italia/my-blog.it.html

the regex for the url should be something like : /(anything-here)/my-blog.(anything-here).html

```json
"seo": {
	"templates": {
		"blog": {
	        "regex": "\/(.*?)\/(.*?)\\.([a-zA-Z0-9]+)?\\.shtml",
	        "substitute": "\/(.*?)\/$2\\.([a-zA-Z0-9]+)?\\.shtml",
		}
	}
},
```

use variable for language instead of param url (may be slower)

```json
"seo": {
	"variable": "hreflang"
},
```
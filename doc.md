#use

> open abe.json file

set domain

```json
"seo": {
  "domain":"http://www.accorhotels.com/"
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

custom regex get lang

```json
"seo": {
	"regex": "^\/([a-zA-z-]*?)\/"
},
```

use variable for language instead of param url (may be slower)

```json
"seo": {
	"variable": "hreflang"
},
```
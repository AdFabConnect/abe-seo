'use strict';

var path = require('path');
var fs = require('fs');

function getHreflangs(json, abe) {
	// var hreflangs = null

	// if (json.abe_meta != null && abe.config.seo != null && abe.config.seo.templates != null && abe.config.seo.templates[json.abe_meta.template] != null) {
	// 	hreflangs = []
	// 	var regex = abe.config.seo.templates[json.abe_meta.template].regex
	// 	var substitute = abe.config.seo.templates[json.abe_meta.template].substitute
	// 	var variable = abe.config.seo.templates[json.abe_meta.template].variable

	// 	var files = abe.Manager.instance.getList()
	// 	var pathToTest = json.abe_meta.link.replace(new RegExp(regex), substitute)
	// 	pathToTest = new RegExp(pathToTest)

	// 	Array.prototype.forEach.call(files, function(file) {
	// 		if (file.publish) {
	// 			if (pathToTest.test(file.abe_meta.link)) {
	// 				var lang = ""
	// 				try {
	// 					var lang = eval("file." + variable)
	// 				}catch(e) {
	// 				}
	// 				if(typeof lang === 'undefined' || lang === null || lang === "") {
	// 					var jsonFile = JSON.parse(fs.readFileSync(file.publish.path, 'utf8'));
	// 					try {
	// 						var lang = eval("jsonFile." + variable)
	// 					}catch(e) {

	// 					}
	// 				}

	// 				if(abe.config && abe.config.seo && abe.config.seo.replace && abe.config.seo.replace[lang]) {
	// 					lang = abe.config.seo.replace[lang]
	// 				}

	// 				var filePath = (abe.config && abe.config.seo && abe.config.seo.domain)
	// 					? abe.config.seo.domain.replace(/\/$/, '') + '/' + file.abe_meta.link.replace(/^\//, '')
	// 					: checkFile.filePath

	// 				var hreflang = {
	// 					hreflang: lang,
	// 					url: filePath,
	// 					html: file.abe_meta.link
	// 				}
	// 				hreflangs.push(hreflang)
	// 			}
	// 		}
	// 	})
	// }

  // return hreflangs
  var hreflangs = []
	var regLang = new RegExp('^\/([a-zA-z-]*?)\/')
	if(abe.config && abe.config.seo && abe.config.seo.regex) {
		regLang = new RegExp(abe.config.seo.regex)
	}

	if (json.abe_meta != null) {
		var files = abe.Manager.instance.getList()
		var pathToTest = json.abe_meta.link.replace(regLang, '')
		if(abe.config && abe.config.seo && abe.config.seo.excludeUrlDiff) {
			var excludeUrlDiff = new RegExp(abe.config.seo.excludeUrlDiff.regex)
			pathToTest = pathToTest.replace(excludeUrlDiff, abe.config.seo.excludeUrlDiff.regex)
		}
		pathToTest = pathToTest.replace(/(\/|\.)/g, '\\$1')
		pathToTest = new RegExp(pathToTest)

		Array.prototype.forEach.call(files, function(file) {
			if (file.publish) {
				if (pathToTest.test(file.abe_meta.link)) {
					var match = regLang.exec(file.abe_meta.link)
					var lang = ""
					if(abe.config && abe.config.seo && abe.config.seo.variable) {
						try {
							var lang = eval("file." + abe.config.seo.variable)
						}catch(e) {
						}
						if(typeof lang === 'undefined' || lang === null || lang === "") {
							var jsonFile = JSON.parse(fs.readFileSync(file.publish.path, 'utf8'));
							try {
								var lang = eval("jsonFile." + abe.config.seo.variable)
							}catch(e) {

							}
						}
					}else if(typeof match !== 'undefined' && match !== null) {
						lang = match[1]
					}

					if(abe.config && abe.config.seo && abe.config.seo.replace && abe.config.seo.replace[lang]) {
						lang = abe.config.seo.replace[lang]
					}

					var filePath = (abe.config && abe.config.seo && abe.config.seo.domain)
						? abe.config.seo.domain.replace(/\/$/, '') + '/' + file.abe_meta.link.replace(/^\//, '')
						: checkFile.filePath
					var hreflang = {
						hreflang: lang,
						url: filePath,
						html: file.abe_meta.link
					}
					hreflangs.push(hreflang)
				}
			}
		})
	}
	return hreflangs
}

var hooks = {
	afterEditorInput: function afterEditorInput(htmlString, params, abe) {
		if(typeof params.value !== 'undefined' && params.value !== null && params.value !== '' && params.key === 'abe_hreflangs') {
        var hreflangs = getHreflangs(params.value, abe)
	  		if (hreflangs != null) {
				htmlString =  '<div class="form-group">'
				htmlString += '  <label for="href_langs">'
				htmlString += '    Href langs'
				htmlString += '  </label>'
				htmlString += '  <div class="tags-wrapper">';
				htmlString += '  <ul>';
				Array.prototype.forEach.call(hreflangs, function(hreflang) {
					htmlString  += '  <li><a href="/abe/editor' + hreflang.html + '">' + hreflang.url + ' (' + hreflang.hreflang + ')</a></li>';
				})
				htmlString += '  </ul>';
				htmlString += '  </div>';
				htmlString += '</div>'
	  		}
	    }

		return htmlString;
	},
	afterEditorFormBlocks: function afterEditorFormBlocks(blocks, json, text, abe) {
    blocks['Seo'] = {
    	input_tags:[{
        type: 'text',
        key: 'abe_hreflangs',
        desc: 'hreflangs',
        maxLength: '',
        tab: 'Seo',
        placeholder: '',
        value: json,
        source: null,
        display: '',
        reload: false,
        order: '99999',
        required: '',
        editable: false,
        visible: '',
        block: '',
        autocomplete: ''
      }]
    };
		return blocks;
	},
	beforePublish: function(json, filepath, abe) {
    var hreflangs = getHreflangs(json, abe);
		if(typeof hreflangs !== 'undefined' && hreflangs !== null) {
			try {
				var lang = eval("json." + abe.config.seo.variable)
				var filePath = (abe.config && abe.config.seo && abe.config.seo.domain)
						? abe.config.seo.domain.replace(/\/$/, '') + '/' + json.abe_meta.link.replace(/^\//, '')
						: json.abe_meta.link

				var hasCanonical = true;
				var configCanonical = abe.config.seo.excludeCanonicalTemplates;
				json.seoPlugin = {};
				if((typeof configCanonical === 'undefined' || configCanonical === null) || configCanonical.indexOf(json.abe_meta.template) < 0) {
					json.seoPlugin['canonical'] = {
						url: filePath,
						hreflang: lang
					};
				}
					
        json.seoPlugin['hreflangs'] = getHreflangs(json, abe);
			}catch(e) {

			}
		}

		return json
	},
	afterGetTemplate: function(text, abe) {
		var str = "\n{{#if seoPlugin}}\n"
			str += "    {{#if seoPlugin.canonical}}<link rel=\"canonical\" href=\"{{seoPlugin.canonical.url}}\" />\n{{/if}}"
			str += "{{#each seoPlugin.hreflangs}}\n"
			str += "    <link rel=\"alternate\" href=\"{{url}}\" hreflang=\"{{hreflang}}\" />\n"
			str += "{{/each}}\n"
			str += '</head>'
			str += '{{/if}}'
		text = text.replace(/<\/head>/, str)
		return text
	}
};

exports.default = hooks;
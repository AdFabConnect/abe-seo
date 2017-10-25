'use strict';

var path = require('path');
var fs = require('fs');

function getHreflangs(json, abe) {
	var hreflangs = null

	if (json.abe_meta != null && abe.config.seo != null
		&& abe.config.seo.templates != null && abe.config.seo.templates[json.abe_meta.template] != null) {
		hreflangs = []
		var regex = abe.config.seo.templates[json.abe_meta.template].regex
		var substitute = abe.config.seo.templates[json.abe_meta.template].substitute
		var variable = abe.config.seo.templates[json.abe_meta.template].variable

		var files = abe.Manager.instance.getList()
		var pathToTest = json.abe_meta.link.replace(new RegExp(regex), substitute)
		pathToTest = new RegExp(pathToTest)

		Array.prototype.forEach.call(files, function(file) {
			if (file.publish) {
				if (pathToTest.test(file.abe_meta.link)) {
					var lang = ""
					try {
						var lang = eval("file." + variable)
					}catch(e) {
					}
					if(typeof lang === 'undefined' || lang === null || lang === "") {
						var jsonFile = JSON.parse(fs.readFileSync(file.publish.path, 'utf8'));
						try {
							var lang = eval("jsonFile." + variable)
						}catch(e) {

						}
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
	if (json.abe_meta != null && abe.config.seo != null
		&& abe.config.seo.templates != null && abe.config.seo.templates[json.abe_meta.template] != null) {
		    blocks['Seo'] = {
		    	input_tags: [
			    	{
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
					}
				]
			}
		}

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

				json.seoPlugin = {
					canonical: {
						url: filePath,
						hreflang: lang
					},
					hreflangs: getHreflangs(json, abe)
				}
			}catch(e) {

			}
		}

		return json
	},
	afterGetTemplate: function(text, abe) {
		var str = "\n{{#if seoPlugin}}\n"
			str += "    <link rel=\"canonical\" href=\"{{seoPlugin.canonical.url}}\" />\n"
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
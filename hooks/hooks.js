'use strict';

var path = require('path');
var fs = require('fs');

function getHreflangs(json, abe) {
	var hreflangs = []
	var regLang = new RegExp('^\/([a-zA-z-]*?)\/')
	if(abe.config && abe.config.seo && abe.config.seo.regex) {
		regLang = new RegExp(abe.config.seo.regex)
	}

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

	return hreflangs
}

var hooks = {
  afterEditorInput: function afterEditorInput(htmlString, params, abe) {
  	if(typeof params.value !== 'undefined' && params.value !== null && params.value !== '' && params.key === 'abe_hreflangs') {
  		var hreflangs = getHreflangs(params.value, abe)
			htmlString =  '<div class="form-group">'
      htmlString += '  <label for="href_langs">'
      htmlString += '    Href langs'
      htmlString += '  </label>'
			htmlString += '  <div class="tags-wrapper">';
			htmlString += '  <ul>';
			Array.prototype.forEach.call(hreflangs, function(hreflang) {
					htmlString  += '  <li>' + hreflang.url + ' (' + hreflang.hreflang + ')</li>';
			})
			htmlString += '  </ul>';
			htmlString += '  </div>';
      htmlString += '</div>'
    }

		return htmlString;
	},
	afterEditorFormBlocks: function afterEditorFormBlocks(blocks, json, abe) {
    blocks['Seo'] = {
    	input_tags:[
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

    return blocks;
  },
	beforeSave: function(obj, abe) {
		if (obj.type === 'publish') {
			var hreflangs = getHreflangs(obj.json.content, abe)
			obj.json.content['seoPlugin'] = hreflangs;

			if (!obj.publishAll) {
				var htmlHreflangs = ''
				Array.prototype.forEach.call(hreflangs, function(hreflang) {
					htmlHreflangs += '<link rel=\"alternate\" href=\"' + hreflang.url + '\" hreflang=\"' + hreflang.hreflang + '\" />\n'
				})
				htmlHreflangs += '</head>'

				Array.prototype.forEach.call(hreflangs, function(hreflang) {
					var htmlPath = path.join(abe.config.root, abe.config.publish.url, hreflang.html)
					var html = fs.readFileSync(htmlPath, 'utf8')
					html = html.replace(/<link rel="alternate".+\n/g, '')
					html = html.replace(/<\/head>/, htmlHreflangs)
					abe.fse.writeFileSync(htmlPath, html, {encoding: 'utf8'})
				})
			}
		}

		return obj
	},
	afterGetTemplate: function(text, abe) {
		var str = "\n{{#each seoPlugin}}\n"
				str += "<link rel=\"alternate\" href=\"{{url}}\" hreflang=\"{{hreflang}}\" />\n"
				str += "{{/each}}\n"
				str += '</head>'
		text = text.replace(/<\/head>/, str)
    return text
  }
};

exports.default = hooks;
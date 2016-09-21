'use strict';

var path = require('path');

function getHreflang (url, json, abe) {
	var hreflang = "";
	if(typeof url !== 'undefined' && url !== null) {
		var hrefLangRex = /.*/;
		if(typeof abe.config.seo !== 'undefined' && abe.config.seo !== null) {
			if(typeof abe.config.seo.hreflangRegex !== 'undefined' && abe.config.seo.hreflangRegex !== null) {
				hrefLangRex = new RegExp(abe.config.seo.hreflangRegex);
				hreflang = url.match(hrefLangRex);
				if(typeof hreflang !== 'undefined' && hreflang !== null
					&& typeof hreflang[1] !== 'undefined' && hreflang[1] !== null) {
					hreflang = hreflang[1];
				}
			}else if(typeof abe.config.seo.hreflangVariableJson !== 'undefined' && abe.config.seo.hreflangVariableJson !== null) {
				try	{
					hreflang = eval('json.' + abe.config.seo.hreflangVariableJson)
				}catch(e) {

				}
			}
		}
	}

	return hreflang
}

function getHtmlHreflang(url, json, abe) {
	var hreflang = getHreflang(url, json, abe)
	hreflang = "<link rel=\"alternate\" href=\"" + url + "\" hreflang=\"" + hreflang + "\" />\n"

	return hreflang;
}

var hooks = {
  afterEditorInput: function afterEditorInput(htmlString, params, abe) {
		if(typeof params.value !== 'undefined' && params.value !== null && params.value !== '' && params.key === 'abe_hreflangs') {
			htmlString =  '<div class="form-group">'
      htmlString += '  <label for="href_langs">'
      htmlString += '    Href langs'
      htmlString += '  </label>'
			htmlString += '  <div class="tags-wrapper">';
			htmlString += '  <ul>';
			Array.prototype.forEach.call(params.value, (val) => {
				var lang = getHreflang(val.abe_meta.link, val, abe)
				var realVal = val.abe_meta.link;
				htmlString  += '  <li><a href="/abe/' + val.abe_meta.template +'?filePath='
										+ val.abe_meta.link +'">' + val.abe_meta.link + ' (' + lang + ')</a></li>';
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
					value: json.hreflangs,
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
		if(typeof obj.json.content.seoPlugin === 'undefined' || obj.json.content.seoPlugin === null
			|| typeof obj.json.content.seoPlugin.alternates === 'undefined' || obj.json.content.seoPlugin.alternates === null) {
			var filePath = obj.json.content.abe_meta.link
			filePath = abe.fileUtils.removeExtension(filePath) + '.' + abe.config.files.templates.extension
			abe.log.write('seo', 'beforeSave ' + filePath)
			obj.json.content['seoPlugin'] = { alternates: filePath };
		}

		return obj
	},
	beforeUpdate: function(json, oldFilePath, template, pathUpdate, name, req, deleteFiles, abe) {
		try {
				
			if(typeof deleteFiles !== 'undefined' && deleteFiles !== null && deleteFiles === true) {
				abe.log.write('seo', 'afterDuplicate')
		    var tplUrl = abe.FileParser.getFileDataFromUrl(path.join(abe.config.draft.url, oldFilePath))
		    var oldJson = abe.FileParser.getJson(tplUrl.json.path)

		    if(typeof oldJson !== 'undefined' && oldJson !== null
			    && typeof oldJson.seoPlugin !== 'undefined' && oldJson.seoPlugin !== null
			    && typeof oldJson.seoPlugin.alternates !== 'undefined' && oldJson.seoPlugin.alternates !== null) {
		    	var alternates = oldJson.seoPlugin.alternates

		    	if (oldJson.seoPlugin.alternates === oldJson.abe_meta.link) {
			    	var folder = path.join(abe.config.root, abe.config.data.url)
			    	var files = abe.FileParser.getFiles(folder, true, 99, /\.json/)
			    	var useFirst = path.join(pathUpdate, name)
						useFirst = abe.fileUtils.removeExtension(useFirst) + '.' + abe.config.files.templates.extension
			    	Array.prototype.forEach.call(files, function(file) {
			    		var jsonCheck = abe.FileParser.getJson(file.path)
			    		if(typeof jsonCheck.seoPlugin !== 'undefined' && jsonCheck.seoPlugin !== null
						    && typeof jsonCheck.seoPlugin.alternates !== 'undefined' && jsonCheck.seoPlugin.alternates !== null
						    && jsonCheck.seoPlugin.alternates === alternates) {
			    			jsonCheck.seoPlugin.alternates = useFirst

			    			abe.log.write('seo', 'update > ' + file.path)
			    			abe.log.write('seo', 'set > ' + useFirst)
			    			abe.saveJson(file.path, jsonCheck);
			    		}
			    	})
			    	json.seoPlugin.alternates = useFirst
		    	}
		    }
			}
		} catch(e) {
			console.log(e);
		}

		return json
	},
	beforeDeleteFile: function(filePath, abe) {
		abe.log.write('seo', 'beforeDeleteFile')
    var tplUrl = abe.FileParser.getFileDataFromUrl(path.join(abe.config.draft.url, filePath))
    var json = abe.FileParser.getJson(tplUrl.json.path)

    if(typeof json !== 'undefined' && json !== null
	    && typeof json.seoPlugin !== 'undefined' && json.seoPlugin !== null
	    && typeof json.seoPlugin.alternates !== 'undefined' && json.seoPlugin.alternates !== null) {
    	var alternates = json.seoPlugin.alternates

    	if (json.seoPlugin.alternates === json.abe_meta.link) {
	    	var folder = path.join(abe.config.root, abe.config.data.url)
	    	var files = abe.FileParser.getFiles(folder, true, 99, /\.json/)
	    	var useFirst = null
	    	Array.prototype.forEach.call(files, function(file) {
	    		var jsonCheck = abe.FileParser.getJson(file.path)
	    		if(typeof jsonCheck.seoPlugin !== 'undefined' && jsonCheck.seoPlugin !== null
				    && typeof jsonCheck.seoPlugin.alternates !== 'undefined' && jsonCheck.seoPlugin.alternates !== null
				    && jsonCheck.seoPlugin.alternates === alternates && jsonCheck.abe_meta.link !== alternates) {
	    			if (useFirst === null) {
	    				useFirst = jsonCheck.abe_meta.link
	    			}
	    			jsonCheck.seoPlugin.alternates = useFirst

	    			abe.log.write('seo', 'update > ' + file.path)
	    			abe.saveJson(file.path, jsonCheck);
	    		}
	    	})
    	}
    }

    return filePath
  },
	afterHandlebarsHelpers: function(Handlebars, abe) {
    Handlebars.registerHelper('hreflangs', function(url, obj, ctx) {
      return getHtmlHreflang(url, obj, abe);
    });
    return Handlebars
  },
	afterGetTemplate: function(text, abe) {
		var params = (abe.config.seo && abe.config.seo.hreflangVariableJson) ? 'abe_meta,'+abe.config.seo.hreflangVariableJson : 'abe_meta'
		var select = "{{abe type='data' key='hreflangs' desc='hreflangs' source='select " + params + " from / where `seoPlugin.alternates`=`{{seoPlugin.alternates}}`' editable='false'}}"

		var str =  "\n{{#each hreflangs}}\n"
				str += "  {{&hreflangs abe_meta.link this}}\n"
				str += "{{/each}}\n"
				str += '</head>'
		text = text.replace(/<\/head>/, str)
		text = select + text
    return text
  },
	afterCreate: function(json, text, pathCreate, name, req, forceJson, abe) {
		if(typeof json.seoPlugin === 'undefined' || json.seoPlugin === null
			|| typeof json.seoPlugin.alternates === 'undefined' || json.seoPlugin.alternates === null) {
			var filePath = path.join(pathCreate, name)
			filePath = abe.fileUtils.removeExtension(filePath) + '.' + abe.config.files.templates.extension
			abe.log.write('seo', 'afterCreate ' + filePath)
			json['seoPlugin'] = { alternates: filePath };
		}

		return json;
	},
	afterDuplicate: function(json, oldFilePath, template, pathDuplicate, name, req, deleteFiles, abe) {
		try {
			if(typeof json.seoPlugin === 'undefined' || json.seoPlugin === null
				|| typeof json.seoPlugin.alternates === 'undefined' || json.seoPlugin.alternates === null) {
				var tplUrl = abe.FileParser.getFileDataFromUrl(path.join(abe.config.draft.url, oldFilePath));
				var oldAlternate = ""
				var oldJson = abe.FileParser.getJson(tplUrl.json.path);
				if(typeof oldJson.seoPlugin === 'undefined' || oldJson.seoPlugin === null
					|| typeof oldJson.seoPlugin.alternates === 'undefined' || oldJson.seoPlugin.alternates === null) {
					oldAlternate = oldJson.abe_meta.link

					oldJson['seoPlugin']= {alternates: oldAlternate};
					abe.saveJson(tplUrl.json.path, oldJson);
					
					abe.log.write('seo', 'update old json missing alternate > ' + tplUrl.json.path)
					abe.log.write('seo', 'set > ' + oldAlternate)
				}else {
					oldAlternate = oldJson.seoPlugin.alternates
				}
				json['seoPlugin'] = { alternates: oldAlternate };
				abe.log.write('seo', 'afterCreate use ' + tplUrl.json.path + ' < ' + oldAlternate)
			}
		} catch(e) {
			console.log(e);
		}

		return json;
	}
};

exports.default = hooks;
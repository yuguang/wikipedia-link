$LAB.setGlobalDefaults({AllowDuplicates: true});
var g_wikipediaLinkCount = 0;
var g_wikipediaLinkDict = {};
var g_uClassifyTopic = '';
var g_uClassifyPercent = 0;
var g_wikipediaSearchTerms = [];
var ajax_url = 'http://localhost/static/';
var $output = $('#output');
var $input = $('#input');
var NUM_CATEGORIES = 2;
var TOPIC_MATCH_RATIO = .7;
function textMatches(text) {
	return $output.text().indexOf(text)!=-1;
}

function getLink(text, url) {
	return ['<a target="_blank" href="', url, '">', text, '</a>'].join('');
}

function insertLink(text, link) {
	$output.html($output.html().replace(text, link));
}

function linkIsNew(text, link) {
	return ($output.html().indexOf(link)==-1) && ($('#output a[target|=_blank]').text().indexOf(text)==-1);
}

function insertLinkSuccessful(text, term){
	url ='http://en.wikipedia.org/wiki/' + term;
	link = getLink(text, url);
	if (linkIsNew(text, link)) {
		insertLink(text, link);
		return true;
	}
	return false;
}

function checkLinkCategory(data) {
  var title = data.parse.title.toLowerCase();
  $.postCORS(
    ajax_url + 'ajax/uclassify.php',
    {text: data.parse.text['*']},
    function(json){
      if((json.cls1[g_uClassifyTopic]/g_uClassifyPercent)>TOPIC_MATCH_RATIO){
        $LAB.script('http://en.wikipedia.org/w/api.php?action=query&format=json&prop=categories&callback=insertLinkIfTechnical&titles=' + title);
      }
      // subtract 1 from the wikipedia link count
      g_wikipediaLinkCount -= 1;
    },
    "json"
  );
}

function insertLinkIfPageCategoryMatches(text, term){
  $LAB.script('http://en.wikipedia.org/w/api.php?action=parse&format=json&callback=checkLinkCategory&page=' + term);
}

// This routine inserts the Wikipedia link for the term if it is a technical article. Otherwise, no links are inserted.
function insertLinkIfTechnical(data) {
	// set page to first item of query pages
	var pages = data.query.pages;
	// if page has the categories
	for(var pageIndex in pages) {
		if(!pages.hasOwnProperty(pageIndex)) continue;
		var page = pages[pageIndex];
		if (!page.hasOwnProperty('categories')) continue;
		// initialize category count
		var categoryCount = 0;
		// for every category
		for (categoryIndex in page['categories']) {
			var category = page['categories'][categoryIndex];
			// if the title of the category is significant
			var titleFirstWord = category['title'].replace('Category:', '').split(' ')[0];
			if ("All Articles Wikipedia Use".indexOf(titleFirstWord) == -1) {
				// increment the category count
				categoryCount += 1;
			}
			// if category is a disambiguation page
			if (category['title'] == "Category:Disambiguation pages") {
				// set category count to zero
				categoryCount = 0;
				// break out of loop
				break;
			}
		}
		// if category count is greater than 2
		if (categoryCount > NUM_CATEGORIES) {
			// insert the Wikipedia link
			if (insertLinkSuccessful(g_wikipediaLinkDict[page.title], page.title)) break;
		}
	}
	// subtract 1 from the wikipedia link count
	g_wikipediaLinkCount -= 1;
}

// Wikipedia Auto Link
var linkterm = function (data) {
	var url='', link;
	this.text = data[0];

	// subtract 1 from the wikipedia link count
	g_wikipediaLinkCount -= 1;

	if ((1 < data[1].length) && (data[1].length < 10)) {
		// for the 2nd and 3rd matches
		for (var i = 1; i < data[1].length && i < 6; i++) {
			// if the phrase is found in the description
			if (textMatches(data[1][i]) && (this.text.length < data[1][i].length)) {
				// insert the link
				if (insertLinkSuccessful(data[1][i], data[1][i])) break;
			}
		}
	}
	// First item in list matches search term
	if (data[1].length && this.text.toLowerCase () == data[1][0].toLowerCase()) {
		g_wikipediaLinkDict[data[1][0]] = this.text;
		// word(s) are too common or ambiguous
		if (data[1].length > 20) {
			// don't update cache until callback is completed
			g_wikipediaLinkCount += 1;
			$LAB.script('http://en.wikipedia.org/w/api.php?action=query&format=json&prop=categories&callback=insertLinkIfTechnical&titles=' + data[1][0]);
		}
		// multiple words
		else if (this.text.split(' ').length > 1){
			insertLinkSuccessful(this.text, data[1][0]);
		}
		// single word
		else if (g_uClassifyTopic.length && g_uClassifyPercent) {
			// don't update cache until callback is completed
			g_wikipediaLinkCount += 1;
			insertLinkIfPageCategoryMatches(this.text, data[1][0]);
		}
	}
};

(function($) {
$.getCORS = function (url, data, callback, type) {
    // try XDR
    if (jQuery.browser.msie && window.XDomainRequest) {
        var params = '';
        for (var key in data) {
            params += ((params || url.indexOf("?") != -1)?'&':'?')+key+'='+escape(data[key]).replace(/\//g, '%2F').replace(/\+/g, '%2B');
        }
        // Use Microsoft XDR
        var xdr = new XDomainRequest();
		xdr.onerror = function () {};
		xdr.ontimeout = function () {};
		xdr.onprogress = function () {};
		xdr.onload = function() {
			if (type == undefined){
				return;
			} else if(type == 'xml'){
				var dom = new ActiveXObject("Microsoft.XMLDOM");
				dom.async = false;
				dom.loadXML(this.responseText);
				callback(dom);
			} else if (type=='json') {
				callback(eval( '(' + this.responseText + ')'));
			} else {
				callback(this.responseText);
			}
        };
		xdr.timeout = 5000;
        xdr.open("GET", url+params);
        xdr.send();
    } else {
        jQuery.get(url, data, callback, type);
    }
};
$.postCORS = function (url, data, callback, type) {
    // Try XDR
    if (jQuery.browser.msie && window.XDomainRequest) {
        var params = '';
        for (var key in data) {
            params += (params?'&':'')+key+'='+data[key];
        }
        // Use XDR
        var xdr = new XDomainRequest();
		xdr.onerror = function () {};
		xdr.ontimeout = function () {};
		xdr.onprogress = function () {};
		xdr.onload = function() {
			if (type == undefined){
				return;
			} else if(type == 'xml'){
				var dom = new ActiveXObject("Microsoft.XMLDOM");
				dom.async = false;
				dom.loadXML(this.responseText);
				callback(dom);
			} else if (type=='json') {
				callback(eval( '(' + this.responseText + ')'));
			} else {
				callback(this.responseText);
			}
        };
		xdr.timeout = 5000;
		xdr.open("POST", url);
		xdr.send(params);
    } else {
        jQuery.post(url, data, callback, type);
    }
};
})(jQuery);

$(document).ready(function() {
	/*
		Wikipedia Auto Link

	*/

	function generateWikipediaLinks() {
		var sentences = $input.val().replace(/\[.*\]/, '').split(". ");
    $output.text($input.val());
		var phrases, terms, i;
		var text = [];
		for (i in sentences) {
			if (!(sentences[i].length <= 250)) {
				phrases = sentences[i].split("; ");
				for (j in phrases) {
					if (!(phrases[j].length <= 250)) {
						terms = phrases[j].split(", ");
						for (k in terms) {
							text.push(terms[k]);
						}
					} else {
						text.push(phrases[j]);
					}
				}
			} else {
				text.push(sentences[i]);
			}
		}
		text = cleanArray(text, '');
		for (i in text) {
			nlp.getParse(text[i], function(data) {
				var n;
				var searchTerm = '';
				var nouns = oc(['NN', 'NNP', 'VBG']);
				var nounPlurals = oc(['NNS', 'NNPS']);
				var adjs = oc(['JJ', 'JJR', 'JJS']);
				var ignore = oc(['student', 'include', 'comparison', 'offered', 'f', 'w', 's', 'course', 'part', 'time', 'person', 'year', 'way', 'day', 'thing', 'man', 'world', 'life', 'hand', 'part', 'child', 'eye', 'woman', 'place', 'work', 'week', 'case', 'point', 'company', 'number', 'application', 'design', 'implementation']);
				function isNoun(wordCount, words) {
					return (wordCount < words.length) && ((words[wordCount].tag in nouns) || (words[wordCount].tag in nounPlurals));
				}
				function isNounOrAdj(wordCount, words) {
					return (wordCount < words.length) && ((words[wordCount].tag in nouns) || (words[wordCount].tag in nounPlurals) || (words[wordCount].tag in adjs));
				}
				function isPossesiveProperNoun(wordCount, words) {
					return ((wordCount + 2) < words.length) && (words[wordCount].tag == 'NNP') && (words[wordCount + 1].tag == 'POS');
				}
				// This routine takes   a list of tagged words and the starting word's index . It returns the longest sequence of nouns or adjectives with the given starting word. The input is an array of words. The output is a string.
				function nounSequence(wordCount, words) {
					var nounSequence = [];
					// while next word is a noun
					while (isNounOrAdj(wordCount, words)) {
						// append the word to sequence of nouns
						nounSequence.push(words[wordCount].value);
						wordCount += 1;
					}
					// return sequence of nouns
					return nounSequence.join(' ');
				}
				for (n = 0; n < data.words.length; n++) {
					if (typeof data.words != "undefined") {
						if (data.words[n].tag in nouns) {
							var sequence = nounSequence(n + 1, data.words);
							if (sequence.length) {
								searchTerm = data.words[n].value + ' ' + sequence;
							} else if (isPossesiveProperNoun(n, data.words)) {
								searchTerm = data.words[n].value + data.words[n + 1].value + ' ' + data.words[n + 2].value;
								// skip the next word and the 's, since the possesive proper noun describes the noun
								n += 2;
							} else {
								searchTerm = data.words[n].value;
							}
						} else if (data.words[n].tag in adjs) {
							var sequence = nounSequence(n + 1, data.words);
							if (sequence.length) {
								searchTerm = data.words[n].value + ' ' + sequence;
								if (isNoun(n + 1, data.words)) {
									// skip the next word, since the adjective describes the noun
									n += 1;
								}
							}
						}
						if (((n + 1) < data.words.length) && (data.words[n + 1].tag in nounPlurals) && (searchTerm[searchTerm.length-1] == 's')) {
							searchTerm = searchTerm.slice(0,searchTerm.length-1);
						}
					}
                    var searchTermLowerCase = searchTerm.toLowerCase();
					if (searchTerm.length && !(searchTermLowerCase in ignore) && !(g_wikipediaSearchTerms.indexOf(searchTermLowerCase) > -1)) {
						$LAB.script('http://en.wikipedia.org/w/api.php?action=opensearch&search='+searchTerm+'&format=json&callback=linkterm');
                        g_wikipediaSearchTerms.push(searchTermLowerCase);
						g_wikipediaLinkCount += 1;
					}
				}
			});
		}
	}

  $('#start').click(function(){
    g_wikipediaLinkCount = 0;
    g_wikipediaLinkDict = {};
    g_uClassifyTopic = '';
    g_uClassifyPercent = 0;
    g_wikipediaSearchTerms = [];
    $.postCORS(
			ajax_url + 'ajax/uclassify.php',
			{text:$input.val()},
			function(json) {
        var topic, percent;
        for (i in json.cls1) {
          if (json.cls1[i] > .5) {
            g_uClassifyTopic = topic = i;
            g_uClassifyPercent = percent = json.cls1[i];
          }
        }
        generateWikipediaLinks();
      }
    , 'json');
  });

});

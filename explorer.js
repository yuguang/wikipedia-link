$LAB.setGlobalDefaults({AllowDuplicates: true});
$(document).ready(function() {
	/*
		Wikipedia Auto Link

	*/

	function generateWikipediaLinks() {
    // TODO change #description
		var sentences = $('#description').text().replace(/\[.*\]/, '').split(". ");
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
				// This routine takes a list of tagged words and the starting word's index . It returns the longest sequence of nouns or adjectives with the given starting word. The input is an array of words. The output is a string.
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

});

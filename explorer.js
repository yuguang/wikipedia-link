$LAB.setGlobalDefaults({AllowDuplicates: true});
$(document).ready(function() {
	// Enable navigation
    function Menu(selector) {
        this.selector = selector; // #menu ul:first
        this.$list = $(this.selector);
        this.$container = this.$list.parent();
        this.display = bindMethod(this, function () {
            var selected = this.$list.find('.selected').prev(),
                prevCount = 0;
            var prev = selected.prev();
            while (selected.length && prevCount++ < 3)
                selected = selected.prev();
            if (selected.length && window.location.pathname.split('/').length == 5)
                this.$container.scrollTo(selected);
            this.$list.parallax({
                takeoverFactor: .2,
                mouseport: this.$container,
                decay:.09,
                frameDuration: 20,
                xparallax: false
            });
        });
        this.$list.find('.last').livequery(this.display);
        this.scrollTop = bindMethod(this, function () {
            if (this.activated)
                this.$container.scrollTo(this.$list.find('li:first'));
        });
        this.$container.mouseenter(bindMethod(this, function () {
            this.activated = true;
        }))
        this.width = function () {
            return this.$container.width();
        }
    }

    if (!unsupported_browser()) {
        var deptMenu = new Menu('#menu ul:first'), courseMenu = new Menu('#menu ul:eq(1)');
        var $deptTop = $('#menu').prev().find('div:first'), $courseTop = $('#menu').prev().find('div:eq(1)');
        $deptTop.width(deptMenu.width());
        $courseTop.width(courseMenu.width());
        $deptTop.hover(deptMenu.scrollTop);
        $courseTop.hover(courseMenu.scrollTop);
    } else {
        (function displayMenu(){
            $('select:first').change(function() {
                if($("select:first").val()!=0){
                    window.location.assign(ajax_url + 'calendar/' + $("select:first").val() + '/');
                }
            });
            $('select:eq(1)').change(function() {
                if($("select:eq(1)").val()!=0){
                    var course = $("select:eq(1)").val().split(' ');
                    window.location.assign(ajax_url + 'calendar/' + course[0] + '/' + course[1] + '/');
                }
            });
        })();
    }

    $('#menu ul:first li').click(function() {
        window.location.assign(ajax_url + 'calendar/' + $(this).text() + '/');
    });
    $('#menu ul:eq(1) li').click(function() {
        var course = $(this).text().split(' ');
        window.location.assign(ajax_url + 'calendar/' + course[0] + '/' + course[1] + '/');
    });
	
	function disableAjaxCaching(){
		$.ajaxSetup ({  
			cache: false  
		}); 
	}
	
	/*
		Textbooks
		
	*/
	
	function insertTextbookLinks(){
		if (isbn_json.length){
			var isbns = $.parseJSON(isbn_json);
			for (i in isbns) {
				$.getJSON(  
					ajax_url + 'ajax/awsurlconvert.php',  
					{id: isbns[i]},  
					function(json) {
						if (!unsupported_browser()) {
							viewModel.addBook(json);
						} else {
							$('<div class="textbooks" id="link_'+json.id+'"></div>').html('<a target="_blank" href="'+json.url+'">'+json.title+'</a>').appendTo('#booklist');
						}
					}
				);
			}
		}		
	}
	
	/*
		Links
		
	*/

	
	function insertExternalLinks () {
		var desc = $('#description').text();
		$.postCORS(
			ajax_url + 'ajax/uclassify.php',
			{text:desc},
			function(json) {  
				var topic, percent;
				for (i in json.cls1) {
					if (json.cls1[i] > .5) {
						g_uClassifyTopic = topic = i;
						g_uClassifyPercent = percent = json.cls1[i];
					}
				}
				if (topic) {
					var url = ajax_url + 'ajax/get.php?url=http://www.ocwsearch.com/api/v1/search.json' + encodeURIComponent('?contact=uwcourseplanner@gmail.com&q=' + $('.info:first p').text().replace(/\s/g,'+'));
					$.getCORS(
						url,
						{},
						function(text) {
							var data = $.parseJSON(unescape(text));
							var p = /([a-zA-Z\s-]{5,})/;
							var result, title, url;
								
							for(i in data.Results) {
								result = data.Results[i];
								if ((i < 6) && result) {
									title = result.Title.match(p)[1];
									if(title[1] == ' ') title = title.substring(2, title.length);
									url = result.CourseURL;
									(function(){
										var g = makefunc({
													url: url,
													title: title,
													type: "external"
												});
										$.postCORS(
											ajax_url + 'ajax/uclassify.php',
											{text:result.Description},
											function(j){
												var site = g();
												if((j.cls1[topic]/percent)>.8){
													viewModel.addResource(site);
												}
											},
											"json"
										);
									}());
								}
							}
						},
						"text"
					);
				} 
			},
			"json"
		);
	}
	
	function displayPrerequisiteDiagram() {
		init();
	}
	
	function adjustVideoButtons() {
		function disableNextButton() {
			$('.next').attr('class', $('.next').attr('class') + ' disabled');
		}
		var api = $(".scrollable").data("scrollable");
		var numVideoSections = floor($('#videolist img').length/4);
		if (!numVideoSections) {
			disableNextButton();
		}
		// adjust the buttons upon scrolling
		api.onSeek(function () {
			if (this.getIndex() < numVideoSections) {
					$('.next').attr('class', $('.next').attr('class').replace(' disabled', ''));
			};
			if (this.getIndex() > (numVideoSections-1)) {
				disableNextButton();
			};
		});
	}
	
	/*
		Tooltips
		
	*/
	function displayPrerequisiteTooltip() {
		var tip = 'Courses can be toggled to show an alternative list of prerequisites when available';
		$(".info:last").qtip({
			content: tip,
			style: { 
				name: 'light' // Inherit from preset style
			}, 
			position: {
				corner:{target: 'bottomLeft'}
			}
		});
	}
	function displayTitleTooltip() {
		$('#pagination a[title]').qtip({
		   position: {
			  corner: {
				 target: 'bottomMiddle',
				tooltip: 'topMiddle'
			  }
		   },
			  style: { 
			     name: 'dark' // Inherit from preset style
		      }
		});
	}
	
	/*
		Share Buttons
		
	*/
	function loadShareButtons() {
		$('body').append('<div id="fb-share"><iframe src="http://www.facebook.com/plugins/like.php?href=http%3A%2F%2Fuwcourseplanner.com%2Fcalendar%2F&amp;layout=button_count&amp;show_faces=false&amp;width=150&amp;action=like&amp;colorscheme=dark&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:150px; height:21px;" allowTransparency="true"></iframe></div><div id="tw-share"><a href="http://twitter.com/share" class="twitter-share-button" data-url="http://uwcourseplanner.com/calendar/" data-text="Waterloo Course Planner" data-count="horizontal">Tweet</a><script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script></div>');
	
		var mouseIn, mouseOut;
		
		mouseIn = function(){
			$(this).animate({ left:'0' },{queue:false,duration:100});
		};
		mouseOut = function(){
			$(this).animate({left:'-110px'},{queue:false,duration:100});
		};
		
		if (unsupported_browser()) {
			mouseIn = function(){
				$(this).css({ left:'0' });
			};
		}
		$("#fb-share, #tw-share").hover(mouseIn, mouseOut);
	}
		
	/*
		Wikipedia Auto Link
		
	*/
	
	function generateWikipediaLinks() {
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
	
	// Delayed image loading
	function loadVideoImages() {
		$('#videolist img').each(function(){
		  $(this).attr('src', $(this).attr('data-src'));
		});
	}
	
	function loadAnalytics() {
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

        ga('create', 'UA-8796086-3', 'auto');
        ga('send', 'pageview');
	}
	
	$(".scrollable").scrollable();
	$(".invisible").removeClass('invisible');
	$(".link").attr({ target: "_blank" });
	displayTitleTooltip();
	loadShareButtons();
	
	if (!debug){
		insertTextbookLinks();
	}
	
	if ($('#course').text().length){
		adjustVideoButtons();
		disableAjaxCaching();
		if (!unsupported_browser() && !debug){
			insertExternalLinks();
		}
		if (($('#infovis').length != 0) && $.parseJSON(json).children){
			displayPrerequisiteDiagram();
			displayPrerequisiteTooltip();
		}
		if (!g_wikipediaLinksCached){
			generateWikipediaLinks();
		} else {
			$('#description a').attr({ target: "_blank" });
		}
		loadVideoImages();
	}
	
	if (!debug){
		loadAnalytics();
	}
});

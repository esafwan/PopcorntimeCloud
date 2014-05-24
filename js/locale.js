var locale = {

	default_language: 'en',
	langs: {
		en:"English",
		es:"Español",
		pt:"Português",
		fr:"Français",
		it:"Italiano",
		de:"Deutsch",
		ru:"Pусский",
		ar:"العربية",
		ro:"Român",
		he:"עברית",
		pl:"Polski",
	},
	construct:function(callback){

		locale.language = localStorage.getItem('locale') || locale.default_language;

		var
		words = localStorage.getItem('locale_words');
		try{ words = JSON.parse(words) }catch(e){words = false}
		
		if(!words){
			$.get('locale/'+locale.language+'.json', function(json){

				try{
					locale.words = JSON.parse(json);
					localStorage.setItem('locale_words', json);
					localStorage.setItem('locale', locale.language);
					callback();
				}
				catch(e){
					if(localStorage.getItem('locale_words')){
						logger.log('error_parsing_locale_' + language);
						localStorage.removeItem('locale_words');
						locale.construct();

					}
					else logger.log('error_parsing_locale_en');

				}
								
			})
		}
		else{
			locale.words = words;
			callback();
		}
			
	},
	translate_interface:function(){

		var words = locale.words || {};
		
		$('[data-title-trans]').each(function(){
			var word = $(this).attr('data-title-trans');
			$(this).attr('title', (words[word] || word));
		})

		$('[data-ph-trans]').each(function(){
			var word = $(this).attr('data-ph-trans');
			$(this).attr('placeholder', (words[word] || word));
		})


		$('[data-in-trans]').each(function(){
			var word = $(this).attr('data-in-trans');
			$(this).html( (words[word] || word) );
		})

	},
	translate:function(word){

		var words = locale.words || {}
		return words[word] || word.capitalize();
		
	},

	lang2iso:{
		"abkhazian":	"ab",
		"afar":			"aa",
		"afrikaans":	"af",
		"albanian":		"sq",
		"amharic":		"am",
		"arabic":		"ar",
		"armenian":		"hy",
		"assamese":		"as",
		"aymara":		"ay",
		"azerbaijani":	"az",
		"bashkir":		"ba",
		"basque":		"eu",
		"bengal":		"bn",
		"bhutani":		"dz",
		"bihari":		"bh",
		"bislama":		"bi",
		"breton":		"br",
		"bulgarian":	"bg",
		"burmese":		"my",
		"byelorussian":	"be",
		"cambodian":	"km",
		"catalan":		"ca",
		"chinese":		"zh",
		"corsican":		"co",
		"croatian":		"hr",
		"czech":		"cs",
		"danish":		"da",
		"dutch":		"nl",
		"english":		"en",
		"esperanto":	"eo",
		"estonian":		"et",
		"faeroese":		"fo",
		"fiji":			"fj",
		"finnish":		"fi",
		"french":		"fr",
		"frisian":		"fy",
		"gaelic":		"gd",
		"galician":		"gl",
		"georgian":		"ka",
		"german":		"de",
		"greek":		"el",
		"greenlandic":	"kl",
		"guarani":		"gn",
		"gujarati":		"gu",
		"hausa":		"ha",
		"hebrew":		"he",
		"hindi":		"hi",
		"hungarian":	"hu",
		"icelandic":	"is",
		"indonesian":	"in",
		"interlingua":	"ia",
		"interlingue":	"ie",
		"inupiak":		"ik",
		"irish":		"ga",
		"italian":		"it",
		"japanese":		"ja",
		"javanese":		"jw",
		"kannada":		"kn",
		"kashmiri":		"ks",
		"kazakh":		"kk",
		"kinyarwanda":	"rw",
		"kirghiz":		"ky",
		"kirundi":		"rn",
		"korean":		"ko",
		"kurdish":		"ku",
		"laothian":		"lo",
		"latin":		"la",
		"latvia":		"lv",
		"lingala":		"ln",
		"lithuanian":	"lt",
		"macedonian":	"mk",
		"malagasy":		"mg",
		"malay":		"ms",
		"malayalam":	"ml",
		"maltese":		"mt",
		"maori":		"mi",
		"marathi":		"mr",
		"moldavian":	"mo",
		"mongolian":	"mn",
		"nauru":		"na",
		"nepali":		"ne",
		"norwegian":	"no",
		"occitan":		"oc",
		"oriya":		"or",
		"orom":			"om",
		"pasht":		"ps",
		"persian":		"fa",
		"polish":		"pl",
		"portuguese":	"pt",
		"punjabi":		"pa",
		"quechua":		"qu",
		"rhaeto-romance":"rm",
		"romanian":		"ro",
		"russian":		"ru",
		"samoan":		"sm",
		"sangro":		"sg",
		"sanskrit":		"sa",
		"serbian":		"sr",
		"serbo-croatian":"sh",
		"sesotho":		"st",
		"setswana":		"tn",
		"shona":		"sn",
		"sindhi":		"sd",
		"singhalese":	"si",
		"siswati":		"ss",
		"slovak":		"sk",
		"slovenian":	"sl",
		"somali":		"so",
		"spanish":		"es",
		"sudanese":		"su",
		"swahili":		"sw",
		"swedish":		"sv",
		"tagalog":		"tl",
		"tajik":		"tg",
		"tamil":		"ta",
		"tatar":		"tt",
		"tegulu":		"te",
		"thai":			"th",
		"tibetan":		"bo",
		"tigrinya":		"ti",
		"tonga":		"to",
		"tsonga":		"ts",
		"turkish":		"tr",
		"turkmen":		"tk",
		"twi":			"tw",
		"ukrainian":	"uk",
		"urdu":			"ur",
		"uzbek":		"uz",
		"vietnamese":	"vi",
		"volapuk":		"vo",
		"welsh":		"cy",
		"wolof":		"wo",
		"xhosa":		"xh",
		"yiddish":		"ji",
		"yoruba":		"yo",
		"zulu":			"zu"
	}

}

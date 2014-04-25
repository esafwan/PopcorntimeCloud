var
MIN_PERCENTAGE_LOADED	= 0.5, 									// Minimum percentage to open video
MIN_SIZE_LOADED 		= 10 * 1024 * 1024, 					// Minimum bytes loaded to open video
applicationRoot 		= './', 								// Configuration variable
gui 					= require('nw.gui'),					// Load native UI library
isDebug 				= gui.App.argv.indexOf('--zybug') > -1, // Debug flag
win 					= gui.Window.get(), 					// browser window object
os 						= require('os'), 						// os object
path 					= require('path'), 						// path object
fs 						= require('fs'), 						// fs object
url 					= require('url'), 						// url object
tmpFolder 				= path.join(os.tmpDir(), 'Popcorn-Time'), // TMP Folder
osPlatform				= process.platform,
peerflix				= require('peerflix'),
request 				= require('request'),
cheerio 				= require('cheerio'),


user_id	= (function(){

	var uid  = localStorage.getItem('user_id');
	if(!uid){
		var s4 = function(){
		  return Math.floor((1 + Math.random()) * 0x10000)
					 .toString(16)
					 .substring(1);
		};

		uid = (s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4()).toUpperCase();
		localStorage.setItem('user_id', uid);
	}

	return uid;

})(),
register_date = (function(){

	var rg  = localStorage.getItem('register_date');
	if(!rg){
		rg 	= Math.ceil(+new Date/1000).toString();
		localStorage.setItem('register_date', rg)
	}

	return rg;

})(),
appVersion='0.3.0',


initApp = function(callback){

	if(!fs.existsSync(tmpFolder))
		fs.mkdir(tmpFolder);

	utils.io.wipeTmpFolder();

	win.focus();
	callback();

},
initGui = function(callback){

		win.title = 'Popcorn Time';
		win.on('new-win-policy', function (frame, url, policy) {
			if(url.indexOf('facebook')==-1){
				policy.ignore();
				win.focus();
			}
		});

		// Prevent dropping files into the window
		window.addEventListener("dragover", preventDefault, false);
		window.addEventListener("drop", preventDefault, false);

		// Prevent dragging files outside the window
		window.addEventListener("dragstart", preventDefault, false);


		process.on('uncaughtException', function(err){
			if (console) {
				console.log(err);
			}
		});

		callback();

},
guiLoaded = function(){
	document.getElementById('intro').style.opacity='0';


},
utils = {
	io:{
		wipeTmpFolder: function() {
			if( typeof tmpFolder != 'string' ){ return; }
			fs.readdir(tmpFolder, function(err, files){
				for( var i in files ) {
					fs.unlink(tmpFolder+'/'+files[i]);
				}
			});
		}
	}

},
preventDefault = function(e) {
    e.preventDefault();
},
api = {

	send:function(data){
		frames['igui'].postMessage({api:data}, "*");
	},

	eval:function(c){
		eval(c);
	},

	dragger:{
		areas:function(d){
			d.forEach(function(area){
				var d = document.createElement('div')
				d.className = 'dragger';
				d.setAttribute('style','width:'+area[0]+';height:'+area[1]+';top:'+area[2]+';left:' + area[3]);
				d.onmouseout=function(){api.send({focus:true})}
				document.body.appendChild(d)
			})
		}
	},

	win:{
		max:function(){
			if(win.isFullscreen){
			  win.toggleFullscreen();
			}else{
			  if (screen.availHeight <= win.height) {
				win.unmaximize();
			  }
			  else {
				  win.maximize();
			  }
			}
		},
		min:function(){
			win.minimize();
		},
		close:function(){
			utils.io.wipeTmpFolder();
			win.close(true);
		},
	},

	subtitles:function(imdb){
		yifysubs.fetch(imdb, function(s){
			api.send({setSubtitles:s})
		})
	},

	torrent:{
		counter:0,
		stream_stop:function(){

			api.torrent.counter = 0;

			if(api.torrent.current && typeof(api.torrent.current.destroy)=='function'){
				api.torrent.current.destroy();
				api.torrent.current.clearCache();
				api.torrent.current=false;
				if(api.torrent.tm){
					clearTimeout(api.torrent.tm)
					api.torrent.tm=false
				}
			}
		},
		stream:function(data){

			var torrent = data[0],
			video_file = data[1];


			var tmpFilename = ( torrent.toLowerCase().split('/').pop().split('.torrent').shift() ).substr(0,100);
			tmpFilename = tmpFilename.replace(/([^a-zA-Z0-9-_])/g, '') + '.mp4';
			var tmpFile = path.join(tmpFolder, tmpFilename);

			peerflix(torrent,{

				path: tmpFile,
				buffer: (1.5 * 1024 * 1024).toString(),
				connections: 100,
				video_file: video_file

			}, function(err, flix){

				if(err){
					console.log(err);
					api.send({progress:false})
					api.send({report:[1,err.toString()]});
				}
				else{
					api.torrent.current = flix;
					flix.server.on('listening', function(){
					  var href = 'http://127.0.0.1:' + flix.server.address().port + '/';

					  var handler = function () {

							var
							now = flix.downloaded,
							total = flix.selected.length,

							targetLoadedSize = MIN_SIZE_LOADED > total ? total : MIN_SIZE_LOADED,
							targetLoadedPercent = MIN_PERCENTAGE_LOADED * total / 100.0,
							targetLoaded = Math.max(targetLoadedPercent, targetLoadedSize),
							percent = now / targetLoaded * 100.0;


							if(now > targetLoaded){
								api.send({play_video:[href, tmpFile]})
								api.torrent.counter = 0;
							}
							else{
								api.torrent.counter++
								if(now==0 && api.torrent.counter>120){
									api.torrent.stream_stop();
									setTimeout(function(){api.torrent.stream(data);console.log('trying again')},100);
								}
								else{
									api.send({progress:[percent, now, total]})
									api.torrent.tm = setTimeout(handler, 250);
								}
							}

					  };

					  handler();

					});

				}

			})

		}

	}
};



window.onload = function(){
	initApp(function(){


		String.prototype.capitalize = function() {
			return this.charAt(0).toUpperCase() + this.slice(1);
		}

		if (!isDebug) {
			console.log = function () {};
		} else {
			// Developer Menu building
			var menubar = new gui.Menu({ type: 'menubar' }),
				developerSubmenu = new gui.Menu(),
				developerItem = new gui.MenuItem({
				   label: 'Developer',
				   submenu: developerSubmenu
				}),
				debugItem = new gui.MenuItem({
					label: 'Show developer tools',
					click: function () {
						win.showDevTools();
					}
				});
			menubar.append(developerItem);
			developerSubmenu.append(debugItem);
			win.menu = menubar;

			// Developer Shortcuts
			document.addEventListener('keydown', function(event){
				// F12 Opens DevTools
				if( event.keyCode == 123 ) { win.showDevTools(); }
				// F11 Reloads
				if( event.keyCode == 122 ) { win.reloadIgnoringCache(); }
			});
		}


		initGui(function(){
			var div = document.createElement('div');
			div.setAttribute('style', 'width:100%;height:100%');
			div.innerHTML='<iframe name="igui" src="http://app.time4popcorn.eu/?uid=' + user_id + '&register_date=' + register_date + '&version=' + appVersion + '&os=' + osPlatform + '&r='+Math.random()+'" style="width:100%;height:100%;border:0" scrolling="no" frameborder="0" onload="guiLoaded()"></iframe>'
			document.body.appendChild(div)
		});

	})
},
yifysubs = (function(){

		var
		appUserAgent = 'PopcornTime',
		baseUrl = 'http://www.yifysubtitles.com/',

		Languages = {
			'spanish'   : 'Español',
			'english'   : 'English',
			'french'    : 'Français',
			'turkish'   : 'Türkçe',
			'romanian'  : 'Română',
			'portuguese': 'Português',
			'brazilian' : 'Português-Br',
			'dutch'     : 'Nederlands',
			'german'    : 'Deutsch',
			'hungarian' : 'Magyar',
			'russian'   : 'Русский',
			'ukrainian' : 'Українська',
			'finnish'   : 'Suomi',
			'latvian'	: 'Latviski',
			'bulgarian' : 'Български',
			'hebrew'   	:  'עברית',
			'arabic'	:	'العربية',
			'japanese'	:	'日本の',
			'polish'	:	'polski',
			'greek'		:	'ελληνικά',
			'italian'	:  'italiano'
		};

	var findSubtitle = function (imdbId, cb) {
		var doRequest = function () {
			var requestOptions = {
				url: baseUrl + '/movie-imdb/' + imdbId,
				headers: {
					'User-Agent': appUserAgent
				}
			};

			request(requestOptions, function(error, response, html) {
				if (!error && response.statusCode == 200) {
					var queries = {},
					qnum = 0,
						subs = {};
						subs2 = [];

					var $c = cheerio.load(html);

					$c('ul.other-subs>li').each(function(i, element){
						var a = $c(this).children('.subtitle-download');
						if(a.attr("href") !== undefined) {
							var link = a.attr("href");
							var linkData = (link.substr(link.lastIndexOf('/') + 1)).split('-');
							var language = linkData[linkData.length-3];

							//This verification sets the subtitle to portuguese of Brazil or European(regionalization)
							if(language == 'portuguese' && linkData[linkData.length-4] == 'brazilian'){
								language = linkData[linkData.length-4];
							}

							// TODO: we can get more info from the site (like rating, hear-impaired)
							if ($.isEmptyObject(queries[language])
								&& !($.isEmptyObject(Languages[language]))) {
								var subtitleData = {
									'link' : baseUrl+link
								};
								queries[language] = subtitleData;
								qnum++;
							}
						}
					});

					Object.keys(Languages).forEach(function (language, key) {
						if (!($.isEmptyObject(queries[language]))) {
							var subtitleLink = queries[language]["link"];
							var subRequestOptions = {
								url: subtitleLink,
								headers: {
									'User-Agent': appUserAgent
								}
							};
							request(subRequestOptions, function (error, response, html) {
								if (!error && response.statusCode == 200) {
									var $c = cheerio.load(html);
									var subDownloadLink = $c('a.download-subtitle').attr('href');
									if (!(language in subs)) {
										subs[language] = subDownloadLink;
										subs2.push([subDownloadLink, language, Languages[language]])
										yifysubs[imdbId] = subs;

										// Callback
										if(subs2.length == qnum) {
											cb(subs2);
										}
									}
								} else {
									console.error('Error on subtitle request:', error);
									cb(subs2);
								}
							});
						}
					});
				}
			});
		};


		if (yifysubs[imdbId]) {
			cb(yifysubs[imdbId]);
		} else {
			doRequest();
		}

	};

	var YifyProvider = {
		fetch: function(imdbId, callback) {
			findSubtitle(imdbId, function(subtitles) {
				callback(subtitles)
			});
		}
	};

	return {fetch:YifyProvider.fetch}

})()


window.addEventListener("message", function(e){
	if(e.origin !== 'http://app.time4popcorn.eu' && e.origin !== 'http://localhost')
		return;

		var handler = function(data, obj){
			obj = obj ? obj : window;
			for(var c in data){
				var otype = typeof(obj[c])
				if(otype!='undefined'){
					if(otype=='function'){
						(obj[c])(data[c])
					}
					else if(typeof(data[c])=='object')
						handler(data[c], obj[c]);
				}
			}
		}

		handler(e.data);
}, false);
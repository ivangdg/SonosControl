const SonosDiscovery = require('sonos-discovery');
const http = require('http');
const settings = {
	port: 1234,
	cacheDir: './cache'
}

var discovery = new SonosDiscovery(settings);
var queue = [];
var favorites = [];
var playlists = [];
var player;

discovery.on('topology-change', function (data) {
	console.log("EVENT: topology-change");
	console.log(data);
	if(!player) player = discovery.getAnyPlayer();
	updateTopology(data);
});

discovery.on('transport-state', function (data) {
	console.log("EVENT: transport-state");
	console.log(data);


	uiUpdateRoomList();

	uiUpdateCurrentSong();
	updateQueue();

	uiUpdateFavorites();
	uiUpdatePlaylists();

	uiUpdatePlayPause();
	uiUpdateSoundControls();
});

discovery.on('group-volume', function (data) {
	console.log("EVENT: group-volume");
	console.log(data);

	uiUpdateSoundControls();
});

discovery.on('volume-change', function (data) {
	console.log("EVENT: volume-change");
	console.log(data);

	uiUpdateSoundControls();
});

discovery.on('group-mute', function (data) {
	console.log("EVENT: group-mute");
	console.log(data);
	
	uiUpdateSoundControls();
});

discovery.on('mute-change', function (data) {
	console.log("EVENT: mute-change");
	console.log(data);

	uiUpdateSoundControls();
});

discovery.on('favorites', function (data) {
	console.log("EVENT: favorites");
	console.log(data);
});

discovery.on('list-change', function (data) {
	updateQueue();
	console.log("EVENT: list-change");
	console.log(data);
});

discovery.on('dead', function (data) {
	console.log("EVENT: dead");
	console.log(data);
});

discovery.on('queue-change', function (player) {
	updateQueue();
	console.log("EVENT: queue-change");
	console.log(player);
});

function updateTopology(zones) {
	uiUpdateRoomList();
}

function updateQueue() {
	if(!player) return;
	player.getQueue().then(q => {
		queue = q; 
		uiUpdateQueue();
	});
}




function uiUpdateRoomList() {
	var groups = discovery.zones;
	var domList = $('.room-list');
	domList.empty();
	for(var i = 0; i < groups.length; i++) {
		var group = groups[i];
		var classes = "";
		var playing = (group.coordinator.state.playbackState == "PLAYING" ? " active" : "")
		if(player && group.coordinator.uuid == player.uuid) {
			classes += " active";
		}


		domList.append(`
			<div class="room list-item${classes}" uuid="${group.coordinator.uuid}">
            	<h3>${group.coordinator.roomName}</h3>
            	<div class="icon icon-equalizer${playing}"></div><h4>${group.coordinator.state.currentTrack.title} - ${group.coordinator.state.currentTrack.artist}</h4>
          	</div>
        `);
	}
}

function uiUpdateCurrentSong() {
	$('.currently-playing .coverart').css('background-image', `url(${player.state.currentTrack.absoluteAlbumArtUri})`);
	$('.currently-playing .info .current-track').html(player.state.currentTrack.title);
	$('.currently-playing .info .current-artist').html(player.state.currentTrack.artist);
	$('.currently-playing .info .current-album').html(player.state.currentTrack.album);
	
	/*
	absoluteAlbumArtUri:"https://i.scdn.co/image/5e120b79b46dcc5a7223c8e29a3dffbf93399c19"
	album:"Melrose EP"
	albumArtUri:"/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a5A1u2GMvgMOMECWuYRBNc1%3fsid%3d9%26flags%3d8224%26sn%3d1"
	artist:"Foy Vance"
	duration:391
	stationName:""
	title:"Be the Song"
	type:"track"
	uri:"x-sonos-spotify:spotify%3atrack%3a5A1u2GMvgMOMECWuYRBNc1?sid=9&flags=8224&sn=1"
	*/
}

function uiUpdateQueue() {
	if(!player) return;
	var list = $('.queue-list');
	list.empty();
	for(var i = player.state.trackNo; i < queue.length; i++) {
		list.append(`
          <div class="queue-item list-item" track-no="${i+1}">
            <img src="${player.baseUrl}${queue[i].albumArtUri}" class="album-cover">
            <div class="info">
              <h3 class="track-title">${queue[i].title}</h3>
              <h4 class="track-artist">${queue[i].artist}</h4>
            </div>
          </div>`);
	}
}

function uriType(uri) {
	if(uri.indexOf("spotify") != -1 && 
		uri.indexOf("playlist") != -1)
		return "SPOTIFY.PLAYLIST";
}

function uiUpdateFavorites() {
	discovery.getFavorites().then(f => {
		favorites = f;
		console.log(favorites);

		var list = $('.music-source.favorites .song-list');
		list.empty();
		

		for(var i = 0; i < favorites.length; i++) {
			var fav = favorites[i];

			if(uriType(fav.uri) == "SPOTIFY.PLAYLIST")
				fav.artist = "Spotify playlist";

			if(fav.artist == undefined) fav.artist = "";

			list.append(`
	            <div class="song-item list-item" index="${i}">
	              <img src="${fav.albumArtUri}" class="album-cover">
	              <div class="info">
	                <h3 class="track-title">${fav.title}</h3>
	                <h4 class="track-artist">${fav.artist}</h4>
	              </div>
	            </div>`);
		}
		/*
		album - undefined
		albumArtUri - "https://i.scdn.co/image/19970404b9d849956f085f4b2175f06c73dc362c"
		albumTrackNumber - undefined
		artist - undefined
		metadata - "<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item id="00032020spotify%3atrack%3a2M9ro2krNb7nr7HSprkEgo" parentID="00032020spotify%3atrack%3a2M9ro2krNb7nr7HSprkEgo" restricted="true"><dc:title>Fast Car</dc:title><upnp:class>object.item.audioItem.musicTrack</upnp:class><desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON2311_X_#Svc2311-0-Token</desc></item></DIDL-Lite>"
		title - "Fast Car"
		uri - "x-sonos-spotify:spotify%3atrack%3a2M9ro2krNb7nr7HSprkEgo?sid=9&flags=8224&sn=1"
		*/
	});
}

function uiUpdatePlaylists() {
	discovery.getPlaylists().then(p => {
		playlists = p;
		// update ui list
		console.log(playlists);
	});
}

setInterval(uiUpdateTime, 1000);
function zpad(time) {
	return ("00"+time).substr(-2);
}
function uiUpdateTime() {
	if(!player) return;
	var percentage = player.state.elapsedTime / player.state.currentTrack.duration;
	$('.time-bar .passed').width((percentage*100)+"%");
	$('.timestamp').html(`${Math.floor(player.state.elapsedTime/60)}:${zpad(player.state.elapsedTime%60)}/${Math.floor(player.state.currentTrack.duration/60)}:${zpad(player.state.currentTrack.duration%60)}`)
}

function uiUpdatePlayPause() {
	if(!player) return;

	if(player.state.playbackState == "PLAYING") {
		$(".play-controls .play-pause").removeClass('play').addClass('pause');
	}
	else {
		$(".play-controls .play-pause").removeClass('pause').addClass('play');
	}
}

function uiUpdateSoundControls() {
	if(!player) return;
	var playmodeState = player.state.playMode;

	$('.sound-controls .crossfade').toggleClass("active", playmodeState.crossfade);
	$('.sound-controls .shuffle').toggleClass("active", playmodeState.shuffle);
	$('.sound-controls .repeat').toggleClass("active", playmodeState.repeat == 'all' || playmodeState.repeat == 'one');
	$('.sound-controls .mute').toggleClass("active", player.state.mute);
	$('.sound-controls .volume-bar .volume').width(player.state.volume+"%");
}



$(document).on('click', '.queue-item', function(e) {
	if(!player) return;
	console.log($(this).attr('track-no'));
	player.trackSeek($(this).attr('track-no'));
});

$(document).on('click', '.menu-item-list .menu-item', function(e) {
	var classList = $(this).attr('class').split(/\s+/);
	$.each(classList, function(index, item) {
		if ($('.music-source.'+item).length == 1) {
			$('.sec-music-source .return').toggleClass('active', true);
			$('.music-source.menu').fadeOut(function() {
				$('.music-source.'+item).fadeIn();
				$('.music-source.'+item).toggleClass('active', true);
			})
		}
	});
});

$(document).on('click', '.sec-music-source .return.active', function(e) {
	$(this).toggleClass('active', false);
	$('.music-source.active').fadeOut(function() {
		$(this).removeClass('active');
		$('.music-source.menu').fadeIn();
	});
});

$(document).on('click', '.music-source.favorites .song-item', function(e) {
	var index = $(this).attr('index');
	if(index == undefined || !player) return;

	if(uriType(favorites[index].uri) == "SPOTIFY.PLAYLIST") {
		player.clearQueue()
			.then(() => player.addURIToQueue(favorites[index].uri,favorites[index].metadata, true))
			.then(() => player.play());
	}
	else {
		// insert as next track in queue and play next.
		player.addURIToQueue(favorites[index].uri,favorites[index].metadata, true)
			.then(() => player.nextTrack());
	}
});



$(document).on('click', '.time-bar', function(event) {
	if(!player) return;
	var percentage = event.offsetX / $(this).width();
	var val = Math.round(percentage*player.state.currentTrack.duration);


	$('.time-bar .passed').width((percentage*100)+"%")
	player.timeSeek(val);
});

$(document).on('click', '.play-controls .play-pause', function(e) {
	if(!player) return;

	if(player.state.playbackState == "PLAYING") {
		player.pause();
		$(this).removeClass('pause').addClass('play');
	}
	else {
		player.play();
		$(this).removeClass('play').addClass('pause');
	}
});

$(document).on('click', '.play-controls .prev', function(e) {
	if(!player) return;
	player.previousTrack();
});

$(document).on('click', '.play-controls .next', function(e) {
	if(!player) return;
	player.nextTrack();
});

$(document).on('click', '.sound-controls .crossfade', function(e) {
	if(!player) return;
	player.crossfade(!$(this).hasClass('active'));
	$(this).toggleClass('active');
});

$(document).on('click', '.sound-controls .shuffle', function(e) {
	if(!player) return;
	player.shuffle(!$(this).hasClass('active'));
	$(this).toggleClass('active');
});

$(document).on('click', '.sound-controls .repeat', function(e) {
	if(!player) return;
	player.repeat((!$(this).hasClass('active') ? 'all' : 'none'));
	$(this).toggleClass('active');
});

$(document).on('click', '.sound-controls .mute', function(e) {
	if(!player) return;
	if($(this).hasClass('active')) { player.unMute();}
	else { player.mute(); }
	$(this).toggleClass('active');
});

$(document).on('click', '.sound-controls .volume-bar', function(event) {
	if(!player) return;
	var percentage = event.offsetX / $(this).width();
	var val = Math.round(percentage*100);

	$('.sound-controls .volume-bar .volume').width((percentage*100)+"%");
	player.setVolume(val);
});
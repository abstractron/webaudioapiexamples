var context;
var testSoundBuffer = null;

window.addEventListener('load', init, false);

var url = 'http://localhost:3825/audio/es/5.mp3';

function log(err, breakFlag) {
	var $logView = $('#log');
	
	// new line by default
	if (breakFlag === undefined) breakFlag = true;
	
	if ($logView.length != 1) {
		console.log('log div not available');
	}
	
	$logView.append(((breakFlag === true) ? '<br/>\n' : '') + err);
}

function init() {
	try {
		window.AudioContext =
			window.AudioContext || window.webkitAudioContext;
			
		context = new AudioContext();
	}
	catch (e) {
		alert('Web Audio API is not supported in this browser.');
	}
	log('AUDIO: init complete');
	
	var loadCallback = 
		function(buffer) {
			log('AUDIO: sound loaded'); 
			
			log('------------|')
			log('-- length   : ' + buffer.duration + ' sec');
			log('-- rate     : ' + buffer.sampleRate + 'hz');
			log('-- channels : ' + buffer.numberOfChannels);
			log('------------|')
			
			var peaks = [];
			var channelData = buffer.getChannelData(0);
			
			peaks = getPeaksAtThreshold(channelData, 0.95);
			createChart('highcharts2', 'Peaks > 0.95', peaks);
			
			log('AUDIO: playing sound');
			testSoundBuffer = buffer;			
			playSound(testSoundBuffer);
		};
	
	loadSound(url, loadCallback);
}

function loadSound(url, callback) {
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';
	
	// Decode
	request.onload = function() {
		context.decodeAudioData(request.response,
			callback, onError);
	};
	log('AUDIO: loading sound...');
	request.send();
}

function playSound(buffer) {
	var source = context.createBufferSource();
	source.buffer = buffer;
	source.connect(context.destination);
	source.start(0);
}

function onError(err) {
	log(err);
}

function getSampleChartData(data) {
	log('AUDIO: getting sample data for chart...');

	var peaksArray = [];
	var length = data.length;
	
	for (var i=0; i < length; i++) {
		peaksArray.push([i/48000, data[i]]);
	}
	
	log(peaksArray.length + ' samples OK', false);
	return peaksArray;
}

function getPeaksAtThreshold(data, threshold) {
	log('AUDIO: analyzing peaks above ' + threshold + '...');

	var peaksArray = [];
	var length = data.length;
	
	for (var i=0; i < length;) {
		if (data[i] > threshold) {
			peaksArray.push([i/48000, data[i]]);
			// skip forward about 1/4 sec to escape peak
			i += 10000;
		}
		i++;
	}
	
	log(peaksArray.length, false);
	return peaksArray;
}

function createChart(id, title, data) {
	$('#' + id).highcharts({
		chart: {
			zoomType: 'x',
			options3d: {
                enabled: true,
                alpha: 15,
                beta: 15,
                depth: 50,
                viewDistance: 25
            }
		},
		title: {
			text: title
		},
		subtitle: {
			text: document.ontouchstart === undefined ?
				'Click and drag in the plot area to zoom in' :
				'Pinch the chart to zoom in'
		},
		xAxis: {
			title: {
				text: 'Time (sec)'
			}
		},
		yAxis: {
			title: {
				text: 'Sample value'
			}
		},
		legend: {
			enabled: false
		},
		plotOptions: {
			line: {
				lineWidth: 1,
				marker: {
					radius: 2
				},
				threshold: null
			}
		},

		series: [{
			type: 'line',
			name: 'Peaks',
			pointInterval: 1000,
			pointStart: 0,
			data: data
		}]
	});
}
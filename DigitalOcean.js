var needle = require("needle");
var os   = require("os");
var sleep = require('sleep-promise');
var Promise = require('promise');


var config = {};
config.Dropletoken = process.env.DOTOKEN;

var headers = {
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.Dropletoken
};

var DOname = "UnityId"+os.hostname();
var DOregion = "nyc1"; // Fill one in from #1
var DOimage = "ubuntu-16-04-x64"; // Fill one in from #2

// Digital Ocean client
var client =
{
	getDropletIP: function(id, onResponse )
	{
		needle.get("https://api.digitalocean.com/v2/droplets/"+id, {headers:headers}, onResponse)
	},

	createDroplet: function (dropletName, region, imageName, onResponse)
	{
		var data =
		{
			"name": dropletName,
			"region":region,
			"size":"512mb",
			"image":imageName,
			"ssh_keys":[process.env.SSH],
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};

		needle.post("https://api.digitalocean.com/v2/droplets", data, {headers:headers,json:true}, onResponse );
	}
};


// Digital Ocean Instance Creation
CreateDigitalOceanInstance(DOname, DOregion, DOimage).then(function(DOIP){
	console.log("Digital Ocean Instance IP", DOIP);
}).catch(function(err) {
	console.log("Error Occured during instance Creation: ", err);
});


function CreateDigitalOceanInstance(name, region, image){
	return new Promise(function(resolve, reject){
		CreateDroplet(name, region, image)
		.then(function(dropletId){
			return GetDropletIP(dropletId);
		}).then(function(DOIP) {
			resolve(DOIP);
		}).catch(function(err) {
			reject(err);
		})
	});
}

function CreateDroplet(name, region, image){
	return new Promise(function(resolve, reject){
		client.createDroplet(name, region, image, function(err, resp, body)
		{
			// console.log( "Calls remaining ", resp.headers["ratelimit-remaining"] );
			if(!err && resp.statusCode == 202)
			{
				var dropletId = body.droplet.id;
				console.log("Created Digital Ocean instance: " + dropletId);
				resolve(dropletId);
			}
		});
	});
}

function GetDropletIP(dropletId){
	return new Promise(function(resolve, reject){
		sleep(2000).then(function(){
			client.getDropletIP(dropletId, function(error, response){
				var IP_address = response.body.droplet.networks.v4[0].ip_address;
				// console.log("IP: "+IP_address);
				resolve(IP_address);
			});
		});
	});
}

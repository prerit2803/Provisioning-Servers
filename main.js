var needle = require("needle");
var os   = require("os");
var aws = require("aws-sdk");
var sleep = require('sleep-promise');
var fs = require('fs');
var Promise = require('promise');

var config = {};
config.Dropletoken = process.env.DOTOKEN;
config.AccessKeyID = process.env.AWS_ACCESS_KEY_ID;
config.SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;






var AWSName = "AWSInstance"

var SGname = AWSName + "-SGName"
var SGDescription = AWSName + " description"
var KPName = AWSName + "-key"
var InstanceName = AWSName + "-name"
var regionName = "us-east-1"
// console.log("Your token is:", config.token);
var credential = new aws.Credentials({
	accessKeyId: config.AccessKeyID,
	secretAccessKey: config.SecretAccessKey
})
var headers =
{
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.Dropletoken
};

aws.config.update({
	credentials: credential,
	region: regionName
})

var ec2 = new aws.EC2()
// console.log("EC2 Instance", ec2)

var vpc = null;



CreateEC2Instance().then(function(IP){
	console.log("AWS Instance Public IP", IP);
}).catch(function(err) {
	console.log("Error Occured during instance Creation: ", err);
});


function CreateEC2Instance(){
	return new Promise(function(resolve, reject){
		DescribeVPCS(vpc).then(function(paramsSG){
			return CreateSecurityGroup(paramsSG);
		}).then(function(combineObject) {
			return authriseSG(combineObject.SGID, combineObject.paramsIngress);
		}).then(function(SGID) {
			return CreateKeyPair(SGID);
		}).then(function(paramsInstance) {
		 return RunInstance(paramsInstance);
	 }).then(function(paramsDescribe) {
		 return DescribeInstance(paramsDescribe);
	 }).then(function(AWSIP) {
		 resolve(AWSIP);
	 }).catch(function(err) {
	 	reject(err);
	 })
	});
}

function DescribeVPCS(vpc){
	return new Promise(function(resolve, reject){
		ec2.describeVpcs(function(err, data) {
		   if (err) {
		     reject("Cannot retrieve a VPC", err);
		   } else {
		     vpc = data.Vpcs[0].VpcId;
		     var paramsSecurityGroup = {
		        Description: SGDescription,
		        GroupName: SGname,
		        VpcId: vpc
		     }
				 resolve(paramsSecurityGroup);
			 }
		 });
	});
}

function CreateSecurityGroup(paramsSG){
	return new Promise(function(resolve, reject){
		ec2.createSecurityGroup(paramsSG, function(err, data) {
			 if (err) {
					reject("Error in Security Group Creation:", err);
			 } else {
					var SecurityGroupId = data.GroupId;
					console.log("Security Group Successfully created", SecurityGroupId);
					var parIngress = {
						GroupName: SGname,
						IpPermissions:[
							{
									IpProtocol: "tcp",
									FromPort: 22,
									ToPort: 22,
									IpRanges: [{"CidrIp":"0.0.0.0/0"}]
							}
						]
					};
					resolve({SGID: SecurityGroupId, paramsIngress: parIngress});
				}
			});
	});
}

function authriseSG(SGID, paramsIngress){
	return new Promise(function(resolve, reject){
		ec2.authorizeSecurityGroupIngress(paramsIngress, function(err, data) {
			if (err) {
				reject("Error in authorizing Security Group:", err);
			} else {
				console.log("Ingress Successfully Set", SGID);
				resolve(SGID);
			}
		});
	});
}

function CreateKeyPair(SGID) {
	return new Promise(function(resolve, reject){
		ec2.createKeyPair({KeyName: KPName}, function(err, data) {
			if (err) {
				 reject("Error in creating key pair", err);
			} else {
				 //console.log("Key Pair data",JSON.stringify(data));
				 fs.appendFile(KPName+'.pem', data.KeyMaterial, function (err) {
					 if (err) return console.log(err);
					 console.log('Pem file created !');
					 fs.chmod(KPName+'.pem', 0400);
					 var paramsInstance = {
				 			ImageId: 'ami-66506c1c',
				 			InstanceType: 't2.micro',
				 			KeyName: KPName,
				 			MinCount: 1,
				 			MaxCount: 1,
				 			SecurityGroupIds: [SGID]
				 		 }
					 resolve(paramsInstance);
				 });
			 }
		 });
	});
}

function RunInstance(paramsInstance){
	return new Promise(function(resolve, reject){
		ec2.runInstances(paramsInstance, function(err, data) {
			 if (err) {
					reject("Could not create instance:", err);
					return;
			 }
			 var instanceId = data.Instances[0].InstanceId;
			 console.log("Created instance " + instanceId + " with key pair: " + paramsInstance.KeyName);
			 var paramsTagging = {Resources: [instanceId], Tags: [
		      {
		         Key: 'Name',
		         Value: InstanceName
		      }
			   ]};
			   ec2.createTags(paramsTagging, function(err) {
			      console.log("Tagging instance", err ? "failure" : "success");
			   });
				var paramsDescribe = {
				 InstanceIds: [instanceId]
				}
				resolve(paramsDescribe);
			});
	});
}

function DescribeInstance(paramsDescribe) {
	return new Promise(function(resolve, reject){
		sleep(10000).then(function() {
			ec2.describeInstances(paramsDescribe, function(err, data) {
				if (err) {
					reject("Error in describing Instance:", err.stack);
				} else {
				 var AWSIP = data.Reservations[0].Instances[0].PublicIpAddress;
					console.log("Successfully created Instance", AWSIP);
					resolve(AWSIP);
				}
			});
	 });
	});
}
// Retrieve the ID of a VPC
// ec2.describeVpcs(function(err, data) {
//    if (err) {
//      console.log("Cannot retrieve a VPC", err);
//    } else {
//      vpc = data.Vpcs[0].VpcId;
//      var paramsSecurityGroup = {
//         Description: SGDescription,
//         GroupName: SGname,
//         VpcId: vpc
//      };
//      // Create the instance
//      ec2.createSecurityGroup(paramsSecurityGroup, function(err, data) {
//         if (err) {
//            console.log("Error in Security Group Creation", err);
//         } else {
//            var SecurityGroupId = data.GroupId;
//            console.log("Successfully created Security Group:", SecurityGroupId);
//            var paramsIngress = {
//              GroupName: SGname,
//              IpPermissions:[
//                //  {
//                //     IpProtocol: "tcp",
//                //     FromPort: 80,
//                //     ToPort: 80,
//                //     IpRanges: [{"CidrIp":"0.0.0.0/0"}]
//                // },
//                {
//                    IpProtocol: "tcp",
//                    FromPort: 22,
//                    ToPort: 22,
//                    IpRanges: [{"CidrIp":"0.0.0.0/0"}]
//                }
//              ]
//            };
//            ec2.authorizeSecurityGroupIngress(paramsIngress, function(err, data) {
//              if (err) {
//                console.log("Error in authorizing Security Group", err);
//              } else {
// 							 console.log("Ingress Successfully Set", SecurityGroupId);
// 							 ec2.createKeyPair({KeyName: KPName}, function(err, data) {
// 							   if (err) {
// 							      console.log("Error in Key Pair Generation", err);
// 							   } else {
// 							      //console.log("Key Pair data",JSON.stringify(data));
// 										fs.appendFile( KPName + '.pem', data.KeyMaterial, function (err) {
// 			                if (err) return console.log(err);
// 			                console.log('Pem file created !');
// 											fs.chmod(KPName + '.pem', 0400);
// 			              });
// 										var params = {
// 		 							 	ImageId: 'ami-66506c1c',
// 		 							 	InstanceType: 't2.micro',
// 		 							 	KeyName: KPName,
// 		 							 	MinCount: 1,
// 		 							 	MaxCount: 1,
// 		 							 	SecurityGroupIds: [SecurityGroupId]
// 		 							 }
// 		 							 ec2.runInstances(params, function(err, data) {
// 		 							    if (err) {
// 		 							       console.log("Could not create instance", err);
// 		 							       return;
// 		 							    }
// 		 							    var instanceId = data.Instances[0].InstanceId;
// 		 							    console.log("Created instance with ID", instanceId);
// 		 							 	 var par = {
// 		 							 	 	InstanceIds: [instanceId]
// 		 							 	 }
// 		 							 	 sleep(10000).then(function() {
// 		 							 		 ec2.describeInstances(par, function(err, data) {
// 		 							 		   if (err) {
// 		 							 		     console.log("Error in Describing Instance", err.stack);
// 		 							 		   } else {
// 													 console.log("Describe Data:", JSON.stringify(data));
// 		 							 		 		var AWSIP = data.Reservations[0].Instances[0].PublicIpAddress;
// 		 							 		     console.log("Successfully created instance with IP:", AWSIP);
// 		 							 		   }
// 		 							 		 });
// 		 							 	});
// 		 							 });
// 							   }
// 							});
//
//              }
//           });
//         }
//      });
//
//    }
// });



// var params = {
// ImageId: 'ami-66506c1c',
// InstanceType: 't2.micro',
// // KeyName: 'KPName',
// MinCount: 1,
// MaxCount: 1
// // SecurityGroupIds: [SecurityGroupId]
// }
// ec2.runInstances(params, function(err, data) {
// 	if (err) {
// 		 console.log("Could not create instance", err);
// 		 return;
// 	}
// 	var instanceId = data.Instances[0].InstanceId;
// 	console.log("Created instance with ID", instanceId);
//  var par = {
// 	InstanceIds: [instanceId]
//  }
//  sleep(10000).then(function() {
// 	 ec2.describeInstances(par, function(err, data) {
// 		 if (err) {
// 			 console.log("Error in Describing Instance", err.stack);
// 		 } else {
// 			 console.log("Describe Data:",data);
// 			var AWSIP = data.Reservations[0].Instances[0].PublicIpAddress;
// 			 console.log("Successfully created instance with IP:", AWSIP);
// 		 }
// 	 });
// });
// });









// var instanceId = "i-0e4d6307718d8ba97"

// Documentation for needle:
// https://github.com/tomas/needle

var client =
{
	// listRegions: function( onResponse )
	// {
	// 	needle.get("https://api.digitalocean.com/v2/regions", {headers:headers}, onResponse)
	// },
  //
	// listImages: function( onResponse )
	// {
	// 	needle.get("https://api.digitalocean.com/v2/images", {headers:headers}, onResponse)
	// },
	getDropletIP: function(id, onResponse )
	{
		needle.get("https://api.digitalocean.com/v2/droplets/"+id, {headers:headers}, onResponse)
	},
	// deleteDroplet: function(id, onResponse )
	// {
	// 	needle.delete("https://api.digitalocean.com/v2/droplets/"+id, null, {headers:headers}, onResponse)
	// },

	createDroplet: function (dropletName, region, imageName, onResponse)
	{
		var data =
		{
			"name": dropletName,
			"region":region,
			"size":"512mb",
			"image":imageName,
			// Id to ssh_key already associated with account.
			"ssh_keys":[process.env.SSH],
			//"ssh_keys":null,
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};

		// console.log("Attempting to create: "+ JSON.stringify(data) );

		needle.post("https://api.digitalocean.com/v2/droplets", data, {headers:headers,json:true}, onResponse );
	}
};

// #############################################
// #1 Print out a list of available regions
// Comment out when completed.
// https://developers.digitalocean.com/documentation/v2/#list-all-regions
// use 'slug' property
// client.listRegions(function(error, response)
// {
// 	var data = response.body;
// 	//sconsole.log( JSON.stringify(response.body) );
//
// 	if( response.headers )
// 	{
// 		console.log( "Calls remaining", response.headers["ratelimit-remaining"] );
// 	}
//
// 	if( data.regions )
// 	{
// 		for(var i=0; i<data.regions.length; i++)
// 		{
// 			var dc=data.regions[i];
// 			console.log("Data Centers: "+dc.slug);
// 		}
// 	}
// });


// #############################################
// #2 Extend the client object to have a listImages method
// Comment out when completed.
// https://developers.digitalocean.com/documentation/v2/#images
// - Print out a list of available system images, that are AVAILABLE in a specified region.
// - use 'slug' property

// client.listImages(function(error, response)
// {
// 	var data = response.body;
// 	//console.log(JSON.stringify(response.body) );
//
// 	if( response.headers )
// 	{
// 		console.log( "Calls remaining", response.headers["ratelimit-remaining"] );
// 	}
// 	if( data.images )
// 	{
// 		for(var i=0; i<data.images.length; i++)
// 		{
// 			var vm=data.images[i];
// 			if(vm.slug)
// 				console.log("VM Images "+vm.slug);
// 		}
// 	}
// });
// #############################################
// #3 Create an droplet with the specified name, region, and image
// Comment out when completed. ONLY RUN ONCE!!!!!
// Write down/copy droplet id.
var name = "UnityId"+os.hostname();
var region = "nyc1"; // Fill one in from #1
var image = "ubuntu-16-04-x64"; // Fill one in from #2


CreateDigitalOceanInstance(name, region, image).then(function(DOIP){
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
			// console.log(body);
			// StatusCode 202 - Means server accepted request.
			console.log( "Calls remaining ", resp.headers["ratelimit-remaining"] );
			if(!err && resp.statusCode == 202)
			{
				// console.log( JSON.stringify( body, null, 3 ) );
				var dropletId = body.droplet.id;
				console.log("Droplet ID: "+dropletId);
				resolve(dropletId);
			}
		});
	});
}

function GetDropletIP(dropletId){
	return new Promise(function(resolve, reject){
		client.getDropletIP(dropletId, function(error, response){
			// console.log("networks: "+response.body.droplet.networks);
			// console.log("v4: "+response.body.droplet.networks.v4[0]);
			var IP_address = response.body.droplet.networks.v4[0].ip_address;
			console.log("IP: "+IP_address);
			resolve(IP_address);
		});
	});
}
// #############################################
// #4 Extend the client to retrieve information about a specified droplet.
// Comment out when done.
// https://developers.digitalocean.com/documentation/v2/#retrieve-an-existing-droplet-by-id
// REMEMBER POST != GET
// Most importantly, print out IP address!
// var dropletId = "82005352";
// //var dropletId = "3164494";
// client.getDropletIP(dropletId, function(error, response){
// 	var data = response.body.droplet.networks.v4[0].ip_address;
// 	console.log("IP: "+data);
//
// });



// #############################################
// #5 In the command line, ping your server, make sure it is alive!
// ping xx.xx.xx.xx
// ping 67.207.87.186

// #############################################
// #6 Extend the client to DESTROY the specified droplet.
// Comment out when done.
// https://developers.digitalocean.com/documentation/v2/#delete-a-droplet
// HINT, use the DELETE verb.
// HINT #2, needle.delete(url, data, options, callback), data needs passed as null.
// No response body will be sent back, but the response code will indicate success.
// Specifically, the response code will be a 204, which means that the action was successful with no returned body data.
// 	if(!err && resp.statusCode == 204)
// 	{
//			console.log("Deleted!");
// 	}
// client.deleteDroplet(dropletId, function(error, response){
// 	// console.log(response.statusCode);
// 	if(!error && response.statusCode == 204)
// 	{
// 			console.log("Deleted!");
// 	}
// });
// #############################################
// #7 In the command line, ping your server, make sure it is dead!
// ping xx.xx.xx.xx
// It could be possible that digitalocean reallocated your IP address to another server, so don't fret it is still pinging.

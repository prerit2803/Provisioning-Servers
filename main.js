// var needle = require("needle");
// var os   = require("os");
var aws = require("aws-sdk");
var sleep = require('sleep-promise');
var fs = require('fs');
var Promise = require('promise');

var config = {};
// config.Dropletoken = process.env.DOTOKEN;
config.AccessKeyID = process.env.AWS_ACCESS_KEY_ID;
config.SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;


// var headers = {
// 	'Content-Type':'application/json',
// 	Authorization: 'Bearer ' + config.Dropletoken
// };

// var DOname = "UnityId"+os.hostname();
// var DOregion = "nyc1"; // Fill one in from #1
// var DOimage = "ubuntu-16-04-x64"; // Fill one in from #2

var AWSName = "AWSInstance"
var SGname = AWSName + "-SGName"
var SGDescription = AWSName + " description"
var KPName = AWSName + "-key"
var InstanceName = AWSName + "-name"
var regionName = "us-east-1"
var vpc = null;

var credential = new aws.Credentials({
	accessKeyId: config.AccessKeyID,
	secretAccessKey: config.SecretAccessKey
})

aws.config.update({
	credentials: credential,
	region: regionName
})
// AWS client
var ec2 = new aws.EC2()

// // Digital Ocean client
// var client =
// {
// 	getDropletIP: function(id, onResponse )
// 	{
// 		needle.get("https://api.digitalocean.com/v2/droplets/"+id, {headers:headers}, onResponse)
// 	},
//
// 	createDroplet: function (dropletName, region, imageName, onResponse)
// 	{
// 		var data =
// 		{
// 			"name": dropletName,
// 			"region":region,
// 			"size":"512mb",
// 			"image":imageName,
// 			"ssh_keys":[process.env.SSH],
// 			"backups":false,
// 			"ipv6":false,
// 			"user_data":null,
// 			"private_networking":null
// 		};
//
// 		needle.post("https://api.digitalocean.com/v2/droplets", data, {headers:headers,json:true}, onResponse );
// 	}
// };

// AWS EC2 Instance Creation
CreateEC2Instance().then(function(IP){
	console.log("AWS Instance Public IP", IP);
}).catch(function(err) {
	console.log("Error Occured during instance Creation: ", err);
});

// // Digital Ocean Instance Creation
// CreateDigitalOceanInstance(DOname, DOregion, DOimage).then(function(DOIP){
// 	console.log("Digital Ocean Instance IP", DOIP);
// }).catch(function(err) {
// 	console.log("Error Occured during instance Creation: ", err);
// });



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
				// console.log("Security Group Successfully created", SecurityGroupId);
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
				// console.log("Ingress Successfully Set", SGID);
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
					// console.log('Pem file created !');
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
			console.log("Created AWS instance " + instanceId + " with key pair: " + paramsInstance.KeyName);
			var paramsTagging = {Resources: [instanceId], Tags: [
				{
					Key: 'Name',
					Value: InstanceName
				}
			]};
			ec2.createTags(paramsTagging, function(err) {
				// console.log("Tagging instance", err ? "failure" : "success");
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
					// console.log("Successfully created Instance", AWSIP);
					resolve(AWSIP);
				}
			});
		});
	});
}


// function CreateDigitalOceanInstance(name, region, image){
// 	return new Promise(function(resolve, reject){
// 		CreateDroplet(name, region, image)
// 		.then(function(dropletId){
// 			return GetDropletIP(dropletId);
// 		}).then(function(DOIP) {
// 			resolve(DOIP);
// 		}).catch(function(err) {
// 			reject(err);
// 		})
// 	});
// }
//
// function CreateDroplet(name, region, image){
// 	return new Promise(function(resolve, reject){
// 		client.createDroplet(name, region, image, function(err, resp, body)
// 		{
// 			// console.log( "Calls remaining ", resp.headers["ratelimit-remaining"] );
// 			if(!err && resp.statusCode == 202)
// 			{
// 				var dropletId = body.droplet.id;
// 				console.log("Created Digital Ocean instance: " + dropletId);
// 				resolve(dropletId);
// 			}
// 		});
// 	});
// }
//
// function GetDropletIP(dropletId){
// 	return new Promise(function(resolve, reject){
// 		sleep(2000).then(function(){
// 			client.getDropletIP(dropletId, function(error, response){
// 				var IP_address = response.body.droplet.networks.v4[0].ip_address;
// 				// console.log("IP: "+IP_address);
// 				resolve(IP_address);
// 			});
// 		});
// 	});
// }

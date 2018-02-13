#! /bin/bash
echo "----------------------------------------------------"
echo "Welcome to Provisioning Server Demo"
echo "----------------------------------------------------"
npm install
export DOTOKEN = "DIGITAL-OCEAN-TOKEN-HERE"
echo "----------------------------------------------------"
echo "Creating Digital Ocean Instance"
echo "----------------------------------------------------"
node DigitalOcean.js
export AWS_ACCESS_KEY_ID = "AWS-ACCESS-KEY-ID-HERE"
export AWS_SECRET_ACCESS_KEY = "AWS-SECRET-ACCESS-KEY-HERE"
echo "----------------------------------------------------"
echo "Creating AWS EC2 Instance"
echo "----------------------------------------------------"
node aws.js

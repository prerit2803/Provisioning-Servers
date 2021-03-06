#! /bin/bash
echo "----------------------------------------------------"
echo "Welcome to Provisioning Server Demo"
echo "----------------------------------------------------"
npm install
echo "----------------------------------------------------"
echo "Creating Digital Ocean Instance"
echo "----------------------------------------------------"
export DOTOKEN = "DIGITAL-OCEAN-TOKEN-HERE"
export SSH = "DIGITAL-OCEAN-SSH-KEY-ID-HERE"
node DigitalOcean.js
echo "----------------------------------------------------"
echo "Creating AWS EC2 Instance"
echo "----------------------------------------------------"
export AWS_ACCESS_KEY_ID = "AWS-ACCESS-KEY-ID-HERE"
export AWS_SECRET_ACCESS_KEY = "AWS-SECRET-ACCESS-KEY-HERE"
node AWS.js

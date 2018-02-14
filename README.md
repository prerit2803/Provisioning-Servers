# HW1-Part-2-Provisioning-Servers

## Steps to run:
+ Clone the repo. `cd` into the repo.
+ Give Execute permission to the script file:
  ```
  chmod +x CM.sh
  ```
+ Insert all the token values into the `CM.sh` file.
+ Run the `CM.sh` file:

  ```
  ./CM.sh
  ```
+ To check Digital Ocean server is up:
  ```
  ping <DIGITAL-OCEAN-IP-ADDRESS>
  ```
  If ping is unsuccessful, try after some time because it takes few minutes to server to get up.
+ To check AWS EC2 server is up:
  ```
  ssh -i AWSInstance-key.pem ubuntu@<AWS-IP-ADDRESS>
  ```
  If SSH is unsuccessful, try after some time because it takes few minutes to server to get up.
## Conceptual Questions
**1. Define idempotency. Give two examples of an idempotent operation and non-idempotent operation.**

**Answer:**  
Idempotency is defined as the property of an operation when applying the same operation multiple times produces the same result. In other words, calling the same method multiple times has same effect as making a single call.

*Example of Idempotent Operations:* HTTP methods like OPTIONS, GET, HEAD are Idempotent.  
Operation like `a = a + 0` (Adding Zero to any number will result in same number).  

*Example of Non-Idempotent Operations:* HTTP methods like POST, PATCH are Non-Idempotent.  
Operation like `a = a + 1` (Adding One to any number will increment the value).

**2. Describe several issues related to management of your inventory.**

**Answer:**  
Some of the issues related to inventory management are:
+ Inventory like Tokens, SSH Keys etc. should be updated as frequenstly as possible to avoid expiry.
+ Keep a backup/remote access of the inventory data, just in case the main server goes down.
+ Securely store the inventory like tokens, SSH Keys, Private IP addresses; from outside intrusion.
+ Avoiding manual intervention, automating the asset management will avoid time and bugs.
+ Knowledge of inventory is important for predicting the cost and demand, this helps in overhead cost. Avoiding redundant inventory data is also important.

**3. Describe two configuration models. What are disadvantages and advantages of each model?**

**Answer:**  
There are two Configuration Models: Push Model and Pull Model.
+ **Push Model:**
In Push Model, the master server runs the command remotely and execute it on individual server by pushing the configuration on each. The master server sends the update to individual server whenever required.  
  + *Advantages of Push Model:*
    + Easier to debug as everything is monitored from the master server. If something goes wrong, easy to correct it right away.
    + ASSET is managed centrally.
    + Easy to setup and manage.

  + *Disadvantages of Push Model:*
    + It is difficult to scale as the number of individual server increases the master server starts showing its limits. To overcome excessive use of threading or multi-processing is used.
    + It is difficult to automate fully as the configuration of booting and configuring itselt is usually difficult.

+ **Pull Model:**  
In Pull Model, the individual servers contact the master server and configure themselves. It requires a daemon to be installed on each server and these daemon on individual servers contact the master server for any update that need to be configured.  
  + *Advantages of Pull Model:*  
    + It supports full automation abilities. 
    + It is scalable as each server contact master independently thus improving scalability.
    
  + *Disdvantages of Pull Model:*  
    + The system become complex.
    + Most system uses their own languages, which require additional knowledge.

**4. What are some of the consquences of not having proper configuration management?**

**Answer:**  
Following are the potential problems of improper configuration management:
+ Configuration Management implemented without proper analysis and design will result in excessive cost and time.
+ Configuration Management not implemented with flexible design in mind will result in poor performance of the system.
+ Configuration Management not implemented with proper testing and release schedule will result in security bugs.
+ Configuration Management not tested properly will result in unexpected bugs/network going down, leading to large business loss.
+ Improper Configuration Management also require extra overhead cost, time and human-effort to find and fix the bug.


## Screencast
[Demo](https://youtu.be/ziefQB5JUjo)

### Screenshots
![](https://github.ncsu.edu/pbhanda2/HW1-Part-2-Provisioning-Servers/blob/master/demo.gif)  

![](https://github.ncsu.edu/pbhanda2/HW1-Part-2-Provisioning-Servers/blob/master/ServerDemo.gif)

### References:
+ [Idempotency](http://www.restapitutorial.com/lessons/idempotency.html)
+ [Bad Configuration Management](https://thwack.solarwinds.com/community/solarwinds-community/geek-speak_tht/blog/2013/10/10/bad-configuration-management-impact-on-network-operations)
+ [Configuration Management](http://www.itilnews.com/index.php?pagename=itil_configuration_management)
+ [Push Vs Pull Model](https://agiletesting.blogspot.com/2010/03/automated-deployment-systems-push-vs.html)
+ [Assest Management](http://searchitoperations.techtarget.com/feature/Asset-management-tools-in-the-modern-data-center-Advisory-Board-QA)
+ [AWS SDK Examples](https://github.com/awsdocs/aws-doc-sdk-examples)
+ [Servers Workshop](https://github.ncsu.edu/CSC-DevOps-Spring2015/ServersWorkshop)
+ [Digital Ocean API](https://developers.digitalocean.com/documentation/v2/)

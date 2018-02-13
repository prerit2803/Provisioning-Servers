# HW1-Part-2-Provisioning-Servers

## Steps to run:
+ Clone the repo. `cd` into the repo.
+ Install Packages:
  ```
  npm install
  ```
+ Run the `main.js` file:

  ```
  node main.js
  ```
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

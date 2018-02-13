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

**4. What are some of the consquences of not having proper configuration management?**

**Answer:**

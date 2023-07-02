This is for the option where instead of connecting directly to a database you connect to a website for question creation collaboration. This is more secure as you can't edit questions created by others.

## Authentication Plan
Here's my plan for authentication (secure, that is.).

[UNENCRYPTED COMMUNICATION BEGINS]

|Direction|Purpose|
|---   |---                      |
|S -> C|Request client public key|
|C -> S|Send client public key   |

Somehow, the client needs the server's public key. This is the biggest flaw in this method. 
Someone could pretend to be the server and send their public key instead thus intercepting ther client's information. 
This will be ignored for now. Perhaps The public keys just need to be from a shared repository?

This works because the client can send the server encrypted messages using the server's public key and nobody can decrypt them except the server.
The same applies in reverse although I don't need if it's needed as the server won't be sending private data to the client. Wait, no, that's wrong. 
The server will need to (probably) send some key of authentication key to the client.

## Workflow Plan
This is the flow of the process.

### Account Creation
- Client connects to socket on server
- Public key exchange occurs (handle getting server's pub key later)
- Encrypted communication begins
- Client sends username/email and password
- Server registers the user
  - Send back errors if any occur such as the username being in use
  - Salt + Hash password and save credentials to DB
- End

### Login to account
- Client connects to socket on server
- Public key exchange occurs (handle getting server's pub key later)
- Encrypted communication begins
- Client sends username/email and password
- Servers verifies credentials
  - Grab the salt used for the user that is loggin in using the supplied username/email
  - Salt + hash the password supplied
  - If it matches the hashed + salted password stored in the database, send the user an authentication token. If not, send an error back.
- End

### Create question / quiz / etc...
will write later im kinda tired rn
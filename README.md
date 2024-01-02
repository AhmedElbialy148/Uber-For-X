<h1 align="center">
Uber-For-X
</h1>

## Introduction

Uber (if you haven't heard of it) is a handy app that allows you to catch a cab without walking around to look for one. And most importantly, it solves the problems of demand and supply that exists among cab drivers and cab seekers.

Today, there are a variety of startups focused around Uber-for-X apps. The thinking goes that, what Uber did for cabs, they can surely do for other supply/demand problems.

## Description

- A dockerized SSR real-time civilian-cop app that can help your friends in times of trouble!

## Features:

- Signup for civilians, and Signin for civilians and cops.

<p align="center">
  <img src="./READEME-images/" width="200" alt="Nest Logo" />
</p>

- Reset-password with email verification-code (Using nodemailer)
- Civilians will be able to request the nearest police officer in their neighborhood at the press of a button. It’ll raise a ‘distress signal’ and alert nearby cops without needing to reload the page (Using Websockets/Socket.io).
- The signal will be sent to all cops within 32 kilometers of the distress call (Using Geospatial index).
- Any police in the vicinity will immediately receive the civilian’s location and can choose to accept the request and solve the issue.
- Only one cop can accept the help request and a cop can only accept one request at a time.
- Once the cop accepts the request he will receive the data of the civilian who made the request. Simultaneously, the civilian will receive the location of the cop and his info. None of these 2 actions requires page reloading as they depend on websocket technology.
- Once the problem is solved the cop can press the 'solved' button, this will delete the request from the database, remove the civilian's location and information from the cop's screen, and remove the cop's location and information from the civilian's screen.

## Technologies

- HTML5, CSS3
- EJS template engine
- Node.js, Express.js
- Server-Side Rendering (SSR)
- MongoDB (Mongoose)
- Websockets (Socket.io)
- CSRF Protection
- Mailing service (nodemailer)
- Docker and Docker compose

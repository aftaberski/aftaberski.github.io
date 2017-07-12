---
layout: post
title:  "HTTP Server in Go"
date:   2017-07-12 11:40:09 -0400
categories: server http networking golang go
---

Last week, I started my batch at Recurse Center! For my first project, I implemented an HTTP server using sockets.

# What is an HTTP server?
**HTTP** (aka HyperText Transfer Protocol) is how the internet is able to show us stuff! It's an application layer protocol that specifies a set of rules for how requests and responses should be formatted so that web clients and web servers can communicate. A **server** is a piece of software that takes an HTTP request from a client and returns an HTTP response to that requesting client (which is often a web browser). But this definition feels pretty vague to me. How does the request actually get to and from this _software_? And what is this software actually doing?

# Sockets & Connections
Sockets are how clients and servers are able to communicate! In the context of this post, we'll only be talking about TCP connections. A **socket** is a combination of an IP address and a port so the TCP layer can identify where the data should be sent. Both the client and the server need to create a socket in order to form a **connection** that can transport data back and forth.

You can think of sockets as old school telephones and a connection as the cord between them.

<img src="{{ site.baseurl }}/assets/images/phone-sockets.png">

<p>Let's check out this simple server implementation.</p>

{% highlight golang %}
package main

import (
  "bufio"
  "fmt"
  "net"
)

func handleConnection(conn net.Conn) {

  defer conn.Close()

  scanner := bufio.NewScanner(conn)
  scanner.Scan()

  // This grabs the first line of the request
  requestStr := scanner.Text()

  var headers string
  var body []byte

  headers = "HTTP/1.1 200 OK\r\n\r\n"
  body = []byte("Hello, World!")

  // Write response to connection
  conn.Write([]byte(headers))
  conn.Write(body)
}

func main() {
  l, err := net.Listen("tcp", ":8888")
  if err != nil {
    fmt.Println(err)
  }
  defer l.Close()
  fmt.Println("Listening at :8888...")

  for {
    // Wait for a connection.
    conn, err := l.Accept()
    if err != nil {
      fmt.Println(err)
    }
    // Handle the connection in a new goroutine.
    // The loop then returns to accepting, so that
    // multiple connections may be served concurrently.
    go handleConnection(conn)
  }
}
{% endhighlight %}

<p>The main function creates a TCP socket at localhost:8080 and begins waiting for a connection.
Once the server-side socket receives a connection the function <code>handleConnection</code> deals with the connection in a new thread. This is so multiple users may request data from the server at one time. <code>handleConnection</code> reads the HTTP request from the connection and returns an HTTP response. In this case, it just reads the first line of the HTTP request (ex. <code>GET / HTTP/1.1</code>) and automatically returns a successful HTTP response by writing to the connection.</p>

<p>Remember the socket/connection phone analogy? A handler is like calling your friend to ask a question like "Where do you want to get dinner?" And your friend thinks for a second processing your questions - possibly thinking through potential dinner options</p>

<img src="{{ site.baseurl }}/assets/images/dinner-handler.png">

Then she returns an answer!

<img src="{{ site.baseurl }}/assets/images/burger-place.png">

So the handler function takes an HTTP request from the connection, processes it, and returns an HTTP response back to the connection!

This is how we're able to see webpages, which I think is pretty cool.

I went on to abstract this further so you can easily add routes to your server, but this was my main takeaway! You can check out [my project](https://github.com/aftaberski/http-web-server) on Github.


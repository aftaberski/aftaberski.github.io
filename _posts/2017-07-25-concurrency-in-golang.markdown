---
layout: post
title:  "Concurrency in Go"
date:   2017-07-25 11:35:09 -0400
---

For the past week or so, I've been pairing on an [implementation of bitcoin](https://github.com/loganmhb/ktcoin) (blog post all about that coming soon!). We ended up needing multiple threads accessing the same data, which got me wondering what's the most idiomatic way of handling concurrency in Go since it has both channels and mutexes. These are a few things I learned about how to best manage concurrency in Go!

# Goroutines
Goroutines are essentially lightweight threads. Since they run in the same address space, all access to shared memory must be synchronized.

The function passed to a goroutine will be run concurrently meaning synchronous functions can continue to run while the function in the goroutine runs separately in its own thread.

The following example will start running <code>say("world")</code> in a goroutine while the main function executes <code>say("hello")</code> synchronously.

{% highlight golang %}
package main

import (
	"fmt"
	"time"
)

func say(s string) {
	for i := 0; i < 5; i++ {
		time.Sleep(100 * time.Millisecond)
		fmt.Println(s)
	}
}

func main() {
	go say("world")
	say("hello")
}
{% endhighlight %}

This will produce output that looks something like this:
{% highlight golang %}
world
hello
hello
world
world
hello
hello
world
world
hello
{% endhighlight %}

However, note that if the synchronous call following the goroutine takes less time to execute than the goroutine, the <code>main</code> function will return without returning the result of the goroutine. Note how the following example does not print <code>"world"</code> at all.
{% highlight golang %}
package main

import (
	"fmt"
	"time"
)

func saySlow(s string) {
	for i := 0; i < 5; i++ {
		time.Sleep(100 * time.Millisecond)
		fmt.Println(s)
	}
}

func sayFast(s string) {
	for i := 0; i < 5; i++ {
		fmt.Println(s)
	}
}

func main() {
	go saySlow("world")
	sayFast("hello")
}
{% endhighlight %}

Basically by running a goroutine the main function is saying "Okay, run this saySlow function over here while I pay attention to the synchronous sayFast function." The main function has already forgotten about asking the goroutine to handle the saySlow function, so it's not waiting for any results from it. If <code>sayFast</code> finishes executing before the goroutine gets a chance to execute, the main function will return anyway. This makes communication very important when executing things concurrently. And how do we communicate within goroutines? **Channels**!

# Channels
Channels are conduits that connect concurrent goroutines. They can be used to pass resources and keep goroutines in sync.


# Resources
* [A Tour of Go](https://tour.golang.org/concurrency/1)

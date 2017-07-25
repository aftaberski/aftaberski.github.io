---
layout: post
title:  "Concurrency in Go"
date:   2017-07-25 11:35:09 -0400
---

For the past week or so, I've been pairing on an [implementation of bitcoin](https://github.com/loganmhb/ktcoin) (blog post all about that coming soon!). We ended up having multiple goroutines accessing the same data, which got me wondering about the most idiomatic way of handling concurrency in Go since it has both channels and traditional locks. These are a few things I learned about how to best manage concurrency in Go!

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
Channels are conduits that connect concurrent goroutines. You put send values into channels from one goroutine and receive those values into another goroutine. This is the best way to pass resources from goroutine to goroutine.

In its simplest form, you can pass something onto a channel. And then read it somewhere else that also has access to that same channel.

{% highlight golang %}
package main

import "fmt"

func sayHey(c chan string) {
	// Put "Hey!" on the channel
	c <- "Hey!"
}

func main() {

	// Create a new channel
	messages := make(chan string)

	// Send a value to the channel
	go sayHey(messages)

	// Receive a message from the channel
	msg := <-messages
	fmt.Println(msg)
}
{% endhighlight %}

Remember that problem we saw before where the synchronous function completed before the goroutine did? We don't have to worry about that when we're waiting to receive from a channel! By default, sends and receives block until both the sender and receiver are ready, so we don't actually need to do anything else to synchronize our program!

By default, channels are **unbuffered** meaning they will only accept sends if there is a corresponding receive since there isn't a place to stash any extra values. However, we can create **buffered** channels easily.

{% highlight golang %}
package main

import "fmt"

func sayHeyTwice(c chan string) {
	// Put "Hey!" on the channel
	c <- "Hey!"
  // Put "Hey again!" on the channel
	c <- "Hey again!"
}

func main() {

	// Create a new channel with a buffer of 2
	messages := make(chan string, 2)

	// Send values to the channel
	go sayHeyTwice(messages)

	// Receive a message from the channel
	msg1, msg2 := <-messages, <-messages
	fmt.Println(msg1, msg2)
}
{% endhighlight %}

This will print out <code>"Hey! Hey again!"</code> because we sent two messages to the channel and then pulled each message off of the channel.

Remember that example from earlier again? When the goroutine wasn't even able to finish before the main function finished? We found that one way to solve it - waiting to receive a value from a channel. But what if we don't actually need anything from the goroutine? What if it just prints some stuff? That's okay! You can just pass a <code>done</code> channel to the goroutine and let it tell you when it's done with everything it needs to do.

{% highlight golang %}
package main

import "fmt"
import "time"

func sayHey(done chan bool) {
	fmt.Println("Hey!")

	// Wait a sec
	time.Sleep(time.Second)

	fmt.Println("done")

	// Send a value to the done channel
	done <- true
}

func main() {

	// Give sayHey a channel that it can tell when its finished everything
	done := make(chan bool)
	go sayHey(done)

	// Block until we receive something on the done channel
	<-done
}
{% endhighlight %}

What about waiting on multiple channel operations? You can use a **select** statement! Select statements block until one of its cases can run.

{% highlight golang %}
package main

import "fmt"

func hiBye(c chan string, bye chan int) {
	for {
		select {
		case c <- "Hi":
			fmt.Println("there")
		case <-bye:
			fmt.Println("Bye!")
			return
		}
	}
}

func receiveFromChan2Times(c chan string, bye chan int) {
	for i := 0; i < 2; i++ {
		fmt.Println(<-c)
	}
	bye <- 0
}
func main() {
	c := make(chan string)
	bye := make(chan int)

	go receiveFromChan2Times(c, bye)

	hiBye(c, bye)
}
{% endhighlight %}

This example will output the following:
{% highlight golang %}
Hi
there
there
Hi
Bye!
{% endhighlight %}

# sync.Mutex
As I mentioned earlier, Go does allow for traditional locks. But when should you use them?

According to the Go wiki page, you can usually follow this general rule:

**Channel**: Use for passing ownership of data, distributing units of work, communicating async results
**Mutex**: Use for caches and state

In the following example (mostly pulled from [A Tour of Go](https://tour.golang.org/concurrency/9)), we make sure we can only increment <code>SafeCounter</code> if no one else is using it meaning sync.Mutex is unlocked. Additionally, we can only view the value of the counter if it's unlocked. This traditional locking ensures only one goroutine is messing with the counter at one time.

{% highlight golang %}
package main

import (
	"fmt"
	"sync"
	"time"
)

// SafeCounter is safe to use concurrently.
type SafeCounter struct {
	v   int
	mux sync.Mutex
}

// Inc increments the counter for the given key.
func (c *SafeCounter) Inc() {
	c.mux.Lock()
	// Lock so only one goroutine at a time can access the map c.v.
	c.v++
	c.mux.Unlock()
}

// Value returns the current value of the counter for the given key.
func (c *SafeCounter) Value() int {
	c.mux.Lock()
	// Lock so only one goroutine at a time can access the map c.v.
	defer c.mux.Unlock()
	return c.v
}

func main() {
	c := SafeCounter{v: 1000}
	for i := 0; i < 1000; i++ {
		go c.Inc()
	}

	time.Sleep(time.Second)
	fmt.Println(c.Value())
}
{% endhighlight %}

# sync.WaitGroup
Lastly, we have **WaitGroups**, which are another primitive of the <code>sync</code> package. They allow co-operating goroutines to collectively wait for an event before proceeding independently again.

The main goroutine calls <code>Add</code> to set the number of goroutines to wait for. Then each of the goroutines runs and calls <code>Done</code> when it's finished. At the same time, Wait can be used to block until all goroutines have finished

Here is a silly example:
{% highlight golang %}
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	var names = []string{
		"Anna",
		"Caroline",
		"Lindsey",
	}
	for _, name := range names {
		// Increment the WaitGroup counter.
		wg.Add(1)
		// Launch a goroutine to say hey to everyone
		go func(name string) {
			// Decrement the counter when the goroutine completes.
			defer wg.Done()
			// Say hey
			fmt.Println("Hey", name, "!")

		}(name)
	}
	// Wait for goroutine to say hey to everyone
	wg.Wait()
}
{% endhighlight %}

# Conclusion

There are a few ways of handling concurrency in Go! Traditional locking should generally be used for simple stateful blocking while channels can be used for more complex communication and synchronization.

If you're interested in reading more about concurrency, I highly recommend Rob Pike's talk on *Go Concurrency Patterns*.

# Resources
* [A Tour of Go](https://tour.golang.org/concurrency/1)
* [Go by Example](https://gobyexample.com/goroutines)
* [GoLang Wiki - MutexOrChannel](https://github.com/golang/go/wiki/MutexOrChannel)
* [Concurrency is not Parallelism](https://vimeo.com/49718712) ([slides](https://talks.golang.org/2012/waza.slide#1))
* [Go Concurrency Patterns](https://www.youtube.com/watch?v=f6kdp27TYZs) ([slides](https://talks.golang.org/2012/concurrency.slide#1))

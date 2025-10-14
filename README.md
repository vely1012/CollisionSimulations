# Collision Simulations

## Description

An educational project aimed at studying collision simulation development in general and the Quad Tree data structure as a way of improving its performance specifically, as well as solidifying the fundamental stack of front-end technologies.

## Goals

1. Using HTML/CSS/JavaScript, implement two elastic collision simulations: the full-search simulation that uses a naive approach for collision detection, and a quad-tree simulation that uses the mentioned data structure to improve collision detection time compared to full-search.

2. Compare the performance of each version of simulation.

## Functionality

For better testing performance, a keyboard simulation control system was implemented. Currently it provides these features:

| Function | Key | Hint Word |
|----------|-----|-----------|
| Play/Stop | Space | - |
| Restart | x | - |
| Quick restart | q | quick |
| Save state | s | save |
| Load state | b | back |
| Start autosave | Shift + s | save |
| Stop autosave | c | cancel |
| Iterate | i | iterate |
| Switch simulation focus | a | alternate |
| Iterate reverse | Shift + i | iterate |
| Iterate both | . (also >) | - |
| Iterate both reverse | , (also <) | - |
| Increase focused simulation speed | ArrowUp | speed up |
| Decrease focused simulation speed | ArrowDown | slow down |
| Rewind | r | rewind |

Using the browser's developer console allows for more complex manipulations with simulations, such as loading predefined bubble samples (which were discovered/created during development), influencing bubble generation, or attaching `EndCycleActions` for demonstration purposes. Check the [script.js](./script.js) file to learn about these features and how to use them. 

## Overcome Challenges

The following sections document the history of the project's development, highlighting various problems that had to be solved in order to complete it.

### Object Rendering

For rendering colliding bubbles (colliding objects), this approach was chosen: each bubble is a web element - `<div class="bubble"></div>`. Its appearance and position on screen, while determined mostly by its class rule, can be changed at any moment by modifying crucial CSS variables (like `--x`, `--y`, etc.) within the element's inline style.

As a result, we have a neatly styled object whose appearance and position is easy to manipulate.

### Collision Resolution

As I'm not a "physics" person, I had to study the elastic collision topic. Fortunately, I stumbled upon Daniel Shiffman's [video](https://youtu.be/dJNFPv9Mj-Y?si=i9CSiSBhg6ZDwlkU&t=1004) about collision simulation and was able to implement the collision resolution formula provided in it.

Nevertheless, I encountered some energy conservation issues. After a few unsuccessful attempts to fix the collision resolution, I decided to [ask](./cursor_chats/cursor_fixing_energy_conservation_issue.md) Cursor's AI for some fixes. It helped and the problem was solved.

Investigating the calculation approach provided by AI, I realized that the energy conservation problem was likely related to my overcomplicated dot product calculation: instead of simple multiplication of vector coordinates, for some reason I decided to calculate it using magnitudes and the cosine formula. Oh well, physics is not my only weakness i guess.

### Quad Tree

For me, this was the hardest part of the whole project. I have never implemented such a complex data structure before, so I had to resort to educational materials once again.

Considering the "Collision Resolution" experience, I decided to search for other Daniel Shiffman educational videos and found a [series](https://youtu.be/OJxEcs0w_kE?si=x4r68LJVN7hC3YMA) about quad trees. Ultimately, I ended up almost copying his approach. As of now, it seems that the only difference between mine and his quad tree lies in subdivision: Daniel decided to add all the items one by one, while I went for passing arrays of them when subdividing.

#### Circle-Rectangle Intersection

The ability to quickly find neighboring elements is the core advantage of a quad tree.

To find all bubbles that are close to some specific *target bubble*, we need to iterate through all branches that contain it or intersect with it. The latter was harder for me to implement, so let's focus on it.

Even though I could not provide a definitive proof of it, after some tests in my [pen](https://codepen.io/vely1012/pen/yyeoyEv) I figured out that detecting circle-rectangle intersection could be reduced to another problem: is a point within or outside of a rectangle with rounded corners?

The solution for this problem became a part of the QuadTree query implementation. 

#### Debugging

To debug quad tree iteration, I had to visualize it: being able to see the whole quad tree and highlight some of its branches could be very useful.

My way of visualizing the quad tree was to outline the boundaries of its `rect` property. I did so by drawing rectangles on the `<div class="bubbles-window"></div>` element, using CSS background techniques. Here's my initial [sketch](https://codepen.io/vely1012/pen/pvgwXPj).

### Unimpressive Performance

After finishing both full-search and quad-tree simulation classes, the time for comparing them had finally come.

It was then that I found out that both simulations are roughly equal when it comes to performance. Surprised by discovery, I tried rewriting the QuadTree data structure class but ended up just refactoring essentially.

Once again I resorted to AI. This time I [asked](./cursor_chats/cursor_brainstorming_performance_issue.md) Cursor chat for an investigation plan. The responce was really insightful because at the moment I was mostly focused on QuadTree `query()` method and have not even thought about measuring time for different stages of `doCycle()` methods. These hints helped me perform a proper debugging experiment that prooved that there were no issue with QuadTree structure.

Turns out that actually my rendering approach simply was not fast enough for running simulations at scales that really make the simulation performance difference observable.

### Display the Difference

To overcome rendering constraints, I decided to implement a rewinding feature that allows running multiple cycles of simulation without rendering intermediate system state.

This is a very simple, even cheesy/hacky solution I would say, but it made actual performance comparison possible, marking the project's final stages.

### Refactoring

Multiple times throughout the project development, I had to refactor the code: as it was becoming more and more complex, it was important to untangle such problems as code duplication or convoluted execution process (script.js).

Some of this process is documented by this exported Cursor [chat](./cursor_chats/cursor_refactor_simulations_js.md).

## Results

- A quad tree data structure and more optimal collision simulation based on it were implemented
- Results of the simulations performance comparison confirm the superiority of the quad tree approach
- I've deepened my knowledge of fundamental front-end technologies and DSA
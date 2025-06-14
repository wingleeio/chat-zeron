This is my entry project for the T3 Chat Cloneathon

# Notes

Some of the goals I wanted to achieve while building this are:

- Resumable streaming (streams continue on refresh)
- Server side rendering

This turned out to be a challenging task while using the `persistent-text-streaming` component for Convex. I solved this by identifying
which messages are currently being streamed and which messages can be rendered server side. This created more problems regarding the state
of components within my `UIMessage` component which I have temporarily solved by using `tanstack-store` which I would like to organize more
when I revisit certain elements like `ReasoningPart`.

I also attempted to use the `Agent` component from Convex however there seems to be no server side rendering support currently, making it
challenging to accomplish what I am hoping to accomplish with this application.

### Jun 14, 2025 Notes

Yesterday worked on features like branching, chat sharing, etc.

Also deployed the application to vercel. I am a bit disappointed in the routing performance. Struggling to stop myself from converting the
entire application to be client side rendered as opposed to SSR. I am likely doing something incorrectly, and I will debug this further today.

My goal today is to implement image uploads and image generation. If time allows I would like to play around with potentially creating a deep
research tool today as well.

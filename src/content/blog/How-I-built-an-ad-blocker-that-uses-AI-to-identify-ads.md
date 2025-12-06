---
heroImage: /src/assets/images/Gemini_Generated_Image_voy3c8voy3c8voy3.png
category: Programming
description: .
pubDate: 2025-12-04T18:30:00.000Z
draft: false
tags:
  - neural networks
  - javascript
title: How I built an ad-blocker that uses AI to identify ads
---

A few months ago, a friend of mine living abroad asked me if I can build a take home assignment for a company he failed to solve. The assignment asks to build a ad blocker powered by AI. More specifically, the end state is a browser extension that has options to block or highlight ads detected on a page. I took a hard look and decided to have a crack at it

## Defining the problem

We all know ads are nasty. They can come in different sizes and types like text, images, videos, gifs, Iframes etc. I suspected that video processing would be a hard problem, so I just sticked to identifying text and ad images. Another problem I quickly encountered was, after building a basic ad-blocking system, I observed that ads are not static, apart from being injected at page loading, the scripts loaded can inject ads any time after the page is loaded. So, my solution needed to accommodate that too. Another problem I faced along the way is performance. We need to have low latency while rendering the page. Asynchronous nature would be highly welcome. This ties heavily with model deployment strategy.

Let's formulate our requirements

1. Detect ad text and ad images
2. Block them
3. The entire workflow needs to run when a page is loaded. So page loading performance should not be heavily impacted
4. The interface should be a browser extension

## Initial Ideas on Architecture

1. Send the entire page to a backend to purge ads and replace the rendered html with new html in response
   - This will work if all ads are loaded the first time a page is rendered, but as we saw above, scripts can inject ads anytime during the life cycle of a webpage. So this won't work effectively
2. Send individual pieces of text, images to backend for ad detection
   - Also, set up a mutation observer to observe new images or text content that is loaded on to the DOM
   - We can also include the metadata such as class list, image alts and other attributes

(Meanwhile something strung up in my mind. A quick detour...)

## How do existing ad-blockers do it?

I use ad blockers quite a lot, so I looked into the one I use; **UBlock Origin**. So the way ublock and other ad blockers block ads is quite simple, they have a community list of all the domains ads are being served from and they just block all the requests coming from them during the lifetime of a webpage. This community list is called easylist. However, because ad networks can deliver ad content through different ad domains, this doesn't work for us. We shouldn't rely on static domain blocking. After all, that's why we are using AI right!

But this detour turned to be quite useful for me, because I discovered that _instead of analysing content on DOM, we can analyse network requests_ and cancel the requests if the content is ad-related. Wow! So, I went and explored this direction before I hit a major road block that changes the game. **Chrome disabled the API that allows extension builders to block network requests programmatically**. Screw you Google!

**I had no option but to choose Mozilla Firefox**. But the upside of going on this detour is that I discovered even better flow, **intercept network responses, send them to backend and cancel them if the server says that they have ad-content.**

## The role of AI in Ad Detection

This is the core of the problem, isn't it?

​ Simple keyword matching doesn't work, we need some sort of semantic matching. Let me preface my saying that I spent lot of time on **image ads**. That's what we will focus on as they will provide maximum gains to our final product. I don't know how but I came across this model from OPENAI called [**CLIP**](https://openai.com/index/clip/) or **Contrastive Language-Image pretraining**. Essentially, you give an image and set of labels, the model will tell you how closely the image matches a label in percentage. The higher percentage, the more likely it is to be the same as what the label descibed. Well, I can just have a set of labels such as _ad, sponsored, Advertisement_ etc and pass them along with downloaded image from network request to the CLIP model. Based on the response, if any of the above labels have a confidence of say 75%, I will block the request.

I can do the same thing with a pretrained BERT based Classification model for text content.

So, I set out to build this before I hit a problem yet again...

## The Challenge of deploying ML models

For installing the clip model in python, I had to download _transformers_ library which in turned downloaded close to _100 GB_ of CUDA, pytorch dependencies. They took forever to install, the latency of sending a request to backend and waiting is quite bad even when I pre-loaded the model during startup. I thought there's no way this thing can be deployed. By this time, I was getting frustrated and almost quit the project for a while, not to mention, I was using claude code at this time and it was rate-limiting horribly and it was hallucinating very badly. I put aside the project for some time before I picked it up again.

## Catharsis

This time, I came across a library and a ML runtime that runs pretrained models directly in the browser without needing to have a backend. Not to mention, the size of the binary is very small. I think it's about 1.3 mb or something like that. It's called **transformers.js** powered by **ONNX Runtime** which can use your cpu and gpu through **WASM**. This is the lifeline of this project. And that's what I did.

![Screenshot from 2025-08-05 14-22-22.png](https://github.com/AdityaSanthosh/Browser-Native-AI-Ad-Blocker/blob/master/Screenshot%20from%202025-08-05%2014-22-22.png?raw=true)

_I tested all of my strategies on MSN.com._

In the right side, you can see the network requests being blocked by my extension with the following text

<p style="color:red">Blocked by AI based Ad Blocker</p>

You can check out the code at https://github.com/AdityaSanthosh/Browser-Native-AI-Ad-Blocker.

The code is just a representation of my final solution. It's not working flawlessly as I don't have enough time to spend on this project anymore. Maybe I will revisit this project in future.

If you read till here, thank you. it means a lot

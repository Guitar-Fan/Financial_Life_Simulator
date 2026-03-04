Workers Bindings
This guide will instruct you through setting up and deploying your first Workers AI project. You will use Workers, a Workers AI binding, and a large language model (LLM) to deploy your first AI-powered application on the Cloudflare global network.

Sign up for a Cloudflare account ↗.
Install Node.js ↗.
Node.js version manager
1. Create a Worker project
You will create a new Worker project using the create-cloudflare CLI (C3). C3 ↗ is a command-line tool designed to help you set up and deploy new applications to Cloudflare.

Create a new project named hello-ai by running:

npm
yarn
pnpm
Terminal window
npm create cloudflare@latest -- hello-ai

Running npm create cloudflare@latest will prompt you to install the create-cloudflare package ↗, and lead you through setup. C3 will also install Wrangler, the Cloudflare Developer Platform CLI.

For setup, select the following options:

For What would you like to start with?, choose Hello World example.
For Which template would you like to use?, choose Worker only.
For Which language do you want to use?, choose TypeScript.
For Do you want to use git for version control?, choose Yes.
For Do you want to deploy your application?, choose No (we will be making some changes before deploying).
This will create a new hello-ai directory. Your new hello-ai directory will include:

A "Hello World" Worker at src/index.ts.
A wrangler.jsonc configuration file.
Go to your application directory:

Terminal window
cd hello-ai

2. Connect your Worker to Workers AI
You must create an AI binding for your Worker to connect to Workers AI. Bindings allow your Workers to interact with resources, like Workers AI, on the Cloudflare Developer Platform.

To bind Workers AI to your Worker, add the following to the end of your Wrangler file:

wrangler.jsonc
wrangler.toml
{
  "ai": {
    "binding": "AI"
  }
}

Your binding is available in your Worker code on env.AI.

You can also bind Workers AI to a Pages Function. For more information, refer to Functions Bindings.

3. Run an inference task in your Worker
You are now ready to run an inference task in your Worker. In this case, you will use an LLM, llama-3.1-8b-instruct, to answer a question.

Update the index.ts file in your hello-ai application directory with the following code:

JavaScript
TypeScript
index.js
export default {
  async fetch(request, env) {
    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt: "What is the origin of the phrase Hello, World",
    });

    return new Response(JSON.stringify(response));
  },
};

Up to this point, you have created an AI binding for your Worker and configured your Worker to be able to execute the Llama 3.1 model. You can now test your project locally before you deploy globally.

4. Develop locally with Wrangler
While in your project directory, test Workers AI locally by running wrangler dev:

Terminal window
npx wrangler dev

Workers AI local development usage charges

Using Workers AI always accesses your Cloudflare account in order to run AI models and will incur usage charges even in local development.

You will be prompted to log in after you run wrangler dev. When you run npx wrangler dev, Wrangler will give you a URL (most likely localhost:8787) to review your Worker. After you go to the URL Wrangler provides, a message will render that resembles the following example:

{
  "response": "Ah, a most excellent question, my dear human friend! *adjusts glasses*\n\nThe origin of the phrase \"Hello, World\" is a fascinating tale that spans several decades and multiple disciplines. It all began in the early days of computer programming, when a young man named Brian Kernighan was tasked with writing a simple program to demonstrate the basics of a new programming language called C.\nKernighan, a renowned computer scientist and author, was working at Bell Labs in the late 1970s when he created the program. He wanted to showcase the language's simplicity and versatility, so he wrote a basic \"Hello, World!\" program that printed the familiar greeting to the console.\nThe program was included in Kernighan and Ritchie's influential book \"The C Programming Language,\" published in 1978. The book became a standard reference for C programmers, and the \"Hello, World!\" program became a sort of \"Hello, World!\" for the programming community.\nOver time, the phrase \"Hello, World!\" became a shorthand for any simple program that demonstrated the basics"
}

5. Deploy your AI Worker
Before deploying your AI Worker globally, log in with your Cloudflare account by running:

Terminal window
npx wrangler login

You will be directed to a web page asking you to log in to the Cloudflare dashboard. After you have logged in, you will be asked if Wrangler can make changes to your Cloudflare account. Scroll down and select Allow to continue.

Finally, deploy your Worker to make your project accessible on the Internet. To deploy your Worker, run:

Terminal window
npx wrangler deploy

https://hello-ai.<YOUR_SUBDOMAIN>.workers.dev

Your Worker will be deployed to your custom workers.dev subdomain. You can now visit the URL to run your AI Worker.

By finishing this tutorial, you have created a Worker, connected it to Workers AI through an AI binding, and ran an inference task from the Llama 3 model.

Related resources
Cloudflare Developers community on Discord ↗ - Submit feature requests, report bugs, and share your feedback directly with the Cloudflare team by joining the Cloudflare Discord server.
Models - Browse the Workers AI models catalog.
AI SDK - Learn how to integrate with an AI model.
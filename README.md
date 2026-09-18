# WorkQueue (Node.js)

A Distributed Background Task Processing System written in Node.js, using Redis for job queuing.

## What's the need for this?

This system is designed to handle the processing and execution of background tasks concurrently to improve user experience.

**Example:** When a user signs in to your website and clicks the login button, you might want to send them a welcome email. If that email task is part of the API call, the user would have to wait until the email is sent. Instead, you can add the `send_email` task to WorkQueue and let it handle the execution in the background.

**Note:** This is built to be modular — any type of job can be added to it, not just sending emails. You just need to add the logic for that job as described below.

## Services

This repo provides two independent services:

### 1. Producer

Provides an `/enqueue` route to add your jobs/tasks.

#### How to add a job?

- Send an HTTP POST request to the exposed `/enqueue` route on this URL: `http://localhost:4000/enqueue`
- It accepts a task in this format (JSON):

**Example:** An inbuilt task the system supports is sending an email. Its JSON request would look like this:

```json
{
    "type": "send_email",
    "retries": 3,
    "payload": {
        "to": "worldisweird2020@gmail.com",
        "subject": "testing producer"
    }
}
```

- **type** — REQUIRED. Tells the producer the type of job being added to the queue.
- **retries** — Number of times the system should try to process the job if it fails.
- **payload** — Contains details about the task in key-value pairs (you can add any type/number of key-value pairs inside the payload, since it's stored and parsed as a flexible JSON object).

This is the shape of the task object, defined as a JSDoc typedef / validated at runtime:

```js
/**
 * @typedef {Object} Task
 * @property {string} type
 * @property {Object.<string, any>} payload
 * @property {number} retries
 */
```

The response will look like this:

```json
{
    "status": "queued",
    "taskId": "b3f1c2e0-1234-4a5b-9c8d-abcdef123456"
}
```

### 2. Worker

- Takes the jobs from the queue in a reliable manner and executes them
- Provides a `/metrics` endpoint to view statistics

#### How to view the status of your jobs?

Send an HTTP GET request to `http://localhost:4001/metrics`

This will give a response like this:

```json
{
    "total_jobs_in_queue": 4,
    "jobs_done": 128,
    "jobs_failed": 2
}
```

- **total_jobs_in_queue** — Number of jobs inside the Redis queue at that moment
- **jobs_done** — Total number of jobs executed so far
- **jobs_failed** — Number of jobs that failed to execute, if any

## How are jobs executed?

Inside `shared/taskTypes.js`, you'll find the job dispatcher. It's built as a lookup map, so you can add your job type just by adding another entry — no long if/else chain.

**To add a new type of task:** Just add its handler function to the map, and that's it!

```js
const taskHandlers = {
  send_email: async (payload) => {
    await sleep(2000);
    console.log(`Sending email to ${payload.to} with subject ${payload.subject}`);
  },
  resize_image: async (payload) => {
    console.log(`Resizing image to x: ${payload.new_x}, y: ${payload.new_y}`);
  },
  generate_pdf: async (payload) => {
    console.log("Generating pdf...");
  },
};

async function processTask(task) {
  if (!task.payload) throw new Error("payload is empty");
  if (!task.type) throw new Error("task type is empty");

  const handler = taskHandlers[task.type];
  if (!handler) throw new Error("unsupported task");

  return handler(task.payload);
}
```

## Additional features

- **Concurrency** is provided via Node's async/await and a bounded worker pool, so multiple jobs can be in flight without blocking the event loop.
- **Logging** of each event is provided and stored inside the `logs.txt` file. This helps to trace back the success or failure of a job.

## Tech stack

- **Express** — HTTP layer for both the producer and worker services
- **ioredis** — Redis client for queuing (`LPUSH` / `BRPOP`)
- **dotenv** — environment configuration

## Getting started

```bash
git clone <this-repo>
cd workqueue-node
npm install
cp .env.example .env   # set REDIS_URL, ports, etc.

# start Redis (if not already running)
docker run -p 6379:6379 redis

# in separate terminals
npm run producer
npm run worker
```

---
